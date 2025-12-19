import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const incrementMessageCount = async (req: Request, res: Response) => {
    const { companyId } = req.params;
    try {
        await prisma.company.update({
            where: { id: companyId },
            data: { messageCount: { increment: 1 } }
        });
        res.json({ success: true });
    } catch (error) {
        console.error("Failed to increment message count", error);
        res.status(500).json({ error: "Failed to update stats" });
    }
};

export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        const totalUsers = await prisma.user.count({ where: { role: 'USER' } });
        const totalCompanies = await prisma.company.count();

        // Get top 5 active companies by message count
        const topCompanies = await prisma.company.findMany({
            orderBy: { messageCount: 'desc' },
            take: 5,
            select: {
                id: true,
                name: true,
                messageCount: true,
                _count: { select: { documents: true } }
            }
        });

        const pendingCompanies = await prisma.company.findMany({
            where: { status: 'PENDING' },
            orderBy: { createdAt: 'desc' },
            select: { id: true, name: true, createdAt: true }
        });

        res.json({
            totalUsers,
            totalCompanies,
            topCompanies, // "Active Companies"
            pendingCompanies
        });
    } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
        res.status(500).json({ error: "Failed to fetch stats" });
    }
};
