import axios from 'axios';

let AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
if (!AI_SERVICE_URL.startsWith('http')) {
    AI_SERVICE_URL = `http://${AI_SERVICE_URL}`;
}

export const ingestText = async (companyId: string, text: string, metadata: any) => {
    try {
        const response = await axios.post(`${AI_SERVICE_URL}/process/ingest`, {
            companyId,
            text,
            metadata
        });
        return response.data;
    } catch (error) {
        console.error('Error sending data to AI service:', error);
        throw new Error('AI Service Unavailable');
    }
};

export const deleteCompanyVectors = async (companyId: string) => {
    try {
        await axios.post(`${AI_SERVICE_URL}/manage/delete-collection`, { companyId });
    } catch (error) {
        console.error('Error deleting vectors:', error);
    }
};

export const deleteDocumentVectors = async (companyId: string, docId: string) => {
    try {
        await axios.post(`${AI_SERVICE_URL}/manage/delete-document-vectors`, { companyId, docId });
    } catch (error) {
        console.error('Error deleting document vectors:', error);
        throw new Error('AI Service Deletion Failed');
    }
};

export const updateDocumentStatus = async (companyId: string, docId: string, isActive: boolean) => {
    try {
        await axios.post(`${AI_SERVICE_URL}/manage/update-document-status`, { companyId, docId, isActive });
    } catch (error) {
        console.error('Error updating document status:', error);
        // Throwing is optional, might want to fail soft or hard depending on requirements.
        // Failing soft here allows DB update to proceed even if AI sync fails temporarily (though ideally should be transactional).
        throw new Error('AI Service Update Failed');
    }
};

export const generateChatResponse = async (payload: any) => {
    try {
        const response = await axios.post(`${AI_SERVICE_URL}/chat/generate`, payload);
        return response.data;
    } catch (error) {
        console.error('Error generating chat response:', error);
        throw new Error('AI Service Chat Failed');
    }
};
