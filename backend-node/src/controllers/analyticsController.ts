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
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfWeek = new Date(now.setDate(now.getDate() - 7));

        // 1. Basic Counts
        const totalUsers = await prisma.user.count({ where: { role: 'USER' } });
        const totalCompanies = await prisma.company.count();
        const activeBots = await prisma.company.count({ where: { status: 'ACTIVE' } });

        // 2. Leads (Conversions)
        const leadsThisMonth = await prisma.lead.count({
            where: { createdAt: { gte: startOfMonth } }
        });

        // 3. Messages (Approximated by UsageLogs count)
        const usageLogsThisMonth = await prisma.usageLog.findMany({
            where: { timestamp: { gte: startOfMonth } },
            select: { tokens: true }
        });
        const messagesThisMonth = usageLogsThisMonth.length;
        const totalTokensThisMonth = usageLogsThisMonth.reduce((acc, log) => acc + log.tokens, 0);

        // 3.5 Conversations (Unique sessions)
        const conversationsThisMonth = await prisma.conversation.count({
            where: { createdAt: { gte: startOfMonth } }
        });

        // 4. Revenue (Dummy/Calculated)
        // Assumption: $29/mo base per active bot + $0.00002 per token
        const baseRevenue = activeBots * 29;
        const usageRevenue = totalTokensThisMonth * 0.00002;
        const totalRevenue = baseRevenue + usageRevenue;

        // 5. Weekly Activity (for Chart)
        const weeklyActivity = await Promise.all(
            Array.from({ length: 7 }).map(async (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - (6 - i)); // -6, -5, ... 0 (today)
                date.setHours(0, 0, 0, 0);

                const nextDate = new Date(date);
                nextDate.setDate(date.getDate() + 1);

                const count = await prisma.usageLog.count({
                    where: {
                        timestamp: {
                            gte: date,
                            lt: nextDate
                        }
                    }
                });
                return {
                    day: date.toLocaleDateString('en-US', { weekday: 'short' }),
                    calls: count
                };
            })
        );

        // 6. Top Assistants
        // 6. Top Assistants (Prioritize PENDING, then by Recent Update)
        const topCompanies = await prisma.company.findMany({
            orderBy: [
                { status: 'asc' }, // PENDING comes after ACTIVE alphabetically, but we want PENDING to be visible.
                // Actually, let's just sort by updatedAt desc to show LATEST ones regardless of status
                { updatedAt: 'desc' }
            ],
            take: 10, // Increased to show more
            select: {
                id: true,
                name: true,
                messageCount: true,
                status: true,
                updatedAt: true,
                _count: { select: { leads: true } }
            }
        });

        // Custom sort via JS if we really want PENDING at the top always
        topCompanies.sort((a, b) => {
            // If one is PENDING and other isn't, PENDING first
            if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
            if (a.status !== 'PENDING' && b.status === 'PENDING') return 1;
            // Otherwise sort by date
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });

        res.json({
            stats: {
                assistants: { total: totalCompanies, active: activeBots },
                revenue: totalRevenue.toFixed(2),
                messages: messagesThisMonth,
                conversions: leadsThisMonth,
                conversations: conversationsThisMonth
            },
            weeklyActivity,
            topAssistants: topCompanies.map(c => ({
                id: c.id,
                name: c.name,
                calls: c.messageCount,
                leads: c._count.leads,
                status: c.status,
                updatedAt: c.updatedAt
            }))
        });
    } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
        res.status(500).json({ error: "Failed to fetch stats" });
    }
};
