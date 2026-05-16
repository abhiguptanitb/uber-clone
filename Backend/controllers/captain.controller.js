const captainModel = require('../models/captain.model');
const captainService = require('../services/captain.service');
const { validationResult } = require('express-validator');
const blackListTokenModel = require('../models/blacklistToken.model')
const rideModel = require('../models/ride.model')

function getIndianDayRange() {
    const now = new Date();
    const indiaOffsetMinutes = 330;
    const utcTimestamp = now.getTime() + (now.getTimezoneOffset() * 60 * 1000);
    const indiaNow = new Date(utcTimestamp + indiaOffsetMinutes * 60 * 1000);

    const startOfIndiaDay = new Date(indiaNow);
    startOfIndiaDay.setHours(0, 0, 0, 0);

    const endOfIndiaDay = new Date(indiaNow);
    endOfIndiaDay.setHours(23, 59, 59, 999);

    return {
        start: new Date(startOfIndiaDay.getTime() - indiaOffsetMinutes * 60 * 1000),
        end: new Date(endOfIndiaDay.getTime() - indiaOffsetMinutes * 60 * 1000),
    };
}

module.exports.registerCaptain = async (req, res, next) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { fullname, email, password, vehicle } = req.body;
    console.log(req.body)

    const isCaptainAlreadyExist = await captainModel.findOne({ email });

    if (isCaptainAlreadyExist) {
        return res.status(400).json({ message: 'Captain already exist' });
    }


    const hashedPassword = await captainModel.hashPassword(password);

    const captain = await captainService.createCaptain({
        firstname: fullname.firstname,
        lastname: fullname.lastname,
        email,
        password: hashedPassword,
        color: vehicle.color,
        plate: vehicle.plate,
        capacity: vehicle.capacity,
        vehicleType: vehicle.vehicleType
    });

    const token = captain.generateAuthToken();

    res.status(201).json({ token, captain });

}

module.exports.loginCaptain = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const captain = await captainModel.findOne({ email }).select('+password');

    if (!captain) {
        return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await captain.comparePassword(password);

    if (!isMatch) {
        return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = captain.generateAuthToken();

    res.cookie('token', token);

    res.status(200).json({ token, captain });
}

module.exports.getCaptainProfile = async (req, res, next) => {
    res.status(200).json({ captain: req.captain });
}

module.exports.logoutCaptain = async (req, res, next) => {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[ 1 ];

    await blackListTokenModel.create({ token });
    await captainModel.findByIdAndUpdate(req.captain._id, {
        status: 'inactive',
        socketId: null,
        lastSeenAt: new Date(),
    });

    res.clearCookie('token');

    res.status(200).json({ message: 'Logout successfully' });
}

module.exports.getVehicleType = async (req, res, next) => {
    try {
        const captain = req.captain;  // Captured from the auth middleware
        if (!captain) {
            return res.status(404).json({ message: "Captain not found" });
        }

        const vehicleType = captain.vehicle.vehicleType;

        res.status(200).json({ vehicleType });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports.getCaptainEarnings = async (req, res, next) => {
    try {
        if (!req.captain) {
            return res.status(404).json({ message: 'Captain not found' });
        }

        const { start, end } = getIndianDayRange();

        const earningsStats = await rideModel.aggregate([
            {
                $match: {
                    captain: req.captain._id,
                    paymentStatus: 'paid',
                    paidAt: {
                        $gte: start,
                        $lte: end,
                    },
                },
            },
            {
                $group: {
                    _id: null,
                    earningsToday: { $sum: '$fare' },
                },
            },
        ]);

        const ridesStats = await rideModel.aggregate([
            {
                $match: {
                    captain: req.captain._id,
                    status: 'completed',
                    completedAt: {
                        $gte: start,
                        $lte: end,
                    },
                },
            },
            {
                $group: {
                    _id: null,
                    ridesToday: { $sum: 1 },
                    paidRidesToday: {
                        $sum: {
                            $cond: [{ $eq: ['$paymentStatus', 'paid'] }, 1, 0],
                        },
                    },
                },
            },
        ]);

        res.status(200).json({
            earningsToday: earningsStats[0]?.earningsToday || 0,
            ridesToday: ridesStats[0]?.ridesToday || 0,
            paidRidesToday: ridesStats[0]?.paidRidesToday || 0,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
