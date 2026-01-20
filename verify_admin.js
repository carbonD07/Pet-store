require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function verifyAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const email = 'admin@zolopetstore.co.za';
        const admin = await User.findOne({ email: email });

        if (admin) {
            console.log(`\nSUCCESS: Found user ${email}`);
            console.log(`isAdmin: ${admin.isAdmin}`);
            console.log(`_id: ${admin._id}\n`);
        } else {
            console.log(`\nFAILURE: User ${email} NOT found.\n`);
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

verifyAdmin();
