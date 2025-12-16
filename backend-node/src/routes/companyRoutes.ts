import { Router } from 'express';
import { createCompany, uploadData, getCompanies, deleteCompany, regenerateApiKey, getCompanyDocuments, deleteDocument, toggleDocumentStatus, updateCompany, createLead, getCompanyLeads } from '../controllers/companyController';
import { authenticate } from '../middleware/authMiddleware';
import upload from '../middleware/uploadMiddleware';
import { endChatSession } from '../controllers/chatController';

const router = Router();

// Public Routes
router.post('/lead', createLead);
router.post('/end-session', endChatSession);

router.use(authenticate);

router.post('/create', createCompany);
router.post('/upload', upload.single('file'), uploadData); // Supports file or text/url in body
router.get('/list', getCompanies);
router.patch('/:id', updateCompany);
router.delete('/:id', deleteCompany);
router.post('/regenerate-key', regenerateApiKey);

router.get('/:companyId/documents', getCompanyDocuments);
router.delete('/:companyId/documents/:docId', deleteDocument);
router.patch('/:companyId/documents/:docId/status', toggleDocumentStatus);
router.get('/:companyId/leads', getCompanyLeads);

export default router;
