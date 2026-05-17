const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    captain: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'captain',
    },
    pickup: {
        type: String,
        required: true,
    },
    destination: {
        type: String,
        required: true,
    },
    fare: {
        type: Number,
        required: true,
    },
    vehicleType: {
        type: String,
        enum: ['auto', 'car', 'moto'],
        required: true,
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'stripe'],
        default: 'cash',
    },
    paymentStatus: {
        type: String,
        enum: ['unpaid', 'pending', 'paid', 'failed'],
        default: 'unpaid',
    },
    paymentCurrency: {
        type: String,
        default: 'inr',
    },
    stripeCheckoutSessionId: {
        type: String,
    },
    stripePaymentIntentId: {
        type: String,
    },
    startedAt: {
        type: Date,
    },
    completedAt: {
        type: Date,
    },
    paidAt: {
        type: Date,
    },

    status: {
        type: String,
        enum: [ 'pending', 'accepted', "ongoing", 'completed', 'cancelled' ],
        default: 'pending',
    },

    // duration: {
    //     type: Number,
    // }, // in seconds

    // distance: {
    //     type: Number,
    // }, // in meters

    // paymentID: {
    //     type: String,
    // },
    // orderId: {
    //     type: String,
    // },
    // signature: {
    //     type: String,
    // },

    otp: {
        type: String,
        select: false,
        required: true,
    },
}, {
    timestamps: true,
})

module.exports = mongoose.model('ride', rideSchema);
