const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('./models/Product');

async function debugProduct() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        // Fetch all products just like the API does
        const products = await Product.find({});

        console.log(`Fetch ${products.length} products.`);

        // Simulate what the frontend does: find product with ID 10 (number)
        const targetId = 10;
        const found = products.find(p => p.id === targetId);

        if (found) {
            console.log('✅ Found product 10 with strict equality (===)');
            console.log('Type of p.id:', typeof found.id);
            console.log('Product Name:', found.name);
        } else {
            console.log('❌ Could NOT find product 10 with strict equality.');

            // Try loose equality
            const looseFound = products.find(p => p.id == targetId);
            if (looseFound) {
                console.log('⚠️ Found product 10 with LOOSE equality (==). Type mismatch!');
                console.log('Type of p.id in DB:', typeof looseFound.id);
            } else {
                console.log('❌ Product 10 simply does not exist in the returned list.');
            }
        }

        // Print all IDs
        console.log('Available IDs:', products.map(p => ({ id: p.id, type: typeof p.id })));

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

debugProduct();
