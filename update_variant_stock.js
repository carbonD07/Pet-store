require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Product = require('./models/Product');

async function updateVariantStock() {
    try {
        // 1. Setup paths and data
        const jsonPath = path.join(__dirname, 'data', 'products.json');
        const rawData = fs.readFileSync(jsonPath, 'utf-8');
        let products = JSON.parse(rawData);

        // 2. Connect to DB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // 3. Process changes
        console.log('Setting stock to 100 for all variants...');
        let updateCount = 0;

        products = products.map(p => {
            if (p.variants && p.variants.length > 0) {
                p.variants = p.variants.map(v => ({
                    ...v,
                    stock: 100 // Explicitly set stock to 100
                }));
                updateCount++;
            }
            return p;
        });

        // 4. Write back to products.json
        fs.writeFileSync(jsonPath, JSON.stringify(products, null, 2));
        console.log(`Updated products.json with variant stock for ${updateCount} products.`);

        // 5. Update MongoDB
        for (const p of products) {
            await Product.updateOne(
                { id: p.id },
                {
                    $set: {
                        variants: p.variants
                    }
                }
            );
        }
        console.log('Database successfully synced with new variant stock.');

    } catch (err) {
        console.error('Error updating variant stock:', err);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

updateVariantStock();
