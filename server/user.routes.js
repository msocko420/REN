import { body, validationResult } from 'express-validator';
import express from 'express';
import bcrypt from 'bcrypt';
import pool from './db.js'; // Import the database connection from db.js

const router = express.Router();

// User Account Information Endpoint
router.get('/account/:username', (req, res) => {
  const { username } = req.params; // Extract the username from the URL parameters

  // Query to retrieve user information based on the provided username
  pool.query('SELECT username, email FROM users WHERE username = ?', [username], (error, results) => {
    if (error) return res.status(500).send({ error });
    if (results.length === 0) return res.status(404).send({ error: 'User not found' });

    const user = results[0];

    // Send the user's information to the client
    res.status(200).send({ user });
  });
});
// Signup Endpoint
router.post('/signup', [
    body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('email').isEmail().withMessage('Invalid email address'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Extract user input
    const { username, email, password } = req.body;

    // Hash and salt password
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) return res.status(500).send({ error: err });

      // Insert user into the database
      pool.query('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [username, email, hash], (error, results) => {
        if (error) return res.status(500).send({ error });
        res.status(201).send({ success: true });
      });
    });
});

// Login Endpoint
router.post('/login', [
    body('username').notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Extract user input
    const { username, password } = req.body;

    // Retrieve user from the database using the provided username
    pool.query('SELECT * FROM users WHERE username = ?', [username], (error, results) => {
      if (error) return res.status(500).send({ error });
      if (results.length === 0) return res.status(404).send({ error: 'User not found' });

      const user = results[0];

      // Compare the provided password with the hashed password stored in the database
      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err) return res.status(500).send({ error: err });
        if (!isMatch) return res.status(401).send({ error: 'Invalid password' });

        res.status(200).send({ success: true });
      });
    });
});

export default router;
