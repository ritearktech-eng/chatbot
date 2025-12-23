
import { PrismaClient } from '@prisma/client';
import { ingestText, deleteDocumentVectors } from './src/utils/aiClient';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const ADMIN_GUIDE_CONTENT = `# Prime Chatbot Platform - Admin Guide

This comprehensive guide details the setup, configuration, and management of the Prime Chatbot Platform for Super Admins.

## Table of Contents
1.  [System Overview](#system-overview)
2.  [Super Admin Setup](#super-admin-setup)
    *   [Telegram Bot Integration](#telegram-bot-integration)
3.  [Assistant Management](#assistant-management)
    *   [Creating Assistants](#creating-assistants)
    *   [Approval Process](#approval-process)
    *   [Dashboard & Analytics](#dashboard--analytics)
4.  [Integrations](#integrations)
    *   [Google Sheets Export](#google-sheets-export)
    *   [Knowledge Base Management](#knowledge-base-management)
5.  [Troubleshooting](#troubleshooting)

---

## System Overview

The Prime Chatbot Platform is a SaaS solution for creating AI-powered voice and text assistants. It features:
*   **Multi-Tenancy**: Support for multiple companies/assistants.
*   **Multimodal AI**: Handles Text, Voice, PDF, and URL inputs.
*   **Vector Database**: RAG (Retrieval-Augmented Generation) for accurate, context-aware responses.
*   **Automated Workflows**: Telegram notifications and Google Sheet exports.

---

## Super Admin Setup

### Telegram Bot Integration
The Super Admin receives real-time notifications for new assistant registrations via Telegram.

**Prerequisites:**
1.  Create a bot via \`@BotFather\` on Telegram.
2.  Get the **Bot Token**.

**Setup Steps:**
1.  Log in to the **Super Admin Dashboard**.
2.  Navigate to the **Settings** or click **Connect Bot** on the dashboard.
3.  Enter your **Telegram Bot Token**.
4.  **CRITICAL STEP**: Open your bot in Telegram and send the command:
    \`\`\`text
    /start
    \`\`\`
    *This registers your Chat ID with the system so it knows where to send alerts.*
5.  You will receive a confirmation message: "✅ Bot connected!".

---

## Assistant Management

### Creating Assistants
1.  Navigate to **Assistants** > **Create Assistant**.
2.  Fill in the details:
    *   **Name**: Company or Assistant Name.
    *   **System Prompt**: The AI's persona and rules.
    *   **Greeting Message**: First message sent to users.

### Approval Process
When a new assistant is registered (or created by a user):
1.  **Telegram Alert**: You verify a notification with details.
    *   Click **✅ Approve** to activate the assistant.
    *   Click **❌ Reject** to deny the request.
2.  **Dashboard Action**:
    *   Go to **Assistant Activity**.
    *   Pending assistants appear at the top.
    *   Click **Approve** or **Reject**.

### Dashboard & Analytics
The dashboard provides real-time insights:
*   **Total/Active Assistants**
*   **Message Usage**: Monitored against monthly limits.
*   **New Leads**: Track conversions from conversations.

---

## Integrations

### Google Sheets Export
Automatically export lead data (Name, Email, Phone, Summary, Score) to a Google Sheet.

**Setup for Each Company:**
1.  Create a **Google Sheet**.
2.  Share the sheet with the platform's **Service Account Email**:
    *   *(Ask your developer for the \`client_email\` from the backend configuration)*
    *   *Example: \`service-account@your-project-id.iam.gserviceaccount.com\`*
    *   **Permission**: Editor.
3.  Copy the **Spreadsheet ID** from the URL:
    *   \`https://docs.google.com/spreadsheets/d/\`**\`1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms\`**\`/edit\`
4.  Enter this ID in the company settings under **Google Sheet ID**.

**How it Works:**
*   When a chat session ends (or \`end-session\` is triggered), the lead details are appended as a new row.
*   If the email already exists, the row is **updated** instead of duplicated.
*   Timestamps are recorded in **Dubai Time** (Asia/Dubai).

### Knowledge Base Management
Upload data to train the AI assistant.

**Supported Formats:**
*   **PDF**: Policy documents, brochures.
*   **DOCX**: Word documents.
*   **URL**: Website links (the system scrapes textual content).
*   **Text**: Direct copy-paste FAQ or context.

**How to Add:**
1.  Go to **Knowledge Base**.
2.  Select **Upload File** or **Add URL**.
3.  The system automatically:
    *   Extracts text.
    *   Vectors the content.
    *   Syncs it with the AI engine.

---

## Troubleshooting

### Q: I'm not receiving Telegram notifications.
**A:** Did you send \`/start\` to the bot? The system needs your Chat ID. Re-enter the token in the dashboard and send \`/start\` again.

### Q: Google Sheet is not updating.
**A:** Check two things:
1.  Is the **Service Account Email** added as an **Editor** to the sheet?
2.  Is the **Spreadsheet ID** correct?

### Q: New assistants are not visible in the list.
**A:** Refresh the dashboard. The list is sorted to show **PENDING** requests at the top, followed by the most recently updated assistants.
`;

async function seed() {
    console.log("Seeding Support Bot...");

    // Find Super Admin
    const admin = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
    if (!admin) throw new Error("No Super Admin found. Please register an admin first.");

    // Create/Find Support Company
    let company = await prisma.company.findFirst({ where: { name: 'Prime Support' } });

    if (!company) {
        company = await prisma.company.create({
            data: {
                name: 'Prime Support',
                userId: admin.id,
                systemPrompt: "You are Prime Support, an AI assistant dedicated to helping Super Admins manage the Prime Chatbot Platform. Use the provided Admin Guide to answer questions about setup, integrations, and troubleshooting. Be concise, friendly, and helpful.",
                greetingMessage: "Hello! I'm here to help you manage the Prime Chatbot Platform. Ask me anything about setup, integrations, or troubleshooting.",
                status: 'ACTIVE',
                vectorNamespace: uuidv4()
            }
        });
        console.log("Created Prime Support Company:", company.id);
    } else {
        console.log("Found Prime Support Company:", company.id);
        // Update prompts just in case
        await prisma.company.update({
            where: { id: company.id },
            data: {
                systemPrompt: "You are Prime Support, an AI assistant dedicated to helping Super Admins manage the Prime Chatbot Platform. Use the provided Admin Guide to answer questions about setup, integrations, and troubleshooting. Be concise, friendly, and helpful.",
                greetingMessage: "Hello! I'm here to help you manage the Prime Chatbot Platform. Ask me anything about setup, integrations, or troubleshooting."
            }
        });
    }

    // Add Document
    const docTitle = "Admin Guide";

    const existingDoc = await prisma.document.findFirst({
        where: {
            companyId: company.id,
            content: { contains: "Prime Chatbot Platform - Admin Guide" }
        }
    });

    if (existingDoc) {
        console.log("Updating existing Admin Guide...");
        await prisma.document.update({
            where: { id: existingDoc.id },
            data: { content: ADMIN_GUIDE_CONTENT }
        });

        console.log("Clearing old vectors...");
        await deleteDocumentVectors(company.vectorNamespace, existingDoc.id).catch(e => console.warn("Vector clear warning (might be new doc):", e.message));

        console.log("Ingesting new content...");
        await ingestText(company.vectorNamespace, ADMIN_GUIDE_CONTENT, { docId: existingDoc.id, title: docTitle });
    } else {
        console.log("Creating Admin Guide document...");
        const newDoc = await prisma.document.create({
            data: {
                companyId: company.id,
                type: 'TEXT',
                content: ADMIN_GUIDE_CONTENT,
                metadata: { title: docTitle }
            }
        });
        console.log("Ingesting content...");
        await ingestText(company.vectorNamespace, ADMIN_GUIDE_CONTENT, { docId: newDoc.id, title: docTitle });
    }

    console.log("Support Bot Seeded Successfully!");
    console.log("SUPPORT_BOT_ID=" + company.id);
}

seed().catch(console.error).finally(() => prisma.$disconnect());
