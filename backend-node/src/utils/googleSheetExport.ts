import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

interface LeadData {
    name: string;
    email: string;
    phone: string | null;
}

export const exportToGoogleSheet = async (company: { googleSheetId?: string | null }, leadData: LeadData, summary: string, score: string) => {
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
                await sheet.setHeaderRow(['Name', 'Email', 'Phone', 'Date', 'Summary', 'Score']);
            }

            await sheet.addRow({
                Name: leadData.name || "Anonymous",
                Email: leadData.email || "N/A",
                Phone: leadData.phone || "N/A",
                Date: new Date().toISOString(),
                Summary: summary,
                Score: score
            });

            console.log("Exported to Google Sheet");
            return true;
        } catch (sheetErr) {
            console.error("Google Sheet Export failed:", sheetErr);
            return false;
        }
    }
    return false;
};
