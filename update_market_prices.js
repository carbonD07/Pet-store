require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Product = require('./models/Product');

async function updatePrices() {
    try {
        // 1. Setup paths and data
        const jsonPath = path.join(__dirname, 'data', 'products.json');
        const rawData = fs.readFileSync(jsonPath, 'utf-8');
        let products = JSON.parse(rawData);

        // 2. Connect to DB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // 3. Process changes
        console.log('Applying 15% price increase...');
        let updateCount = 0;

        products = products.map(p => {
            // Update Base Price
            if (p.price) {
                p.price = Math.round((p.price * 1.15) * 100) / 100; // 2 decimal places
            }

            // Update Variant Prices
            if (p.variants && p.variants.length > 0) {
                p.variants = p.variants.map(v => ({
                    ...v,
                    price: Math.round((v.price * 1.15) * 100) / 100
                }));
            }

            updateCount++;
            return p;
        });

        // 4. Write back to products.json
        fs.writeFileSync(jsonPath, JSON.stringify(products, null, 2));
        console.log(`Updated products.json with ${updateCount} products.`);

        // 5. Update MongoDB
        for (const p of products) {
            await Product.updateOne(
                { id: p.id },
                {
                    $set: {
                        price: p.price,
                        variants: p.variants
                    }
                }
            );
        }
        console.log('Database successfully synced with new prices.');

    } catch (err) {
        console.error('Error updating prices:', err);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

updatePrices();
