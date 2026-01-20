require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

async function viewInventory() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const products = await Product.find({}).sort({ name: 1 });

        console.log('\n--- Product Inventory ---\n');

        // Format as a simple table
        const inventory = [];

        products.forEach(p => {
            // Base product
            inventory.push({
                ID: p.id,
                Name: p.name,
                Type: 'Base',
                Size: '-',
                Price: p.price,
                Stock: p.stock
            });

            // Variants
            if (p.variants && p.variants.length > 0) {
                p.variants.forEach(v => {
                    inventory.push({
                        ID: p.id, // Same ID for reference
                        Name: '  ↳ Variant',
                        Type: 'Variant',
                        Size: v.size,
                        Price: v.price,
                        Stock: v.stock || 0
                    });
                });
            }
        });

        // Format as a simple table
        console.table(inventory);

        console.log(`\nTotal Products: ${products.length}\n`);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

viewInventory();
