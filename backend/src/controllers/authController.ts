import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { generateToken } from '../utils/generateToken';
import sendEmail from '../utils/sendEmail';

export const register = async (req: Request, res: Response) => {
    const { name, email, password } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    try {
        if (!name || !normalizedEmail || !password) {
            return res.status(400).json({ message: 'Name, email, and password are required' });
        }

        const userExists = await User.findOne({ email: normalizedEmail });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({ name, email: normalizedEmail, password });

        if (user) {
            // Send Welcome Email
            await sendEmail(
                user.email,
                'Welcome to Knowledge Portal!',
                `Hi ${user.name},\n\nThank you for registering at Knowledge Portal. We are excited to have you on board!\n\nBest Regards,\nKnowledge Portal Team`
            );

            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id.toString()),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    try {
        if (!normalizedEmail || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const user = await User.findOne({ email: normalizedEmail });

        if (user) {
            let isMatch = await bcrypt.compare(password, user.password);

            // Fallback for legacy/plaintext passwords in dev data
            if (!isMatch && password === user.password) {
                const hashed = await bcrypt.hash(password, 10);
                await User.updateOne({ _id: user._id }, { $set: { password: hashed } });
                isMatch = true;
            }
            if (isMatch) {
                // Send Login Notification
                sendEmail(
                    user.email,
                    'New Login Detected',
                    `Hi ${user.name},\n\nA new login was detected on your account.\n\nIf this was you, you can ignore this email.\n\nBest Regards,\nKnowledge Portal Team`
                );

                res.json({
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    token: generateToken(user._id.toString()),
                });
                return;
            }
        }

        res.status(401).json({ message: 'Invalid email or password' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const googleLogin = async (req: Request, res: Response) => {
    const { token, action } = req.body; // 'login' or 'register'
    try {
        const axios = require('axios');
        const googleRes = await axios.get(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${token}`);
        const { name, email, picture } = googleRes.data;

        const normalizedEmail = email.trim().toLowerCase();
        let user = await User.findOne({ email: normalizedEmail });

        // Auto-create user if they don't exist (regardless of action)
        if (!user) {
            console.log(`Creating new user via Google OAuth: ${normalizedEmail}`);
            user = await User.create({
                name,
                email: normalizedEmail,
                password: Math.random().toString(36).slice(-8), // Dummy password for OAuth users
                avatar: picture
            });

            // Send Welcome Email for new users
            try {
                await sendEmail(
                    user.email,
                    'Welcome to Knowledge Portal!',
                    `Hi ${user.name},\n\nThank you for joining Knowledge Portal via Google. We are excited to have you on board!\n\nBest Regards,\nKnowledge Portal Team`
                );
            } catch (emailError) {
                console.error('Failed to send welcome email:', emailError);
                // Don't fail the registration if email fails
            }
        } else {
            // Existing user logging in
            console.log(`Existing user logging in via Google: ${normalizedEmail}`);

            // Update avatar if it changed
            if (picture && user.avatar !== picture) {
                user.avatar = picture;
                await user.save();
            }
        }

        if (!user) {
            return res.status(500).json({ message: 'Error processing user data' });
        }

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            points: user.points || 0,
            badges: user.badges || [],
            token: generateToken(user._id.toString()),
        });

    } catch (error: any) {
        console.error('Google login error:', error);
        res.status(400).json({ message: 'Google login failed', error: error.message });
    }
};
