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
app.include_router(api_router, prefix="/api")

# ── Serve React Frontend (only if built) ──
STATIC_DIR = Path(__file__).parent / "static"
ASSETS_DIR = STATIC_DIR / "assets"
INDEX_FILE = STATIC_DIR / "index.html"

if ASSETS_DIR.exists():
    app.mount("/assets", StaticFiles(directory=str(ASSETS_DIR)), name="assets")
    print("✅ Serving React frontend from static/")
else:
    print("⚠️  No static/assets found — frontend not built yet (OK for local dev)")

# ── Catch-all: serve React SPA ──
@app.get("/")
async def serve_root():
    if INDEX_FILE.exists():
        return FileResponse(str(INDEX_FILE))
    return {"message": "NudgeMe API is running. Frontend not built yet."}

@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    # Don't intercept API routes
    if full_path.startswith("api/"):
        from fastapi import HTTPException
        raise HTTPException(status_code=404)
    if INDEX_FILE.exists():
        return FileResponse(str(INDEX_FILE))
    return {"message": "NudgeMe API running", "path": full_path}

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
    print("📅 Scheduler stopped")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 4000))
    uvicorn.run(app, host="0.0.0.0", port=port)