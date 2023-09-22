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

router.get('/account/:username', authenticateJWT, (req, res) => {
    const { username } = req.params;

    pool.query('SELECT users.*, subscription_plans.plan_name, subscription_plans.cost, subscription_plans.duration FROM users LEFT JOIN subscription_plans ON users.subscription_plan_id = subscription_plans.id WHERE users.username = ?', [username], (error, results) => {
        if (error) {
            return res.status(500).send({ error: error.message });
        }
        if (results.length === 0) {
            return res.status(404).send({ error: 'User not found' });
        }
        const user = results[0];
        delete user.password;
        res.status(200).send({ user });
    });
});

router.post('/signup', [
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

router.post('/login', [
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

router.post('/charge', authenticateJWT, async (req, res) => {
    try {
        const { tokenId, amount } = req.body;
        const charge = await stripe.charges.create({
            amount: amount,
            currency: 'usd',
            description: 'Charge for subscription',
            source: tokenId,
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.put('/account/update', authenticateJWT, (req, res) => {
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

router.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, 'YOUR_ACTUAL_WEBHOOK_SECRET_FROM_STRIPE');
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object;
            console.log('PaymentIntent was successful!');
            break;
        default:
            return res.status(400).end();
    }

    res.json({ received: true });
});

export default router;
