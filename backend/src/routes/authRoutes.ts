import express from 'express';
import { register, login, googleLogin } from '../controllers/authController';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);

// Debug Route: Test Email Connection
import nodemailer from 'nodemailer';
router.get('/test-email', async (req, res) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
        });
        await transporter.verify();
        res.send(`✅ SMTP Connection Successful! Logged in as: ${process.env.EMAIL_USER}`);
    } catch (error: any) {
        res.status(200).send(`❌ SMTP Error: ${error.message} (User: ${process.env.EMAIL_USER})`);
    }
});

export default router;
