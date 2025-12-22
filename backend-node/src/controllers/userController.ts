import { Request, Response } from 'express';
import prisma from '../utils/prisma';

// Get all users with minimal info
export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                email: true,
                role: true,
                createdAt: true,
                companies: {
                    select: {
                        messageCount: true
                    }
                },
                _count: {
                    select: { companies: true }
                }
            }
        });

        const usersWithStats = users.map(user => ({
            id: user.id,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt,
            _count: user._count,
            totalMessages: user.companies.reduce((sum, company) => sum + company.messageCount, 0)
        }));

        res.json(usersWithStats);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

// Get single user details with their companies
export const getUserDetails = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                companies: {
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Strip password before sending
        const { password, ...safeUser } = user;
        res.json(safeUser);
    } catch (error) {
        console.error('Error fetching user details:', error);
        res.status(500).json({ error: 'Failed to fetch user details' });
    }
};
