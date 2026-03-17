# NudgeMe Backend (Python FastAPI)

This is the Python FastAPI backend for the NudgeMe application. It provides the same functionality as the original Node.js version but implemented in Python.

## Features

- RESTful API for nudge management
- AI-powered nudge generation using Anthropic Claude
- Email delivery via SendGrid
- WhatsApp delivery via Twilio
- Automated scheduling (weekdays at 9 AM IST)
- Approval queue system
- History tracking

## Prerequisites

- Python 3.8+
- pip (Python package manager)

## Installation

1. **Navigate to the server directory:**
   ```bash
   cd nudgeme-server
   ```

2. **Create a virtual environment (recommended):**
   ```bash
   # Windows
   python -m venv venv
   venv\Scripts\activate

   # Linux/Mac
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables:**
   ```bash
   # Copy the example file
   copy .env.example .env

   # Edit .env with your API keys
   ```

## Configuration

Edit the `.env` file with your API credentials:

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 4000) |
| `ANTHROPIC_API_KEY` | Your Anthropic Claude API key |
| `SENDGRID_API_KEY` | Your SendGrid API key |
| `SENDGRID_FROM_EMAIL` | Verified sender email address |
| `TWILIO_ACCOUNT_SID` | Your Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | Your Twilio Auth Token |
| `TWILIO_WHATSAPP_FROM` | Your Twilio WhatsApp sender number |

## Running the Server

```bash
# Development mode
python app.py
```

The server will start on `http://localhost:4000`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/nudge-history` | Get past nudges (query: coacheeName, topic) |
| GET | `/history-all` | Get all nudge history |
| GET | `/queue` | Get pending nudges |
| POST | `/queue-nudge` | Add nudge to approval queue |
| POST | `/approve/<id>` | Approve and send nudge |
| POST | `/reject/<id>` | Reject nudge |
| PUT | `/queue/<id>` | Edit nudge text |
| GET | `/schedule` | Get schedule configuration |
| PUT | `/schedule` | Update schedule |
| POST | `/send-nudge` | Send nudge directly |

## Running without Node.js

This Python backend is fully standalone. The React frontend can connect to either:

1. **Python backend** (this): `http://localhost:4000`
2. **Node.js backend** (original): `http://localhost:4000`

Just update the `SERVER` constant in the frontend code to point to your preferred backend.

## Scheduler

The scheduler runs automatically at 9:00 AM IST on weekdays (Monday-Friday). You can modify the schedule in `app.py`:

```python
# Change schedule time
scheduler.add_job(func=run_scheduled_nudges, trigger="cron", hour=3, minute=30, day_of_week="mon-fri")
```

## Project Structure

```
nudgeme-server/
├── app.py              # Main Flask application
├── requirements.txt    # Python dependencies
├── .env.example       # Environment variables template
├── nudge-history.json  # Sent nudges history
├── nudge-queue.json   # Pending approval queue
└── nudge-schedule.json # Scheduled nudges config
```

