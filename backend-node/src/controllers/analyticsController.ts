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

        // 3. Calls (Approximated by UsageLogs count for now, or just total messageCount delta if we tracked it)
        // We will use UsageLogs to approximate "activity" this month.
        const usageLogsThisMonth = await prisma.usageLog.findMany({
            where: { timestamp: { gte: startOfMonth } },
            select: { tokens: true }
        });
        const callsThisMonth = usageLogsThisMonth.length;
        const totalTokensThisMonth = usageLogsThisMonth.reduce((acc, log) => acc + log.tokens, 0);

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
        const topCompanies = await prisma.company.findMany({
            orderBy: { messageCount: 'desc' },
            take: 5,
            select: {
                id: true,
                name: true,
                messageCount: true,
                status: true,
                updatedAt: true,
                _count: { select: { leads: true } }
            }
        });

        res.json({
            stats: {
                assistants: { total: totalCompanies, active: activeBots },
                revenue: totalRevenue.toFixed(2),
                calls: callsThisMonth,
                conversions: leadsThisMonth
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
