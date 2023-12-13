import express from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';

import dalleRoutes from './routes/dalle.routes.js';
import userRoutes from './user.routes.js'; // Import user routes using ES6 import syntax
import feedbackRoutes from './feedback.routes.js'; // Import feedback routes

dotenv.config();

const app = express();
const allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173/', 'https://www.kashmunkey.xyz', 'https://www.kashmunkey.com'];

app.use(cors());

// Attach express.json() middleware specifically to the routes that need it
app.use('/api/v1/dalle', express.json({ limit: "150mb" }), dalleRoutes);

// For the /api/user endpoint, don't apply the express.json() middleware globally
app.use('/api/user', userRoutes); // Add user routes

// Add feedback routes with express.json() middleware
app.use('/api/feedback', express.json(), feedbackRoutes);

app.get('/', (req, res) => {
  res.status(200).json({ message: "Hello from DALL.E" });
});

app.listen(8080, () => console.log('Server has started'));


and this is the feedback.routes script on the server side: import express from 'express';
import nodemailer from 'nodemailer';

const router = express.Router();

router.post('/', async (req, res) => {
    const { name, email, message } = req.body;

    const transporter = nodemailer.createTransport({
        host: 'smtp.titan.email',
        port: 465,
        secure: true, // use SSL/TLS
        auth: {
            user: 'team@kashmunkey.com',
            pass: process.env.HOSTINGER_EMAIL_PASSWORD
        }
    });
    try {
        await transporter.sendMail({
            from: 'team@kashmunkey.com',
            to: 'team@kashmunkey.com',
            subject: `Feedback from ${name}`,
            text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`
        });
        res.status(200).send('Feedback sent');
    } catch (error) {
        console.error('Error sending email', error);
        res.status(500).send('Internal Server Error');
    }
});

export default router;
