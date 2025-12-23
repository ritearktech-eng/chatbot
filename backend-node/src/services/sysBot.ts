
import TelegramBot from 'node-telegram-bot-api';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class SysBotService {
    private bot: TelegramBot | null = null;
    private botToken: string | null = null;
    private isPolling = false;

    constructor() {
        this.initialize();
    }

    async initialize() {
        // Find Super Admin settings
        // Assuming there is only one Super Admin for now who configures this
        // Or we pick the first one with a token
        /* 
           Ideal way: The service should support multiple admins, but for this specific request:
           "one telegram integration in superadmin"
        */
        const admin = await prisma.user.findFirst({
            where: { role: 'SUPER_ADMIN', telegramBotToken: { not: null } }
        });

        if (admin && admin.telegramBotToken) {
            this.startBot(admin.telegramBotToken);
        }
    }

    async startBot(token: string) {
        if (this.bot && this.botToken === token) return; // Already running

        if (this.bot) {
            await this.bot.stopPolling();
        }

        this.bot = new TelegramBot(token, { polling: false }); // Start without polling first
        this.botToken = token;

        try {
            await this.bot.deleteWebHook(); // Ensure no webhook conflicts
            await this.bot.startPolling(); // Manually start polling
            this.isPolling = true;
            console.log("System Bot started with polling.");
        } catch (err: any) {
            console.error("Failed to start bot polling:", err.message);
        }

        this.bot.on('polling_error', (error) => {
            console.error("Telegram Polling Error:", error); // vital for debugging
        });

        this.bot.on('callback_query', async (query: TelegramBot.CallbackQuery) => {
            if (!query.data || !query.message) return;
            const chatId = query.message.chat.id;
            const messageId = query.message.message_id;

            // Expected format: action_companyId
            const [action, companyId] = query.data.split('_');

            if (!['approve', 'reject'].includes(action)) return;

            try {
                const status = action === 'approve' ? 'ACTIVE' : 'REJECTED';

                // Update Company Status
                await prisma.company.update({
                    where: { id: companyId },
                    data: { status }
                });

                // Update Message UI
                const newText = `${query.message.text}\n\n✅ *Action Taken*: ${status}`;
                await this.bot?.editMessageText(newText, {
                    chat_id: chatId,
                    message_id: messageId,
                    parse_mode: 'Markdown'
                });

                await this.bot?.answerCallbackQuery(query.id, { text: `Company ${status}` });

            } catch (error) {
                console.error("Bot configuration error", error);
                await this.bot?.answerCallbackQuery(query.id, { text: 'Error updating status' });
            }
        });

        // Listen for /start to set Chat ID
        this.bot.onText(/\/start/, async (msg: TelegramBot.Message) => {
            const chatId = msg.chat.id.toString();
            console.log("Received /start from", chatId);

            // Update Admin's Chat ID
            // We need to find WHICH admin this is. 
            // Validating by token is hard here without context.
            // For now, update the FIRST admin that has THIS token.
            await prisma.user.updateMany({
                where: { telegramBotToken: token, role: 'SUPER_ADMIN' },
                data: { telegramChatId: chatId }
            });

            this.bot?.sendMessage(chatId, "✅ Bot connected! You will now receive alerts for new assistants.");
        });
    }

    async notifyNewAssistant(company: { id: string, name: string, createdAt: Date }) {
        console.log("notifyNewAssistant called for:", company.name);
        if (!this.bot) {
            console.log("Bot not initialized, likely due to no active token. Attempting init...");
            await this.initialize();
        }
        if (!this.bot) {
            console.error("notifyNewAssistant: Bot is still not initialized.");
            return;
        }

        // Get Admins with Chat IDs
        const admins = await prisma.user.findMany({
            where: { role: 'SUPER_ADMIN', telegramChatId: { not: null } }
        });

        console.log(`Found ${admins.length} Super Admins to notify.`);

        for (const admin of admins) {
            if (!admin.telegramChatId) continue;
            console.log(`Sending notification to Admin ID: ${admin.id}, ChatID: ${admin.telegramChatId}`);

            const message = `
🆕 *New Assistant Registration*

🏢 *System*: ${company.name}
🆔 *ID*: \`${company.id}\`
📅 *Time*: ${company.createdAt.toLocaleString()}

Please approve or reject this request.
            `.trim();

            try {
                await this.bot.sendMessage(admin.telegramChatId, message, {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: '✅ Approve', callback_data: `approve_${company.id}` },
                                { text: '❌ Reject', callback_data: `reject_${company.id}` }
                            ]
                        ]
                    }
                });
                console.log("Message sent successfully to", admin.telegramChatId);
            } catch (err) {
                console.error(`Failed to send notification to ${admin.telegramChatId}`, err);
            }
        }
    }
}

export const sysBot = new SysBotService();
