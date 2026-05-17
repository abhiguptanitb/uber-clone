const rideService = require("../services/ride.service")
const aiService = require("../services/ai.service")
const { validationResult } = require("express-validator")
const { sendMessageToSocketId } = require("../socket")
const rideModel = require("../models/ride.model")

module.exports.createRide = async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" })
    }

    const { pickup, destination, vehicleType } = req.body

    try {
    const { pickupCoordinates, matchingCaptains } = await rideService.findMatchingCaptainsForPickup({
        pickup,
        vehicleType,
    })

    if (matchingCaptains.length === 0) {
        return res.status(404).json({ message: "No drivers available for this vehicle type" })
    }

    const ride = await rideService.createRide({
        user: req.user._id,
        pickup,
        destination,
        vehicleType,
    })

    ride.otp = ""

    // Populate the ride with user info (for sending to captains)
    const rideWithUser = await rideModel.findOne({ _id: ride._id }).populate("user")

    // Send ride info to matching captains only
    await Promise.all(matchingCaptains.map(async (captain) => {
        const rideForCaptain = await rideService.buildRideMatchForCaptain({
            ride: rideWithUser,
            captain,
            pickupCoordinates,
        })

        sendMessageToSocketId(captain.socketId, {
        event: "new-ride",
        data: { ...rideForCaptain, vehicleType },
        })
    }))

    res.status(201).json(ride)
    } catch (err) {
        const statusCode = err.message === 'Complete your pending ride payment before booking another ride' ? 409 : 500
        return res.status(statusCode).json({ message: err.message })
    }
}

module.exports.getFare = async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    const { pickup, destination } = req.query

    try {
        const fare = await rideService.getFare(pickup, destination)
        return res.status(200).json(fare)
    } catch (err) {
        return res.status(500).json({ message: err.message })
    }
}

module.exports.confirmRide = async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    const { rideId } = req.body

    try {
        const ride = await rideService.confirmRide({ rideId, captain: req.captain })

        sendMessageToSocketId(ride.user.socketId, {
        event: "ride-confirmed",
        data: ride,
        })

        return res.status(200).json(ride)
    } catch (err) {
        const statusCode = err.message === 'Ride is no longer available' ? 409 : 500
        return res.status(statusCode).json({ message: err.message })
    }
}

module.exports.startRide = async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    const { rideId, otp } = req.query

    try {
        const ride = await rideService.startRide({ rideId, otp, captain: req.captain })

        sendMessageToSocketId(ride.user.socketId, {
        event: "ride-started",
        data: ride,
        })

        return res.status(200).json(ride)
    } catch (err) {
        return res.status(500).json({ message: err.message })
    }
}

module.exports.endRide = async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    const { rideId } = req.body

    try {
        const ride = await rideService.endRide({ rideId, captain: req.captain })

        sendMessageToSocketId(ride.user.socketId, {
        event: "ride-ended",
        data: ride,
        })

        return res.status(200).json(ride)
    } catch (err) {
        return res.status(500).json({ message: err.message })
    }
}

module.exports.getRideConfidence = async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    const { pickup, destination, vehicleType } = req.query

    try {
        const confidence = await rideService.getRideConfidence({
            pickup,
            destination,
            vehicleType,
        })

        return res.status(200).json(confidence)
    } catch (err) {
        return res.status(500).json({ message: err.message })
    }
}

module.exports.getRideOptions = async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    const { pickup, destination } = req.query

    try {
        const options = await rideService.getRideOptions({ pickup, destination })
        return res.status(200).json({ options })
    } catch (err) {
        return res.status(500).json({ message: err.message })
    }
}

module.exports.getRideRecommendation = async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    const { pickup, destination, options } = req.body

    try {
        const recommendation = await aiService.getRideRecommendation({
            pickup,
            destination,
            options,
        })

        return res.status(200).json(recommendation)
    } catch (err) {
        return res.status(500).json({ message: err.message })
    }
}

module.exports.getAvailableRidesForCaptain = async (req, res) => {
    try {
        const rides = await rideService.findAvailableRidesForCaptain({
            captain: req.captain,
            limit: Number(req.query.limit) || 10,
        })

        return res.status(200).json({ rides })
    } catch (err) {
        return res.status(500).json({ message: err.message })
    }
}

module.exports.cancelRide = async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    try {
        const ride = await rideService.cancelPendingRideForUser({
            rideId: req.body.rideId,
            userId: req.user._id,
        })

        try {
            const { matchingCaptains } = await rideService.findMatchingCaptainsForPickup({
                pickup: ride.pickup,
                vehicleType: ride.vehicleType,
            })

            matchingCaptains.forEach((captain) => {
                sendMessageToSocketId(captain.socketId, {
                    event: "ride-cancelled",
                    data: ride,
                })
            })
        } catch {
            // The cancellation is already saved; realtime cleanup can recover on the next queue refresh.
        }

        return res.status(200).json(ride)
    } catch (err) {
        const statusCode = err.message === 'Pending ride not found' ? 404 : 500
        return res.status(statusCode).json({ message: err.message })
    }
}

module.exports.getRideById = async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    try {
        const ride = await rideService.findRideForUser({
            rideId: req.params.rideId,
            userId: req.user._id,
        })

        return res.status(200).json(ride)
    } catch (err) {
        const statusCode = err.message === 'Ride not found' ? 404 : 500
        return res.status(statusCode).json({ message: err.message })
    }
}

module.exports.getPendingPaymentRide = async (req, res) => {
    try {
        const ride = await rideService.findPendingPaymentRideForUser({
            userId: req.user._id,
        })

        return res.status(200).json({
            hasPendingPayment: Boolean(ride),
            ride,
        })
    } catch (err) {
        return res.status(500).json({ message: err.message })
    }
}

module.exports.createCheckoutSession = async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    try {
        const { rideId } = req.body

        const result = await rideService.createStripeCheckoutSession({
            rideId,
            user: req.user,
        })

        return res.status(200).json(result)
    } catch (err) {
        const statusCode = err.message === 'Ride not found' ? 404 : 500
        return res.status(statusCode).json({ message: err.message })
    }
}

module.exports.verifyCheckoutSession = async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    try {
        const { rideId, sessionId } = req.query

        const result = await rideService.verifyStripeCheckoutSession({
            rideId,
            sessionId,
            userId: req.user._id,
        })

        if (result.ride.paymentStatus === 'paid' && result.ride.captain?.socketId) {
            sendMessageToSocketId(result.ride.captain.socketId, {
                event: 'ride-payment-completed',
                data: result.ride,
            })
        }

        return res.status(200).json({
            paymentStatus: result.ride.paymentStatus,
            ride: result.ride,
            sessionStatus: result.session.status,
        })
    } catch (err) {
        const statusCode = err.message === 'Ride not found' ? 404 : 500
        return res.status(statusCode).json({ message: err.message })
    }
}
