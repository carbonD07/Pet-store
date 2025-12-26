require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Product = require('./models/Product');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB...'))
    .catch(err => {
        console.error('Could not connect to MongoDB', err);
        process.exit(1);
    });

const importData = async () => {
    try {
        // Read JSON file
        const jsonPath = path.join(__dirname, 'data', 'products.json');
        const jsonData = fs.readFileSync(jsonPath, 'utf-8');
        const products = JSON.parse(jsonData);

        // Add default stock if missing
        const productsWithStock = products.map(p => ({
            ...p,
            stock: 100 // Default stock for all items
        }));

        // Clear existing data
        await Product.deleteMany({});
        console.log('Old products removed.');

        // Insert new data
        await Product.insertMany(productsWithStock);
        console.log('Data Successfully Imported!');

        process.exit();
    } catch (err) {
        console.error('Error importing data:', err);
        process.exit(1);
    }
};

importData();
