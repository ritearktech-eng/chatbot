import { Router } from 'express';
import { generateChatResponse } from '../utils/aiClient';
import prisma from '../utils/prisma';

const router = Router();

router.post('/:companyId', async (req, res) => {
    try {
        const { companyId } = req.params;
        const { query, history, inputType, inputAudio } = req.body;

        // Verify company exists
        const company = await prisma.company.findUnique({ where: { id: companyId } });
        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }

        if (company.status !== 'ACTIVE') {
            return res.status(403).json({
                error: 'Subscription inactive. Please contact billing.',
                code: 'COMPANY_INACTIVE'
            });
        }

        // Call AI Service
        const aiResponse = await generateChatResponse({
            companyId: company.vectorNamespace, // Use namespace
            query,
            history: history || [],
            inputType,
            inputAudio,
            systemPrompt: company.systemPrompt
        });

        res.json(aiResponse);
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ error: 'Failed to generate response' });
    }
});

export default router;
