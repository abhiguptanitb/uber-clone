const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const rideController = require('../controllers/ride.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const normalizeLocation = (value) => {
    if (Array.isArray(value)) {
        value = value[0];
    }

    return String(value || '')
        .replace(/[\u060C\uFF0C]/g, ',')
        .replace(/\s+/g, ' ')
        .trim();
};

const locationQuery = (field, message) => query(field)
    .customSanitizer(normalizeLocation)
    .isLength({ min: 3 })
    .withMessage(message);

const locationBody = (field, message) => body(field)
    .customSanitizer(normalizeLocation)
    .isLength({ min: 3 })
    .withMessage(message);

router.post('/create',
    authMiddleware.authUser,
    locationBody('pickup', 'Invalid pickup address'),
    locationBody('destination', 'Invalid destination address'),
    body('vehicleType').isString().isIn([ 'auto', 'car', 'moto' ]).withMessage('Invalid vehicle type'),
    rideController.createRide
);

router.get('/get-fare',
    authMiddleware.authUser,
    locationQuery('pickup', 'Invalid pickup address'),
    locationQuery('destination', 'Invalid destination address'),
    rideController.getFare
);

router.get('/confidence',
    authMiddleware.authUser,
    locationQuery('pickup', 'Invalid pickup address'),
    locationQuery('destination', 'Invalid destination address'),
    query('vehicleType').isString().isIn([ 'auto', 'car', 'moto' ]).withMessage('Invalid vehicle type'),
    rideController.getRideConfidence
);

router.get('/options',
    authMiddleware.authUser,
    locationQuery('pickup', 'Invalid pickup address'),
    locationQuery('destination', 'Invalid destination address'),
    rideController.getRideOptions
);

router.post('/confirm',
    authMiddleware.authCaptain,
    body('rideId').isMongoId().withMessage('Invalid ride id'),
    rideController.confirmRide
);

router.get('/captain/available',
    authMiddleware.authCaptain,
    rideController.getAvailableRidesForCaptain
);

router.post('/cancel',
    authMiddleware.authUser,
    body('rideId').isMongoId().withMessage('Invalid ride id'),
    rideController.cancelRide
);

router.get('/start-ride',
    authMiddleware.authCaptain,
    query('rideId').isMongoId().withMessage('Invalid ride id'),
    query('otp').isString().isLength({ min: 6, max: 6 }).withMessage('Invalid OTP'),
    rideController.startRide
);

router.post('/end-ride',
    authMiddleware.authCaptain,
    body('rideId').isMongoId().withMessage('Invalid ride id'),
    rideController.endRide
);

router.post('/payment/checkout-session',
    authMiddleware.authUser,
    body('rideId').isMongoId().withMessage('Invalid ride id'),
    rideController.createCheckoutSession
);

router.get('/payment/verify',
    authMiddleware.authUser,
    query('rideId').isMongoId().withMessage('Invalid ride id'),
    query('sessionId').isString().isLength({ min: 5 }).withMessage('Invalid Stripe session id'),
    rideController.verifyCheckoutSession
);

router.get('/payment/pending',
    authMiddleware.authUser,
    rideController.getPendingPaymentRide
);

router.get('/:rideId',
    authMiddleware.authUser,
    param('rideId').isMongoId().withMessage('Invalid ride id'),
    rideController.getRideById
);

module.exports = router;
