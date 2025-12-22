import { Request, Response } from 'express';

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import prisma from '../utils/prisma';

export const register = async (req: Request, res: Response) => {
    try {
        const { email, password, phone, referralSource, companyName } = req.body;

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        let user;

        // Transaction to ensure user and company are created together if companyName is provided
        await prisma.$transaction(async (tx) => {
            user = await tx.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    phone: phone || null,
                    referralSource: referralSource || null
                },
            });

            if (companyName && user) {
                await tx.company.create({
                    data: {
                        name: companyName,
                        userId: user.id,
                        vectorNamespace: user.id + '_' + Date.now(), // Temporary unique namespace
                        status: 'PENDING'
                    }
                });
            }
        });

        if (!user) {
            throw new Error("User creation failed");
        }

        // Cast user to User type since we know it exists now
        const createdUser = user as any;

        const token = jwt.sign({ userId: createdUser.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });

        res.status(201).json({ token, user: { id: createdUser.id, email: createdUser.email } });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });

        res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
};
