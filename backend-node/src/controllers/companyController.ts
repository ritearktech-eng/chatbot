import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { parseFileContent, scrapeUrl } from '../utils/fileParser';
import { ingestText, deleteCompanyVectors, deleteDocumentVectors, updateDocumentStatus } from '../utils/aiClient';
import { exportToGoogleSheet } from '../utils/googleSheetExport';

const prisma = new PrismaClient();

export const createCompany = async (req: Request, res: Response) => {
    try {
        const { name, systemPrompt, greetingMessage } = req.body;
        const userId = (req as any).user.userId;
        console.log("Creating company for user:", userId, "Data:", { name, systemPrompt, greetingMessage });

        const apiKey = uuidv4();
        const company = await prisma.company.create({
            data: {
                name,
                systemPrompt,
                greetingMessage,
                userId,
                vectorNamespace: uuidv4(),
                apiKeys: { create: { key: apiKey } }
            },
            include: { apiKeys: true }
        });

        res.status(201).json(company);
    } catch (error: any) {
        console.error("Error creating company:", error);
        if (error.code === 'P2003') {
            return res.status(401).json({ error: 'User not found. Please log out and log in again.' });
        }
        res.status(500).json({ error: 'Failed to create company' });
    }
};

export const updateCompany = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, systemPrompt, greetingMessage, googleSheetId, telegramBotToken, telegramChatId } = req.body;

        // Ensure only provided fields are updated
        const dataToUpdate: any = {};
        if (name !== undefined) dataToUpdate.name = name;
        if (systemPrompt !== undefined) dataToUpdate.systemPrompt = systemPrompt;
        if (greetingMessage !== undefined) dataToUpdate.greetingMessage = greetingMessage;
        if (googleSheetId !== undefined) dataToUpdate.googleSheetId = googleSheetId;
        if (telegramBotToken !== undefined) dataToUpdate.telegramBotToken = telegramBotToken;
        if (telegramChatId !== undefined) dataToUpdate.telegramChatId = telegramChatId;

        const company = await prisma.company.update({
            where: { id },
            data: dataToUpdate
        });

        res.json(company);
    } catch (error) {
        console.error("Error updating company:", error);
        res.status(500).json({ error: 'Failed to update company' });
    }
};

export const createLead = async (req: Request, res: Response) => {
    try {
        const { companyId, name, email, phone } = req.body;

        if (!companyId || !name || !email) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const lead = await prisma.lead.create({
            data: {
                companyId,
                name,
                email,
                phone
            }
        });

        // Auto-Export to Google Sheet (Async - don't block response)
        const company = await prisma.company.findUnique({ where: { id: companyId } });
        if (company) {
            exportToGoogleSheet(company, { name, email, phone }, "Pending", "Pending")
                .catch(err => console.error("Auto-export failed:", err));
        }

        res.status(201).json(lead);
    } catch (error) {
        console.error("Error creating lead:", error);
        res.status(500).json({ error: "Failed to create lead" });
    }
};

export const uploadData = async (req: Request, res: Response) => {
    try {
        const { companyId, type, content: rawContent } = req.body;
        // type: TEXT, URL, FAQ (handled as TEXT)
        // If file is uploaded, 'type' might be inferred or passed.

        let textContent = '';
        let metadata = {};

        if (req.file) {
            textContent = await parseFileContent(req.file);
            metadata = { filename: req.file.originalname, mimetype: req.file.mimetype };
        } else if (type === 'URL') {
            textContent = await scrapeUrl(rawContent);
            metadata = { url: rawContent };
        } else {
            textContent = rawContent;
        }

        if (!textContent) {
            return res.status(400).json({ error: 'No content found' });
        }

        // Save to Postgres
        const doc = await prisma.document.create({
            data: {
                companyId,
                type: req.file ? (req.file.mimetype === 'application/pdf' ? 'PDF' : 'DOCX') : (type || 'TEXT'),
                content: textContent,
                metadata
            }
        });

        // Send to AI Service
        // We need the company's vector namespace. 
        const company = await prisma.company.findUnique({ where: { id: companyId } });
        if (!company) throw new Error('Company not found');

        await ingestText(company.vectorNamespace, textContent, { docId: doc.id, ...metadata });

        res.json({ message: 'Processed successfully', docId: doc.id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Upload failed' });
    }
};

export const getCompanies = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const companies = await prisma.company.findMany({
            where: { userId },
            include: { _count: { select: { documents: true } } }
        });
        res.json(companies);
    } catch (error) {
        res.status(500).json({ error: 'Fetch failed' });
    }
};

export const deleteCompany = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const company = await prisma.company.findUnique({ where: { id } });
        if (company) {
            await deleteCompanyVectors(company.vectorNamespace);
            await prisma.company.delete({ where: { id } });
        }
        res.json({ message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Delete failed' });
    }
};

export const regenerateApiKey = async (req: Request, res: Response) => {
    try {
        const { companyId } = req.body;
        // In real app, verify ownership
        const newKey = uuidv4();
        await prisma.apiKey.updateMany({
            where: { companyId },
            data: { key: newKey } // Replace all/primary
        });
        res.json({ key: newKey });
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
};

export const getCompanyDocuments = async (req: Request, res: Response) => {
    try {
        const { companyId } = req.params;
        const documents = await prisma.document.findMany({
            where: { companyId },
            orderBy: { createdAt: 'desc' }
        });
        res.json(documents);
    } catch (error) {
        res.status(500).json({ error: 'Fetch failed' });
    }
};

export const deleteDocument = async (req: Request, res: Response) => {
    try {
        const { companyId, docId } = req.params;
        const document = await prisma.document.findUnique({ where: { id: docId } });

        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }

        const company = await prisma.company.findUnique({ where: { id: companyId } });
        if (company) {
            // Delete from Vector DB
            // We need to pass the vectorNamespace (which acts as companyId for AI service)
            try {
                await deleteDocumentVectors(company.vectorNamespace, docId);
            } catch (err) {
                console.error("Vector deletion failed (proceeding with DB delete):", err);
            }
        }

        // Delete from Postgres
        await prisma.document.delete({ where: { id: docId } });

        res.json({ message: 'Document deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Delete failed' });
    }
};

export const toggleDocumentStatus = async (req: Request, res: Response) => {
    try {
        const { companyId, docId } = req.params;
        const { isActive } = req.body; // Expecting boolean

        if (typeof isActive !== 'boolean') {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const document = await prisma.document.findUnique({ where: { id: docId } });
        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }

        const company = await prisma.company.findUnique({ where: { id: companyId } });
        if (company) {
            // Update AI Service
            // We use vectorNamespace as companyId for AI
            await updateDocumentStatus(company.vectorNamespace, docId, isActive);
        }

        // Update Postgres
        const updatedDoc = await prisma.document.update({
            where: { id: docId },
            data: { isActive }
        });

        res.json(updatedDoc);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Update failed' });
    }
};

export const getCompanyLeads = async (req: Request, res: Response) => {
    try {
        const { companyId } = req.params;
        const leads = await prisma.lead.findMany({
            where: { companyId },
            include: {
                conversations: {
                    orderBy: { createdAt: 'desc' }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(leads);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Fetch failed' });
    }
};

export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;

        const [companiesCount, documentsCount, conversationsCount, recentCompany] = await Promise.all([
            prisma.company.count({ where: { userId } }),
            prisma.document.count({ where: { company: { userId } } }),
            prisma.conversation.count({ where: { lead: { company: { userId } } } }),
            prisma.company.findFirst({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                select: { name: true, createdAt: true }
            })
        ]);

        res.json({
            documents: documentsCount,
            activeBots: companiesCount,
            queries: conversationsCount,
            recentActivity: recentCompany ? {
                title: "System Update",
                description: `Latest bot created: ${recentCompany.name}`,
                time: recentCompany.createdAt
            } : null
        });
    } catch (error) {
        console.error("Stats fetch error:", error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
};

export const exportLeadToSheet = async (req: Request, res: Response) => {
    try {
        const { companyId, leadId } = req.params;

        const [company, lead] = await Promise.all([
            prisma.company.findUnique({ where: { id: companyId } }),
            prisma.lead.findUnique({
                where: { id: leadId },
                include: { conversations: { orderBy: { createdAt: 'desc' }, take: 1 } }
            })
        ]);

        if (!company) return res.status(404).json({ error: "Company not found" });
        if (!lead) return res.status(404).json({ error: "Lead not found" });

        const lastConv = lead.conversations[0];
        const summary = lastConv?.summary || "Manual Export";
        const score = lastConv?.score || lead.status;

        const success = await exportToGoogleSheet(company, {
            name: lead.name,
            email: lead.email,
            phone: lead.phone
        }, summary, score);

        if (success) {
            res.json({ message: "Lead exported to Google Sheet successfully" });
        } else {
            res.status(500).json({ error: "Failed to export lead. Check server logs." });
        }

    } catch (error) {
        console.error("Export lead error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
