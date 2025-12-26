require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('Connected...');
        const product = await Product.findOne(); // Get first product
        if (product) {
            product.stock = 0;
            await product.save();
            console.log(`Set stock to 0 for: ${product.name}`);
        }
        process.exit();
    })
    .catch(err => console.log(err));
