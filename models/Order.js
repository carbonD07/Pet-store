const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    items: [{
        name: String,
        quantity: Number,
        price: Number,
        image: String
    }],
    total: {
        type: Number,
        required: true
    },
    customer: {
        name: String,
        address: String,
        city: String,
        zip: String,
        paymentMethod: String
    },
    status: {
        type: String,
        default: 'Placed'
    },
    stripeSessionId: {
        type: String,
        required: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Order', orderSchema);
