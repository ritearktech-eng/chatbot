
import { Request, Response } from 'express';
import svgCaptcha from 'svg-captcha';
import jwt from 'jsonwebtoken';

const CAPTCHA_SECRET = process.env.CAPTCHA_SECRET || process.env.JWT_SECRET || 'captcha_secret_key';

export const generateCaptcha = (req: Request, res: Response) => {
    try {
        const captcha = svgCaptcha.create({
            size: 6,
            noise: 2,
            color: true,
            background: '#f0f0f0'
        });

        // Sign the text to create a stateless token
        // Token expires in 5 minutes
        const token = jwt.sign({ answer: captcha.text.toLowerCase() }, CAPTCHA_SECRET, { expiresIn: '5m' });

        res.json({
            image: captcha.data,
            token: token
        });
    } catch (error) {
        console.error('Captcha generation error:', error);
        res.status(500).json({ error: 'Failed to generate captcha' });
    }
};

export const verifyCaptcha = (token: string, input: string): boolean => {
    if (!token || !input) return false;

    try {
        const decoded = jwt.verify(token, CAPTCHA_SECRET) as { answer: string };
        return decoded.answer === input.toLowerCase();
    } catch (error) {
        console.error('Captcha verification failed:', error);
        return false;
    }
};
