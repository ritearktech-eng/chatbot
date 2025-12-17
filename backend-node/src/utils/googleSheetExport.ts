import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

interface LeadData {
    name: string;
    email: string;
    phone: string | null;
}

export const exportToGoogleSheet = async (company: { googleSheetId?: string | null }, leadData: LeadData, summary: string, score: string) => {
    console.log("Starting Google Sheet Export for company:", company.googleSheetId);
    console.log("Has Service Account JSON:", !!process.env.GOOGLE_SERVICE_ACCOUNT_JSON);

    if (company.googleSheetId && process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
        try {
            console.log("Parsing Service Account JSON...");
            const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
            console.log("Service Account Email:", credentials.client_email);

            const serviceAccountAuth = new JWT({
                email: credentials.client_email,
                key: credentials.private_key,
                scopes: ['https://www.googleapis.com/auth/spreadsheets'],
            });

            console.log("Loading Doc Info...");
            const doc = new GoogleSpreadsheet(company.googleSheetId, serviceAccountAuth);
            await doc.loadInfo();
            console.log("Doc Title:", doc.title);

            const sheet = doc.sheetsByIndex[0]; // Use first sheet
            console.log("Sheet Title:", sheet.title);

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

            console.log("Exported to Google Sheet successfully");
            return true;
        } catch (sheetErr: any) {
            console.error("Google Sheet Export ERROR DETAILS:", sheetErr.message);
            if (sheetErr.response) {
                console.error("Google API Response Error:", sheetErr.response.data);
            }
            return false;
        }
    } else {
        console.error("Missing Configuration: SheetId or Service Account JSON missing.");
    }
    return false;
};
