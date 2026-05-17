const rideModel = require('../models/ride.model');
const captainModel = require('../models/captain.model');
const mapService = require('./maps.service');
const crypto = require('crypto');
const { getFrontendBaseUrl, getStripeClient } = require('./stripe.service');

const DISPATCH_RADIUS_KM = 15;
const CAPTAIN_HEARTBEAT_WINDOW_MS = 90 * 1000;

const toRadians = (value) => (value * Math.PI) / 180;

const getDistanceKm = (origin, destination) => {
    if (![origin?.lat, origin?.lng, destination?.lat, destination?.lng].every(Number.isFinite)) {
        return null;
    }

    const earthRadiusKm = 6371;
    const latDelta = toRadians(destination.lat - origin.lat);
    const lngDelta = toRadians(destination.lng - origin.lng);
    const a =
        Math.sin(latDelta / 2) * Math.sin(latDelta / 2) +
        Math.cos(toRadians(origin.lat)) *
        Math.cos(toRadians(destination.lat)) *
        Math.sin(lngDelta / 2) *
        Math.sin(lngDelta / 2);

    return earthRadiusKm * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

const getConfidenceLabel = (score) => {
    if (score >= 80) return 'High';
    if (score >= 55) return 'Medium';
    return 'Low';
}

const getDemandLevel = (rideCount) => {
    if (rideCount >= 8) return 'High demand';
    if (rideCount >= 3) return 'Active zone';
    return 'Normal demand';
}

const vehicleLabels = {
    car: 'GoNexiCar',
    moto: 'GoNexiMoto',
    auto: 'GoNexiAuto',
}

const getOnlineCaptainQuery = () => ({
    status: 'active',
    socketId: { $exists: true, $nin: [null, ''] },
    lastSeenAt: { $gte: new Date(Date.now() - CAPTAIN_HEARTBEAT_WINDOW_MS) },
    'location.lat': { $exists: true },
    'location.lng': { $exists: true },
});

const getRideCreatedAt = (ride) => {
    if (ride?.createdAt instanceof Date) {
        return ride.createdAt;
    }

    if (ride?.createdAt) {
        const createdAt = new Date(ride.createdAt);
        if (!Number.isNaN(createdAt.getTime())) {
            return createdAt;
        }
    }

    return ride?._id?.getTimestamp?.() || new Date();
}

module.exports.findMatchingCaptainsForPickup = async ({ pickup, vehicleType }) => {
    if (!pickup || !vehicleType) {
        throw new Error('Pickup and vehicle type are required');
    }

    const pickupCoordinates = await mapService.getAddressCoordinate(pickup);
    const captains = await captainModel.find({
        ...getOnlineCaptainQuery(),
        'vehicle.vehicleType': vehicleType,
    });

    const matchingCaptains = captains
        .map((captain) => ({
            captain,
            distanceKm: getDistanceKm(captain.location, pickupCoordinates),
        }))
        .filter((entry) => entry.distanceKm !== null && entry.distanceKm <= DISPATCH_RADIUS_KM)
        .sort((a, b) => a.distanceKm - b.distanceKm)
        .map((entry) => {
            entry.captain.pickupDistanceKm = Number(entry.distanceKm.toFixed(1));
            return entry.captain;
        });

    return { pickupCoordinates, matchingCaptains };
}


async function getFare(pickup, destination) {

    if (!pickup || !destination) {
        throw new Error('Pickup and destination are required');
    }

    const distanceTime = await mapService.getDistanceTime(pickup, destination);
    console.log(distanceTime)

    const baseFare = {
        auto: 30,
        car: 50,
        moto: 20
    };

    const perKmRate = {
        auto: 10,
        car: 15,
        moto: 8
    };

    const perMinuteRate = {
        auto: 2,
        car: 3,
        moto: 1.5
    };



    const fare = {
        auto: Math.round(baseFare.auto + ((distanceTime.distance / 1000) * perKmRate.auto) + ((distanceTime.duration / 60) * perMinuteRate.auto)),
        car: Math.round(baseFare.car + ((distanceTime.distance / 1000) * perKmRate.car) + ((distanceTime.duration / 60) * perMinuteRate.car)),
        moto: Math.round(baseFare.moto + ((distanceTime.distance / 1000) * perKmRate.moto) + ((distanceTime.duration / 60) * perMinuteRate.moto))
    };

    return fare;
}

module.exports.getFare = getFare;


function getOtp(num) {
    function generateOtp(num) {
        const otp = crypto.randomInt(Math.pow(10, num - 1), Math.pow(10, num)).toString();
        return otp;
    }
    return generateOtp(num);
}


module.exports.createRide = async ({
    user, pickup, destination, vehicleType
}) => {
    if (!user || !pickup || !destination || !vehicleType) {
        throw new Error('All fields are required');
    }

    const pendingPaymentRide = await rideModel.findOne({
        user,
        status: 'completed',
        paymentStatus: { $in: ['unpaid', 'pending', 'failed'] },
    }).sort({ completedAt: -1, updatedAt: -1, createdAt: -1 });

    if (pendingPaymentRide) {
        throw new Error('Complete your pending ride payment before booking another ride');
    }

    const fare = await getFare(pickup, destination);

    const ride = rideModel.create({
        user,
        pickup,
        destination,
        vehicleType,
        otp: getOtp(6),
        fare: fare[ vehicleType ],
    })

    return ride;
}

module.exports.findAvailableRidesForCaptain = async ({ captain, limit = 10 }) => {
    if (!captain) {
        throw new Error('Captain is required');
    }

    const vehicleType = captain.vehicle?.vehicleType;

    if (!vehicleType) {
        throw new Error('Captain vehicle type is required');
    }

    const rides = await rideModel.find({
        status: 'pending',
        vehicleType,
    })
        .populate('user')
        .sort({ createdAt: -1, _id: -1 })
        .limit(limit);

    const rankedRides = await Promise.all(rides.map(async (ride) => {
        const rideObject = ride.toObject();
        let pickupCoordinates = null;
        let pickupDistanceKm = null;

        try {
            pickupCoordinates = await mapService.getAddressCoordinate(ride.pickup);
            pickupDistanceKm = getDistanceKm(captain.location, pickupCoordinates);
        } catch (error) {
            pickupCoordinates = null;
        }

        const distanceScore = pickupDistanceKm === null
            ? 45
            : Math.max(0, 100 - Math.round(pickupDistanceKm * 9));
        const fareScore = Math.min(35, Math.round((ride.fare || 0) / 45));
        const createdAt = getRideCreatedAt(ride);
        const freshnessScore = Math.max(0, 20 - Math.floor((Date.now() - createdAt.getTime()) / 60000));
        const matchScore = Math.min(100, distanceScore + fareScore + freshnessScore);

        return {
            ...rideObject,
            pickupCoordinates,
            pickupDistanceKm: pickupDistanceKm === null ? null : Number(pickupDistanceKm.toFixed(1)),
            estimatedPickupMinutes: pickupDistanceKm === null ? null : Math.max(2, Math.round(pickupDistanceKm * 3)),
            matchScore,
            matchLabel: getConfidenceLabel(matchScore),
            matchReasons: [
                pickupDistanceKm === null ? 'Pickup distance unavailable' : `${pickupDistanceKm.toFixed(1)} km pickup`,
                `Rs. ${ride.fare} fare`,
                vehicleType === captain.vehicle?.vehicleType ? 'Vehicle type match' : 'Vehicle type check',
            ],
        };
    }));

    return rankedRides.sort((a, b) => b.matchScore - a.matchScore);
}

module.exports.getRideConfidence = async ({ pickup, destination, vehicleType }) => {
    if (!pickup || !destination || !vehicleType) {
        throw new Error('Pickup, destination, and vehicle type are required');
    }

    const pickupCoordinates = await mapService.getAddressCoordinate(pickup);
    const nearbyCaptains = await captainModel.find({
        ...getOnlineCaptainQuery(),
        'vehicle.vehicleType': vehicleType,
    });

    const captainsWithDistance = nearbyCaptains
        .map((captain) => ({
            captain,
            distanceKm: getDistanceKm(captain.location, pickupCoordinates),
        }))
        .filter((entry) => entry.distanceKm !== null)
        .sort((a, b) => a.distanceKm - b.distanceKm);

    const nearbyCount = captainsWithDistance.filter((entry) => entry.distanceKm <= DISPATCH_RADIUS_KM).length;
    const closestDistanceKm = captainsWithDistance[0]?.distanceKm ?? null;
    const activePendingRides = await rideModel.countDocuments({
        status: 'pending',
        vehicleType,
    });

    let score = 35;
    score += Math.min(35, nearbyCount * 12);
    score += closestDistanceKm === null ? 0 : Math.max(0, 20 - Math.round(closestDistanceKm * 2));
    score -= Math.min(20, Math.max(0, activePendingRides - nearbyCount) * 4);
    score = Math.max(10, Math.min(95, score));

    return {
        score,
        label: getConfidenceLabel(score),
        expectedWaitMinutes: nearbyCount > 0 ? Math.max(2, Math.round((closestDistanceKm || 1) * 2.5)) : 8,
        nearbyCaptains: nearbyCount,
        activePendingRides,
        demandLevel: getDemandLevel(activePendingRides),
        pickupCoordinates,
        insights: [
            nearbyCount > 0 ? `${nearbyCount} matching captain${nearbyCount === 1 ? '' : 's'} nearby` : 'No nearby matching captain currently active',
            closestDistanceKm === null ? 'Closest pickup distance unavailable' : `Closest captain about ${closestDistanceKm.toFixed(1)} km away`,
            getDemandLevel(activePendingRides),
        ],
    };
}

module.exports.getRideOptions = async ({ pickup, destination }) => {
    if (!pickup || !destination) {
        throw new Error('Pickup and destination are required');
    }

    const [fare, pickupCoordinates] = await Promise.all([
        getFare(pickup, destination),
        mapService.getAddressCoordinate(pickup),
    ]);

    const activeCaptains = await captainModel.find(getOnlineCaptainQuery());

    return ['car', 'moto', 'auto'].map((vehicleType) => {
        const matchingCaptains = activeCaptains
            .filter((captain) => captain.vehicle?.vehicleType === vehicleType)
            .map((captain) => ({
                distanceKm: getDistanceKm(captain.location, pickupCoordinates),
            }))
            .filter((entry) => entry.distanceKm !== null)
            .sort((a, b) => a.distanceKm - b.distanceKm);

        const availableCaptains = matchingCaptains.filter((entry) => entry.distanceKm <= DISPATCH_RADIUS_KM);
        const closestDistanceKm = matchingCaptains[0]?.distanceKm ?? null;
        const estimatedPickupMinutes = closestDistanceKm === null
            ? null
            : Math.max(2, Math.round(closestDistanceKm * 3));

        return {
            type: vehicleType,
            name: vehicleLabels[vehicleType],
            fare: fare[vehicleType],
            availableCaptains: availableCaptains.length,
            closestDistanceKm: closestDistanceKm === null ? null : Number(closestDistanceKm.toFixed(1)),
            estimatedPickupMinutes,
            isAvailable: availableCaptains.length > 0,
        };
    });
}

module.exports.cancelPendingRideForUser = async ({ rideId, userId }) => {
    if (!rideId || !userId) {
        throw new Error('Ride id and user id are required');
    }

    const ride = await rideModel.findOne({
        _id: rideId,
        user: userId,
        status: 'pending',
    }).populate('user').populate('captain');

    if (!ride) {
        throw new Error('Pending ride not found');
    }

    ride.status = 'cancelled';
    await ride.save();

    return ride;
}

module.exports.confirmRide = async ({
    rideId, captain
}) => {
    if (!rideId) {
        throw new Error('Ride id is required');
    }

    const acceptedRide = await rideModel.findOneAndUpdate({
        _id: rideId,
        status: 'pending',
    }, {
        status: 'accepted',
        captain: captain._id
    }, {
        new: true,
    })

    if (!acceptedRide) {
        throw new Error('Ride is no longer available');
    }

    const ride = await rideModel.findOne({
        _id: rideId
    }).populate('user').populate('captain').select('+otp');

    if (!ride) {
        throw new Error('Ride not found');
    }

    return ride;

}

module.exports.startRide = async ({ rideId, otp, captain }) => {
    if (!rideId || !otp) {
        throw new Error('Ride id and OTP are required');
    }

    const ride = await rideModel.findOne({
        _id: rideId
    }).populate('user').populate('captain').select('+otp');

    if (!ride) {
        throw new Error('Ride not found');
    }

    if (ride.status !== 'accepted') {
        throw new Error('Ride not accepted');
    }

    if (ride.otp !== otp) {
        throw new Error('Invalid OTP');
    }

    await rideModel.findOneAndUpdate({
        _id: rideId
    }, {
        status: 'ongoing',
        startedAt: new Date(),
    })

    const updatedRide = await rideModel.findOne({
        _id: rideId
    }).populate('user').populate('captain').select('+otp');

    return updatedRide;
}

module.exports.endRide = async ({ rideId, captain }) => {
    if (!rideId) {
        throw new Error('Ride id is required');
    }

    const ride = await rideModel.findOne({
        _id: rideId,
        captain: captain._id
    }).populate('user').populate('captain').select('+otp');

    if (!ride) {
        throw new Error('Ride not found');
    }

    if (ride.status !== 'ongoing') {
        throw new Error('Ride not ongoing');
    }

    await rideModel.findOneAndUpdate({
        _id: rideId
    }, {
        status: 'completed',
        completedAt: new Date(),
    })

    const updatedRide = await rideModel.findOne({
        _id: rideId
    }).populate('user').populate('captain').select('+otp');

    return updatedRide;
}

module.exports.findRideForUser = async ({ rideId, userId }) => {
    if (!rideId || !userId) {
        throw new Error('Ride id and user id are required');
    }

    const ride = await rideModel.findOne({
        _id: rideId,
        user: userId,
    }).populate('user').populate('captain');

    if (!ride) {
        throw new Error('Ride not found');
    }

    return ride;
}

module.exports.findPendingPaymentRideForUser = async ({ userId }) => {
    if (!userId) {
        throw new Error('User id is required');
    }

    const ride = await rideModel.findOne({
        user: userId,
        status: 'completed',
        paymentStatus: { $in: ['unpaid', 'pending', 'failed'] },
    }).populate('user').populate('captain').sort({ completedAt: -1, updatedAt: -1, createdAt: -1 });

    return ride;
}

module.exports.createStripeCheckoutSession = async ({ rideId, user }) => {
    if (!rideId || !user) {
        throw new Error('Ride id and user are required');
    }

    const ride = await rideModel.findOne({
        _id: rideId,
        user: user._id,
    }).populate('captain');

    if (!ride) {
        throw new Error('Ride not found');
    }

    if (ride.paymentStatus === 'paid') {
        return { ride, sessionUrl: null, alreadyPaid: true };
    }

    const stripe = getStripeClient();
    const frontendBaseUrl = getFrontendBaseUrl();
    const successUrl = `${frontendBaseUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}&ride_id=${ride._id}`;
    const cancelUrl = `${frontendBaseUrl}/riding?ride_id=${ride._id}&payment=cancelled`;

    const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
        customer_email: user.email,
        payment_method_types: ['card'],
        line_items: [
            {
                price_data: {
                    currency: ride.paymentCurrency || 'inr',
                    product_data: {
                        name: 'GoNexi Ride Payment',
                        description: `${ride.pickup} to ${ride.destination}`,
                    },
                    unit_amount: ride.fare * 100,
                },
                quantity: 1,
            },
        ],
        metadata: {
            rideId: ride._id.toString(),
            userId: user._id.toString(),
        },
    });

    ride.paymentMethod = 'stripe';
    ride.paymentStatus = 'pending';
    ride.stripeCheckoutSessionId = session.id;
    await ride.save();

    return { ride, sessionUrl: session.url, alreadyPaid: false };
}

module.exports.verifyStripeCheckoutSession = async ({ rideId, sessionId, userId }) => {
    if (!rideId || !sessionId || !userId) {
        throw new Error('Ride id, session id, and user id are required');
    }

    const ride = await rideModel.findOne({
        _id: rideId,
        user: userId,
    }).populate('user').populate('captain');

    if (!ride) {
        throw new Error('Ride not found');
    }

    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    const isValidRideSession =
        session.metadata?.rideId === ride._id.toString() &&
        ride.stripeCheckoutSessionId === session.id;

    if (!isValidRideSession) {
        throw new Error('Invalid Stripe checkout session for this ride');
    }

    if (session.payment_status === 'paid') {
        ride.paymentMethod = 'stripe';
        ride.paymentStatus = 'paid';
        ride.stripePaymentIntentId = typeof session.payment_intent === 'string'
            ? session.payment_intent
            : session.payment_intent?.id;
        ride.paidAt = new Date();
        await ride.save();
    } else if (ride.paymentStatus !== 'paid') {
        ride.paymentStatus = 'failed';
        await ride.save();
    }

    return {
        ride,
        session,
    };
}
