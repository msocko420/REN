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
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object;
            const customerId = session.customer;
            const subscriptionId = session.subscription;
            const username = session.client_reference_id;

            const startDate = new Date();
            const endDate = new Date(startDate);
            endDate.setMonth(endDate.getMonth() + 1);

            pool.query('UPDATE users SET stripe_customer_id = ?, stripe_subscription_id = ?, subscription_status = "active", subscription_start_date = ?, subscription_end_date = ? WHERE username = ?', 
                [customerId, subscriptionId, startDate, endDate, username], 
                (error) => {
                    if (error) {
                        console.error("Error updating user after successful checkout:", error.message);
                    }
                });

            // You can add a record to the `payments` table here.
            break;

        case 'customer.subscription.deleted':
            const deletedSubscription = event.data.object;
            const userFromDeletedSubscription = deletedSubscription.client_reference_id;

            pool.query('UPDATE users SET subscription_status = "inactive" WHERE username = ?', 
                [userFromDeletedSubscription], 
                (error) => {
                    if (error) {
                        console.error("Error updating user subscription:", error.message);
                    }
                });
            break;

        case 'invoice.payment_failed':
            const failedInvoice = event.data.object;
            const userFromFailedInvoice = failedInvoice.client_reference_id;

            pool.query('UPDATE users SET subscription_status = "payment_failed" WHERE username = ?', 
                [userFromFailedInvoice], 
                (error) => {
                    if (error) {
                        console.error("Error updating user payment status:", error.message);
                    }
                });

            pool.query('INSERT INTO payments (user_id, payment_amount, payment_date, payment_status) VALUES (?, ?, ?, "FAILED")', 
                [userFromFailedInvoice, failedInvoice.amount_due, new Date(failedInvoice.created * 1000)],
                (error) => {
                    if (error) {
                        console.error("Error adding failed payment record:", error.message);
                    }
                });

            console.log('Payment failed for invoice', failedInvoice.id);
            break;

        case 'invoice.payment_succeeded':
            const successfulInvoice = event.data.object;
            const userFromSuccessfulInvoice = successfulInvoice.client_reference_id;

            pool.query('UPDATE users SET subscription_status = "active" WHERE username = ?', 
                [userFromSuccessfulInvoice], 
                (error) => {
                    if (error) {
                        console.error("Error updating user payment status:", error.message);
                    }
                });

            pool.query('INSERT INTO payments (user_id, payment_amount, payment_date, payment_status) VALUES (?, ?, ?, "SUCCESS")', 
                [userFromSuccessfulInvoice, successfulInvoice.amount_paid, new Date(successfulInvoice.created * 1000)],
                (error) => {
                    if (error) {
                        console.error("Error adding successful payment record:", error.message);
                    }
                });

            console.log('Payment successful for invoice', successfulInvoice.id);
            break;

        case 'customer.subscription.updated':
            const updatedSubscription = event.data.object;
            const userFromUpdatedSubscription = updatedSubscription.client_reference_id;
            const newStatus = updatedSubscription.status;

            pool.query('UPDATE users SET subscription_status = ? WHERE username = ?', 
                [newStatus, userFromUpdatedSubscription], 
                (error) => {
                    if (error) {
                        console.error("Error updating user subscription status:", error.message);
                    }
                });
            break;

        // Add any additional webhook events that you need to handle
    
        default:
            return res.status(400).end();
    }

    res.json({ received: true });
});

export default router;
