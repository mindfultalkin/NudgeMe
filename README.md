# NudgeMe - Production Ready Full-Stack Coaching Nudge App

## Overview
NudgeMe is a full-stack application for generating, queuing, approving, and sending personalized coaching nudges via email or WhatsApp. Backend powered by FastAPI (Python), frontend React/Vite. Production-ready for Railway deployment (single service: backend serves frontend static).

## Tech Stack
- **Backend**: FastAPI, APScheduler, Anthropic (AI), SendGrid (Email), AiSensy (WhatsApp), JSON persistence
- **Frontend**: React 18, Vite, TailwindCSS
- **Deployment**: Railway (Procfile, railway.json)

## Local Development

### Prerequisites
- Node.js 18+
- Python 3.12+
- Git

### 1. Clone & Install
```
git clone <repo>
cd nudgeme-server
pip install -r requirements.txt
cd ../nudgeme
npm install
```

### 2. Environment Variables
```
cd nudgeme-server
copy .env.example .env
# Edit .env with your keys
```

### 3. Build Frontend & Run Backend
```
cd nudgeme
npm run build
cd ../nudgeme-server
python app.py
```

Open http://localhost:4000 - Frontend served from /static, API at /api/*

## Production Deployment - Railway

### 1. Install Railway CLI
```
npm i -g @railway/cli
railway login
```

### 2. Deploy
```
railway init  # or railway link <projectId>
railway up
```

### 3. Set Environment Variables (Railway Dashboard)
- ANTHROPIC_API_KEY
- SENDGRID_API_KEY
- SENDGRID_FROM_EMAIL
- AISENSY_API_KEY
- AISENSY_CAMPAIGN_NAME

### 4. Access
Your app URL: https://*.up.railway.app

## API Endpoints (prefixed /api)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| GET | /generate-nudge?topic=...&coacheeName=... | Generate AI nudge |
| GET | /queue | Get pending nudges |
| POST | /queue-nudge | Queue new nudge |
| POST | /approve/{id} | Approve/send queued |
| POST | /reject/{id} | Reject queued |
| PUT | /queue/{id} | Edit queued nudge |
| GET | /schedule | Get schedule |
| PUT | /schedule | Update schedule |
| POST | /send-nudge | Send direct |
| GET | /history-all | All history |

## Features
- AI nudges (Claude)
- Approval queue
- History tracking
- Scheduled daily/weekly nudges
- Multi-channel (Email/WhatsApp)
- Responsive UI (mobile/desktop)
- Prod logging, CORS, Gunicorn workers

## Scaling Notes
- JSON files ok for low volume; migrate to Postgres for high-scale (Railway DB)
- Rate limiting optional (add slowapi)

Enjoy nudging! 🚀
