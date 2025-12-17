import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

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

            // Check for header row
            let headersLoaded = false;
            try {
                await sheet.loadHeaderRow();
                headersLoaded = true;
            } catch (e) {
                // If loadHeaderRow fails (likely due to empty sheet), we'll set headers
                console.log("Could not load header row (sheet might be empty), initializing headers...");
            }

            if (!headersLoaded || sheet.headerValues.length === 0) {
                console.log("Setting new header row...");
                await sheet.setHeaderRow(['Name', 'Email', 'Phone', 'Date', 'Summary', 'Score']);
            }

            // Upsert Logic: Check if row with this email exists
            const rows = await sheet.getRows();
            const existingRow = leadData.email ? rows.find(row => row.get('Email') === leadData.email) : null;

            if (existingRow) {
                console.log("Found existing row for", leadData.email, "- Updating...");
                existingRow.set('Name', leadData.name || existingRow.get('Name'));
                existingRow.set('Phone', leadData.phone || existingRow.get('Phone'));
                // Only update summary/score if they are not the placeholder defaults, or if we want to overwrite
                if (summary && summary !== "Pending") existingRow.set('Summary', summary);
                if (score && score !== "Pending") existingRow.set('Score', score);
                await existingRow.save();
                console.log("Row updated successfully");
            } else {
                console.log("No existing row found. Appending new row...");

                // Format for Dubai Time
                const dubaiTime = toZonedTime(new Date(), 'Asia/Dubai');
                const timestamp = format(dubaiTime, 'yyyy-MM-dd HH:mm:ss');

                await sheet.addRow({
                    Name: leadData.name || "Anonymous",
                    Email: leadData.email || "N/A",
                    Phone: leadData.phone || "N/A",
                    Date: timestamp,
                    Summary: summary || "Pending",
                    Score: score || "Pending"
                });
                console.log("Row added successfully");
            }

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
