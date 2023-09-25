import express from 'express';
import nodemailer from 'nodemailer';

const router = express.Router();

router.post('/', async (req, res) => {
    const { name, email, message } = req.body;

    const transporter = nodemailer.createTransport({
        host: 'smtp.hostinger.com',
        port: 587,
        secure: false,
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
