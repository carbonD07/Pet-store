require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const User = require('./models/User');
const Order = require('./models/Order');
const Product = require('./models/Product');
const jwt = require('jsonwebtoken');
const auth = require('./middleware/auth');
const email = require('./utils/email');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Stripe Webhook Endpoint (Must be before express.json() middleware)
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error(`Webhook Signature Verification Failed: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        console.log('Payment successful for session:', session.id);

        try {
            // Retrieve full line items from Stripe
            const lineItems = await stripe.checkout.sessions.listLineItems(session.id);

            // Map Stripe items to our Order schema format
            const orderItems = lineItems.data.map(item => ({
                name: item.description,
                quantity: item.quantity,
                price: item.amount_total / 100 / item.quantity, // Convert back from cents
                image: '' // Stripe line items might not have image URL readily available without product expansion
            }));

            // Create Order in MongoDB
            const newOrder = new Order({
                items: orderItems,
                total: session.amount_total / 100,
                customer: {
                    name: session.customer_details.name,
                    email: session.customer_details.email, // Use email from Stripe
                    address: session.customer_details.address ?
                        `${session.customer_details.address.line1}, ${session.customer_details.address.city}` : 'No address provided',
                    paymentMethod: 'Stripe Credit Card'
                },
                status: 'Paid',
                stripeSessionId: session.id
            });

            await newOrder.save();
            console.log('Order saved to MongoDB:', newOrder._id);

            // Decrement Stock
            for (const item of orderItems) {
                await Product.findOneAndUpdate(
                    { name: item.name },
                    { $inc: { stock: -item.quantity } }
                );
            }
            console.log('Stock updated for items.');

            // Send Confirmation Email
            await email.sendOrderConfirmation(newOrder);

        } catch (error) {
            console.error('Error saving order from webhook:', error);
            // Don't return 500 here, or Stripe will retry indefinitely. Log error and return 200.
        }
    }

    // Return a 200 response to acknowledge receipt of the event
    res.send();
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Stripe Checkout Session Endpoint
app.post('/api/create-checkout-session', async (req, res) => {
    const { items } = req.body;

    // Validate request
    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'No items in cart' });
    }

    // Check Stock
    for (const item of items) {
        const product = await Product.findOne({ name: item.name });
        if (!product) {
            return res.status(400).json({ error: `Product not found: ${item.name}` });
        }
        if (product.stock < item.quantity) {
            return res.status(400).json({ error: `Out of stock: ${item.name}. Only ${product.stock} left.` });
        }
    }

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: items.map(item => ({
                price_data: {
                    currency: 'zar',
                    product_data: {
                        name: item.name,
                        images: item.image ? [item.image] : [],
                    },
                    unit_amount: Math.round(item.price * 100),
                },
                quantity: item.quantity,
            })),
            mode: 'payment',
            success_url: `${req.protocol}://${req.get('host')}/success.html?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.protocol}://${req.get('host')}/cancel.html`,
        });

        res.json({ url: session.url });
    } catch (error) {
        console.error('Stripe error:', error);
        res.status(500).json({ error: error.message });
    }
});

// API Routes - Products (MongoDB)
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find({});
        res.json(products);
    } catch (err) {
        console.error('Error fetching products:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// API Routes - Orders (MongoDB)

app.get('/api/orders/history', auth, async (req, res) => {
    try {
        // Find orders where customer.email matches logged in user email
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const orders = await Order.find({ 'customer.email': user.email }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        console.error('Error fetching order history:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/api/orders', auth, async (req, res) => {
    try {
        const newOrder = new Order({
            items: req.body.items,
            total: req.body.total,
            customer: req.body.customer,
            status: 'Placed'
        });

        const savedOrder = await newOrder.save();
        res.status(201).json(savedOrder);
    } catch (err) {
        console.error('Error saving order:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/api/orders/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (order) {
            res.json(order);
        } else {
            res.status(404).json({ error: 'Order not found' });
        }
    } catch (err) {
        console.error('Error getting order:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// API Routes - Authentication (MongoDB)
app.post('/api/auth/register', async (req, res) => {
    try {
        const { firstName, lastName, email, phone, password } = req.body;

        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({ error: 'Please fill in all required fields' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Please enter a valid email address' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ error: 'An account with this email already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            firstName,
            lastName,
            email: email.toLowerCase(),
            phone: phone || '',
            password: hashedPassword
        });

        const savedUser = await newUser.save();
        const { password: _, ...userWithoutPassword } = savedUser.toObject();

        const token = jwt.sign(
            { user: { id: savedUser._id } },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'Account created successfully',
            token,
            user: userWithoutPassword
        });

    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Please enter email and password' });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const { password: _, ...userWithoutPassword } = user.toObject();

        const token = jwt.sign(
            { user: { id: user._id } },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: userWithoutPassword
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/api/auth/user/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const { password: _, ...userWithoutPassword } = user.toObject();
        res.json(userWithoutPassword);
    } catch (err) {
        console.error('Get user error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Serve index.html for all other routes (SPA fallback)
app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
