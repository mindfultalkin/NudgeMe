import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from controllers.api import router as api_router
from services.scheduler_service import run_scheduled_nudges


# ── Create FastAPI App ──
app = FastAPI(title="NudgeMe API")


# ── CORS Setup ──
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Include API Routes ──
app.include_router(api_router, prefix="/api")

app.mount("/static", StaticFiles(directory="static/build", html=True), name="static")


# ── Scheduler ──
scheduler = AsyncIOScheduler()


# ── Startup Event ──
@app.on_event("startup")
async def startup_event():
    # Run every minute — each coachee's send time is checked inside run_scheduled_nudges()
    scheduler.add_job(
        run_scheduled_nudges,
        "cron",
        minute="*"   # every minute, all day
    )
    scheduler.start()
    logger.info("📅 Scheduler active — checking coachee schedules every minute")


# ── Run Server ──
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 4000))
    uvicorn.run(app, host="0.0.0.0", port=port)

