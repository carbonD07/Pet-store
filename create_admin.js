require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function createAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const adminEmail = 'admin@zolopetstore.co.za';
        const adminPassword = 'adminpassword123'; // Weak password for demo, change in prod

        // Check if admin exists
        let admin = await User.findOne({ email: adminEmail });

        if (admin) {
            console.log('Admin user already exists.');
            // Ensure isAdmin is true
            if (!admin.isAdmin) {
                admin.isAdmin = true;
                await admin.save();
                console.log('Updated existing user to be Admin.');
            }
        } else {
            // Create new admin
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(adminPassword, salt);

            admin = new User({
                firstName: 'Admin',
                lastName: 'User',
                email: adminEmail,
                password: hashedPassword,
                isAdmin: true,
                phone: '0000000000'
            });

            await admin.save();
            console.log(`Admin user created: ${adminEmail} / ${adminPassword}`);
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

createAdmin();
