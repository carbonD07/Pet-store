const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.get('/api/products', (req, res) => {
    const productsPath = path.join(__dirname, 'data', 'products.json');
    fs.readFile(productsPath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading products data:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        try {
            const products = JSON.parse(data);
            res.json(products);
        } catch (parseError) {
            console.error('Error parsing products data:', parseError);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });
});

// API Routes - Orders
app.post('/api/orders', (req, res) => {
    const ordersPath = path.join(__dirname, 'data', 'orders.json');

    fs.readFile(ordersPath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading orders data:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        let orders = [];
        try {
            orders = JSON.parse(data);
        } catch (parseError) {
            console.error('Error parsing orders data:', parseError);
            orders = []; // Reset if corrupted or empty
        }

        const newOrder = {
            id: 'ORD-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
            date: new Date().toISOString(),
            status: 'Placed', // Placed, Processing, Shipped, Delivered
            items: req.body.items,
            total: req.body.total,
            customer: req.body.customer
        };

        orders.push(newOrder);

        fs.writeFile(ordersPath, JSON.stringify(orders, null, 2), (writeErr) => {
            if (writeErr) {
                console.error('Error saving order:', writeErr);
                return res.status(500).json({ error: 'Internal Server Error' });
            }
            res.status(201).json(newOrder);
        });
    });
});

app.get('/api/orders/:id', (req, res) => {
    const ordersPath = path.join(__dirname, 'data', 'orders.json');
    const orderId = req.params.id;

    fs.readFile(ordersPath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading orders data:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        try {
            const orders = JSON.parse(data);
            const order = orders.find(o => o.id === orderId);

            if (order) {
                res.json(order);
            } else {
                res.status(404).json({ error: 'Order not found' });
            }
        } catch (parseError) {
            console.error('Error parsing orders data:', parseError);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });
});

// API Routes - Authentication
const usersPath = path.join(__dirname, 'data', 'users.json');

// Helper function to read users
function readUsers() {
    try {
        const data = fs.readFileSync(usersPath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return [];
    }
}

// Helper function to write users
function writeUsers(users) {
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
}

// Register new user
app.post('/api/auth/register', async (req, res) => {
    try {
        const { firstName, lastName, email, phone, password } = req.body;

        // Validation
        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({ error: 'Please fill in all required fields' });
        }

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Please enter a valid email address' });
        }

        // Password length validation
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        const users = readUsers();

        // Check if user already exists
        const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (existingUser) {
            return res.status(400).json({ error: 'An account with this email already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const newUser = {
            id: 'USR-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
            firstName,
            lastName,
            email: email.toLowerCase(),
            phone: phone || '',
            password: hashedPassword,
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        writeUsers(users);

        // Return user without password
        const { password: _, ...userWithoutPassword } = newUser;
        res.status(201).json({
            message: 'Account created successfully',
            user: userWithoutPassword
        });

    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Login user
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({ error: 'Please enter email and password' });
        }

        const users = readUsers();

        // Find user by email
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Return user without password
        const { password: _, ...userWithoutPassword } = user;
        res.json({
            message: 'Login successful',
            user: userWithoutPassword
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Get user by ID
app.get('/api/auth/user/:id', (req, res) => {
    try {
        const users = readUsers();
        const user = users.find(u => u.id === req.params.id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const { password: _, ...userWithoutPassword } = user;
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
