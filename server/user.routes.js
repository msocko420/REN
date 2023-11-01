import { body, validationResult } from 'express-validator';
import express from 'express';
import bcrypt from 'bcrypt';
import pool from './db.js';
import Stripe from 'stripe';
import jwt from 'jsonwebtoken';

const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET;
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (authHeader) {
        const token = authHeader.split(' ')[1];

        jwt.verify(token, SECRET_KEY, (err, user) => {
            if (err) {
                return res.sendStatus(403);
            }

            req.user = user;
            next();
        });
    } else {
        res.sendStatus(401);
    }
};

router.get('/account/:username', express.json(), authenticateJWT, (req, res) => {
    const { username } = req.params;
    console.log("Received username in /account/:username route:", username);
    pool.query('SELECT users.*, subscription_plans.plan_name, subscription_plans.cost, subscription_plans.duration FROM users LEFT JOIN subscription_plans ON users.subscription_plan_id = subscription_plans.id WHERE users.username = ?', [username], (error, results) => {
        if (error) {
            return res.status(500).send({ error: error.message });
        }
        if (results.length === 0) {
            return res.status(404).send({ error: 'User not found' });
        }
        const user = results[0];
        console.log(user);  // Log the user data
        delete user.password;
        res.status(200).send({ user });
    });
});

router.post('/signup', express.json(), [
    body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('email').isEmail().withMessage('Invalid email address'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { username, email, password } = req.body;

    bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
            return res.status(500).send({ error: err.message });
        }
        pool.query('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [username, email, hash], (error) => {
            if (error) {
                return res.status(500).send({ error: error.message });
            }
            res.status(201).send({ success: true });
        });
    });
});

router.post('/login', express.json(), [
    body('username').notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required'),
], (req, res) => {
    const { username, password } = req.body;

    pool.query('SELECT users.*, subscription_plans.plan_name, subscription_plans.cost, subscription_plans.duration FROM users LEFT JOIN subscription_plans ON users.subscription_plan_id = subscription_plans.id WHERE users.username = ?', [username], (error, results) => {
        if (error) {
            return res.status(500).send({ error: error.message });
        }
        if (results.length === 0) {
            return res.status(404).send({ error: 'User not found' });
        }
        const user = results[0];

        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
                return res.status(500).send({ error: err.message });
            }
            if (!isMatch) {
                return res.status(401).send({ error: 'Invalid password' });
            }
            const token = jwt.sign({ username: user.username }, SECRET_KEY, { expiresIn: '1h' });
            delete user.password;
            res.status(200).send({ success: true, user, token });
        });
    });
});

router.put('/account/update', express.json(), authenticateJWT, (req, res) => {
    const { username, email } = req.body;
    const user = req.user;

    if (!username || !email) {
        return res.status(400).send({ error: 'Username and email are required for updating.' });
    }

    pool.query('UPDATE users SET username = ?, email = ? WHERE username = ?', [username, email, user.username], (error, results) => {
        if (error) {
            return res.status(500).send({ error: error.message });
        }
        if (results.affectedRows === 0) {
            return res.status(404).send({ error: 'User not found' });
        }
        res.status(200).send({ success: true, message: 'User details updated successfully.' });
    });
});
// Token validation endpoint
router.post('/token/validate', express.json(), authenticateJWT, (req, res) => {
    // If the middleware function `authenticateJWT` has successfully run, the token is valid
    // Therefore, we just return a success response.
    res.status(200).json({ valid: true });
});

router.post('/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    let event;

    try {
        // Parse the incoming event payload from Stripe
        event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error(`Failed to validate Stripe webhook signature: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event type (e.g., a successful payment)
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;

        // Extracting user's ID from the Stripe session's client_reference_id
        const userId = session.client_reference_id;

        // Update the user's subscription details in the database
        const subscriptionStatus = 'ACTIVE';
        const startDate = new Date();
        // For simplicity, assuming the user always picks the monthly plan. This should be adjusted based on your actual logic
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1);

        pool.query('UPDATE users SET subscription_status = ?, subscription_start_date = ?, subscription_end_date = ? WHERE id = ?',
            [subscriptionStatus, startDate, endDate, userId], (error, results) => {
                if (error) {
                    console.error("Failed to update user subscription in the database:", error);
                    return res.status(500).send("Database Error");
                }

                // Log the payment in the Payments table
                const paymentAmount = session.amount_total / 100; // Convert to dollars from cents
                const paymentDate = new Date(session.created * 1000); // Convert Stripe's timestamp to JavaScript Date
                const paymentStatus = 'SUCCESS'; // Or adjust based on your design
                const planId = session.metadata.planId; // Assuming you also pass the plan ID in the session's metadata

                pool.query('INSERT INTO payments (user_id, subscription_plan_id, payment_amount, payment_date, payment_status) VALUES (?, ?, ?, ?, ?)',
                    [userId, planId, paymentAmount, paymentDate, paymentStatus], (err, results) => {
                        if (err) {
                            console.error("Failed to log payment in the database:", err);
                            return res.status(500).send("Database Error");
                        }

                        return res.json({ received: true });
                    });
            });
    } else {
        // Return a response to acknowledge receipt of the event
        res.json({ received: true });
    }
});

export default router;
