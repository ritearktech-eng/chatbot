import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import axios from 'axios';

export const endChatSession = async (req: Request, res: Response) => {
    try {
        const { companyId, history, leadData } = req.body;

        if (!companyId || !history) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // 1. Get Company Settings
        const company = await prisma.company.findUnique({ where: { id: companyId } });
        if (!company) return res.status(404).json({ error: "Company not found" });

        // 2. Summarize Conversation
        let summary = "No summary available.";
        try {
            let aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
            if (!aiServiceUrl.startsWith('http')) {
                aiServiceUrl = `http://${aiServiceUrl}`;
            }
            const summarizationRes = await axios.post(`${aiServiceUrl}/chat/summarize`, {
                history: history
            });
            summary = summarizationRes.data.summary;
        } catch (err) {
            console.error("Summarization failed:", err);
            summary = "Summarization service unavailable.";
        }

        // 3. Export to Google Sheet (if configured)
        if (company.googleSheetId && process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
            try {
                const serviceAccountAuth = new JWT({
                    email: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON).client_email,
                    key: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON).private_key,
                    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
                });

                const doc = new GoogleSpreadsheet(company.googleSheetId, serviceAccountAuth);
                await doc.loadInfo();

                const sheet = doc.sheetsByIndex[0]; // Use first sheet

                // Add header row if empty
                await sheet.loadHeaderRow();
                if (sheet.headerValues.length === 0) {
                    await sheet.setHeaderRow(['Name', 'Email', 'Phone', 'Date', 'Summary']);
                }

                await sheet.addRow({
                    Name: leadData?.name || "Anonymous",
                    Email: leadData?.email || "N/A",
                    Phone: leadData?.phone || "N/A",
                    Date: new Date().toISOString(),
                    Summary: summary
                });

                console.log("Exported to Google Sheet");
            } catch (sheetErr) {
                console.error("Google Sheet Export failed:", sheetErr);
                // Don't fail the request if sheet export fails, just log it.
            }
        }

        res.json({ message: "Session ended successfully", summary });

    } catch (error) {
        console.error("End session error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
