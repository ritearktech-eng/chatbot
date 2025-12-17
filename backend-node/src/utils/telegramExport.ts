import axios from 'axios';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

interface LeadData {
    name?: string;
    email?: string;
    phone?: string | null;
}

export const sendTelegramMessage = async (
    company: { telegramBotToken?: string | null; telegramChatId?: string | null },
    leadData: LeadData,
    summary: string,
    score: string
) => {
    if (!company.telegramBotToken || !company.telegramChatId) {
        console.log("Telegram not configured for this company. Skipping.");
        return;
    }

    try {
        // Format Timestamp in Dubai Time
        const dubaiTime = toZonedTime(new Date(), 'Asia/Dubai');
        const timestamp = format(dubaiTime, 'yyyy-MM-dd HH:mm:ss');

        const message = `
🚨 *New Lead Captured* 🚨

👤 *Name*: ${leadData.name || "Anonymous"}
📧 *Email*: ${leadData.email || "N/A"}
📞 *Phone*: ${leadData.phone || "N/A"}

📊 *Score*: ${score}
📅 *Time (Dubai)*: ${timestamp}

📝 *Summary*:
${summary}
        `.trim();

        const url = `https://api.telegram.org/bot${company.telegramBotToken}/sendMessage`;

        await axios.post(url, {
            chat_id: company.telegramChatId,
            text: message,
            parse_mode: 'Markdown'
        });

        console.log("Telegram notification sent successfully.");
        return true;

    } catch (error: any) {
        console.error("Failed to send Telegram message:", error?.response?.data || error.message);
        return false;
    }
};
