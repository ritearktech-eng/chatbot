import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import axios from 'axios';
import { exportToGoogleSheet } from '../utils/googleSheetExport';
import { sendTelegramMessage } from '../utils/telegramExport';

export const endChatSession = async (req: Request, res: Response) => {
    try {
        const { companyId, history, leadData } = req.body;

        if (!companyId || !history) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // 1. Get Company Settings
        const company = await prisma.company.findUnique({ where: { id: companyId } });
        if (!company) return res.status(404).json({ error: "Company not found" });

        // 2. Find or Create Lead
        let leadId = null;
        if (leadData && (leadData.email || leadData.phone)) {
            // Try matching by email
            let lead = await prisma.lead.findFirst({
                where: {
                    companyId,
                    email: leadData.email
                }
            });

            if (!lead) {
                lead = await prisma.lead.create({
                    data: {
                        companyId,
                        name: leadData.name || "Anonymous",
                        email: leadData.email || "N/A",
                        phone: leadData.phone
                    }
                });
            }
            leadId = lead.id;
        }

        // 3. Summarize Conversation & Get Score
        let summary = "No summary available.";
        let score = "NEW";

        try {
            let aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
            if (!aiServiceUrl.startsWith('http')) {
                aiServiceUrl = `http://${aiServiceUrl}`;
            }
            const summarizationRes = await axios.post(`${aiServiceUrl}/chat/summarize`, {
                history: history
            });
            summary = summarizationRes.data.summary;
            score = summarizationRes.data.score || "NEW";

            if (summarizationRes.data.topics && Array.isArray(summarizationRes.data.topics)) {
                summary += `\n\nTopics: ${summarizationRes.data.topics.join(", ")}`;
            }
        } catch (err) {
            console.error("Summarization failed:", err);
            summary = "Summarization service unavailable.";
        }

        // Fallback: If summary is still empty or default, and we have history, use the last user message
        if ((!summary || summary === "No summary available.") && history && history.length > 0) {
            const lastUserMsg = [...history].reverse().find((m: any) => m.role === 'user');
            if (lastUserMsg) {
                summary = `User asked: "${lastUserMsg.content.slice(0, 100)}..."`;
            }
        }

        // 4. Save Conversation to DB
        if (leadId) {
            await prisma.conversation.create({
                data: {
                    leadId,
                    history: history, // Prisma handles Json type
                    summary,
                    score
                }
            });

            // Update Lead Status based on latest score
            await prisma.lead.update({
                where: { id: leadId },
                data: { status: score }
            });
        }

        // 5. Export to Google Sheet AND Telegram
        await exportToGoogleSheet(company, {
            name: leadData?.name || "Anonymous",
            email: leadData?.email || "N/A",
            phone: leadData?.phone || null
        }, summary, score);

        // Send Telegram Notification
        await sendTelegramMessage(company, {
            name: leadData?.name,
            email: leadData?.email,
            phone: leadData?.phone
        }, summary, score);

        res.json({ message: "Session ended successfully", summary, score });

    } catch (error) {
        console.error("End session error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
