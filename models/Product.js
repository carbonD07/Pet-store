const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: false
    },
    category: {
        type: String,
        required: false
    },
    stock: {
        type: Number,
        default: 100, // Default stock
        min: 0
    }
}, { strict: false }); // Allow other fields (ingredients, variants, etc.) to be saved

module.exports = mongoose.model('Product', productSchema);
