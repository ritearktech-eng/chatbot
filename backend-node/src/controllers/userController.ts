import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { sysBot } from '../services/sysBot';

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

export const updateTelegramConfig = async (req: Request, res: Response) => {
    const { token } = req.body;
    // We assume the requester is the Super Admin (handled by middleware)
    // For simplicity, we update the FIRST Super Admin we find, or the current user if we had user context in request
    // Since this is a restricted endpoint, we can check the decoded token or just update based on a fixed logic if single admin.
    // Ideally, req.user.id should be used.

    // Let's assume we update the user making the request (req.user from authMiddleware)
    const userId = (req as any).user?.userId;

    try {
        await prisma.user.update({
            where: { id: userId },
            data: { telegramBotToken: token }
        });

        // Also initialize/restart the bot service with new token
        // const { sysBot } = require('../services/sysBot');
        // sysBot.startBot(token);

        // Use the singleton imported at top (we need to add the import)
        sysBot.startBot(token);

        res.json({ success: true, message: "Telegram configured. Send /start to your bot now." });
    } catch (error) {
        console.error("Failed to update telegram config", error);
        res.status(500).json({ error: "Failed to update configuration" });
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
