import os
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from pathlib import Path

from controllers.api import router as api_router
from services.scheduler_service import run_scheduled_nudges

app = FastAPI(title="NudgeMe API")

# ── CORS ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── API Routes ──
app.include_router(api_router)

# ── Serve React Frontend ──
STATIC_DIR = Path(__file__).parent / "static"
if STATIC_DIR.exists():
    app.mount("/assets", StaticFiles(directory=STATIC_DIR / "assets"), name="assets")

    @app.get("/")
    async def serve_root():
        return FileResponse(STATIC_DIR / "index.html")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # If it's an API route don't intercept
        if full_path.startswith("api/") or full_path.startswith("queue") or \
           full_path.startswith("history") or full_path.startswith("schedule") or \
           full_path.startswith("send") or full_path.startswith("approve") or \
           full_path.startswith("reject") or full_path.startswith("generate") or \
           full_path.startswith("webhook") or full_path.startswith("health"):
            return {"detail": "Not Found"}
        return FileResponse(STATIC_DIR / "index.html")

# ── Scheduler ──
scheduler = AsyncIOScheduler()

@app.on_event("startup")
async def startup_event():
    scheduler.add_job(run_scheduled_nudges, "cron", minute="*")
    scheduler.start()
    print("📅 Scheduler active — checking coachee schedules every minute")

@app.on_event("shutdown")
async def shutdown_event():
    scheduler.shutdown()

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 4000))
    uvicorn.run(app, host="0.0.0.0", port=port)