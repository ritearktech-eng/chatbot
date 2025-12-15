# Prime Chatbot Builder

A full-stack SaaS platform for building custom AI chatbots.

## Features
- **Custom Chatbots**: Create chatbots for different companies.
- **Data Ingestion**: Train bots on Text, PDFs, and URLs.
- **Lead Collection**: Capture user details before chatting.
- **Google Sheets Integration**: Automatically export leads and conversation summaries.
- **Embeddable Widget**: Add the chatbot to any website with a simple script.

## 🚀 Deployment Guide (Render)

You will deploy 3 services: **Backend (Node)**, **Backend (AI)**, and **Frontend**.

### 1. Database (PostgreSQL)
- Create a PostgreSQL database (e.g., on Render or Neon.tech).
- Copy the **Connection String**.

### 2. Backend Node API (Web Service)
Helper for main application logic and database.
1.  **Connect Repo**: Select `backend-node` directory (Repository: `Root Directory` -> `backend-node`).
2.  **Runtime**: Node.js
3.  **Build Command**: `npm install && npx prisma generate && npm run build`
4.  **Start Command**: `npm start`
5.  **Environment Variables**:
    - `DATABASE_URL`: (Your Postgres Connection String)
    - `JWT_SECRET`: (A random secret string)
    - `AI_SERVICE_URL`: (The URL of your Python Backend, e.g., `https://my-python-app.onrender.com`)
    - `GOOGLE_SERVICE_ACCOUNT_JSON`: (Paste your full Google Service Account JSON content here for Sheets integration)

### 3. Backend AI API (Web Service)
Helper for AI processing and vector search.
1.  **Connect Repo**: Select `backend-ai` directory permissions (Repository: `Root Directory` -> `backend-ai`).
2.  **Runtime**: Python 3
3.  **Build Command**: `pip install -r requirements.txt`
4.  **Start Command**: `uvicorn main:app --host 0.0.0.0 --port 10000`
5.  **Environment Variables**:
    - `OPENAI_API_KEY`: (Your OpenAI API Key)
    - `QDRANT_URL`: (URL of your Qdrant Vector DB, or use local if using docker volume, but for production use Qdrant Cloud)
    - `QDRANT_API_KEY`: (If using Qdrant Cloud)

### 4. Frontend (Static Site or Web Service)
1.  **Connect Repo**: Select `frontend` directory.
2.  **Build Command**: `npm install && npm run build`
3.  **Publish Directory**: `dist`
4.  **Environment Variables**:
    - `VITE_API_URL`: (The URL of your Node Backend, e.g., `https://my-node-app.onrender.com`)

---

## 🛠 Usage Guide

### 1. Login / Register
- **Default Admin**: `admin@primechatbot.com` / `password123` (if database seeded).
- **Register**: You can also create a new account via the "Register" link on the login page.

### 2. Create a Company
1.  Log in to the dashboard.
2.  Click **"Create Company"**.
3.  Enter Company Name, System Prompt (AI Persona), and Greeting Message.

### 3. Google Sheets Integration
To export leads to Google Sheets:
1.  **Create a Service Account** in Google Cloud Console & Download the JSON key.
2.  Add the JSON key contents to the `GOOGLE_SERVICE_ACCOUNT_JSON` environment variable in your Node Backend.
3.  **Create a Google Sheet** and **Share** it with the Service Account email (found in the JSON).
4.  Copy the **Spreadsheet ID** from the URL.
5.  Go to **Data Management** in the App -> Select Company -> **Edit Settings**.
6.  Paste the **Spreadsheet ID** and Save.

### 4. Embed Widget
1.  Go to **API & Integration**.
2.  Copy the script tag.
3.  Paste it into the `<body >` of your website.

## Local Development

### Prerequisites
- Node.js v20+
- Python 3.12+
- Docker (optional, for DB)

### Setup
1.  **Install Dependencies**:
    ```bash
    cd backend-node && npm install
    cd ../backend-ai && python -m venv venv && source venv/bin/activate && pip install -r requirements.txt
    cd ../frontend && npm install
    ```
2.  **Env Vars**: Copy `.env.example` to `.env` in all folders and fill in details.
3.  **Run**:
    - Node: `npm run dev`
    - Python: `uvicorn main:app --reload`
    - Frontend: `npm run dev`
