import { Router } from 'express';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

router.post('/:companyId', async (req, res) => {
    try {
        const { companyId } = req.params;
        const { query, history, inputType, inputAudio } = req.body;

        // Verify company exists
        const company = await prisma.company.findUnique({ where: { id: companyId } });
        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }

        // Call AI Service
        const aiResponse = await axios.post(`${AI_SERVICE_URL}/chat/generate`, {
            companyId: company.vectorNamespace, // Use namespace
            query,
            history: history || [],
            inputType,
            inputAudio,
            systemPrompt: company.systemPrompt
        });

        res.json(aiResponse.data);
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ error: 'Failed to generate response' });
    }
});

export default router;
