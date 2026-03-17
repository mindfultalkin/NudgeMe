from datetime import datetime
from fastapi import APIRouter, HTTPException, Query
from typing import Optional

from models.schemas import (
    QueueNudgeRequest,
    SendNudgeRequest,
    EditNudgeRequest,
    ScheduleUpdate
)
from services.json_store import (
    load_history,
    save_history,
    load_queue,
    save_queue,
    load_schedule,
    save_json,
    SCHEDULE_FILE
)
import logging
logger = logging.getLogger(__name__)

from services.history import get_past_nudges, record_nudge
from services.queue import queue_nudge
from services.ai_service import generate_nudge_server
from services.email_service import send_email
from services.whatsapp_service import send_whatsapp


# Create router
router = APIRouter()


# ── Health Check ──
@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "NudgeMe server is running", "time": datetime.now().isoformat()}


# ── Generate Nudge Endpoint ──
@router.get("/generate-nudge")
async def generate_nudge(
    topic: str = Query(...),
    coacheeName: str = Query(...)
):
    """Generate a nudge using the backend AI service."""
    try:
        nudge = await generate_nudge_server(topic, coacheeName)
        return {"nudge": nudge}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── History Endpoints ──
@router.get("/nudge-history")
async def get_nudge_history(
    coacheeName: Optional[str] = Query(None),
    topic: Optional[str] = Query(None)
):
    """Get past nudges for a specific coachee and topic."""
    if not coacheeName or not topic:
        return {"pastNudges": []}
    past_nudges = get_past_nudges(coacheeName, topic)
    return {"pastNudges": past_nudges}


@router.get("/history-all")
async def get_history_all():
    """Get all nudge history."""
    history = load_history()
    all_entries = []
    
    for key, entries in history.items():
        parts = key.split("::")
        if len(parts) == 2:
            coachee_name, topic = parts
            for entry in entries:
                all_entries.append({
                    "coacheeName": coachee_name,
                    "topic": topic,
                    **entry
                })
    
    # Sort by sentAt in reverse order
    all_entries.sort(key=lambda x: x.get("sentAt", ""), reverse=True)
    return {"history": all_entries}


# ── Queue Endpoints ──
@router.get("/queue")
async def get_queue():
    """Get all queued nudges."""
    queue = load_queue()
    return {"queue": queue}


@router.post("/queue-nudge")
async def add_to_queue(req: QueueNudgeRequest):
    """Add a nudge to the queue for approval."""
    try:
        # Generate nudge using AI
        nudge = await generate_nudge_server(req.topic, req.coacheeName)
        
        # Determine destination based on channel
        destination = req.email if req.channel == "Email" else req.phone
        
        # Add to queue
        queue_nudge({
            "coacheeName": req.coacheeName,
            "coach": req.coach,
            "topic": req.topic,
            "nudge": nudge,
            "channel": req.channel,
            "destination": destination
        })
        
        return {"success": True, "nudge": nudge}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/approve/{nudge_id}")
async def approve_nudge(nudge_id: str):
    """Approve and send a queued nudge."""
    queue = load_queue()
    idx = next((i for i, q in enumerate(queue) if q["id"] == nudge_id), -1)
    
    if idx == -1:
        raise HTTPException(status_code=404, detail="Not found")
    
    entry = queue[idx]
    
    try:
        if entry["channel"] == "Email":
            await send_email(
                coachee_name=entry["coacheeName"],
                topic=entry["topic"],
                nudge=entry["nudge"],
                destination=entry["destination"],
                coach=entry.get("coach")
            )
        elif entry["channel"] == "WhatsApp":
            await send_whatsapp(
                coachee_name=entry["coacheeName"],
                nudge=entry["nudge"],
                destination=entry["destination"]
            )
        
        # Record in history
        record_nudge(entry["coacheeName"], entry["topic"], entry["nudge"])
        
        # Update queue status
        queue[idx]["status"] = "sent"
        queue[idx]["sentAt"] = datetime.now().isoformat()
        save_queue(queue)
        
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/reject/{nudge_id}")
async def reject_nudge(nudge_id: str):
    """Reject a queued nudge."""
    queue = load_queue()
    idx = next((i for i, q in enumerate(queue) if q["id"] == nudge_id), -1)
    
    if idx == -1:
        raise HTTPException(status_code=404, detail="Not found")
    
    queue[idx]["status"] = "rejected"
    save_queue(queue)
    
    return {"success": True}


@router.put("/queue/{nudge_id}")
async def edit_queue_nudge(nudge_id: str, req: EditNudgeRequest):
    """Edit a queued nudge."""
    queue = load_queue()
    idx = next((i for i, q in enumerate(queue) if q["id"] == nudge_id), -1)
    
    if idx == -1:
        raise HTTPException(status_code=404, detail="Not found")
    
    queue[idx]["nudge"] = req.nudge
    save_queue(queue)
    
    return {"success": True}


# ── Schedule Endpoints ──
@router.get("/schedule")
async def get_schedule():
    """Get the nudge schedule."""
    schedule = load_schedule()
    return {"schedule": schedule}


@router.put("/schedule")
async def update_schedule(req: ScheduleUpdate):
    schedule = req.schedule
    # Auto-inject lastTopicIndex for any entry missing it
    for entry in schedule:
        if "lastTopicIndex" not in entry:
            entry["lastTopicIndex"] = -1
    save_json(SCHEDULE_FILE, schedule)
    return {"success": True}


# ── Send Nudge Endpoint ──
@router.post("/send-nudge")
async def send_nudge(req: SendNudgeRequest):
    """Send a nudge directly (not through queue)."""
    if not all([req.coacheeName, req.topic, req.nudge, req.channel, req.destination]):
        raise HTTPException(
            status_code=400,
            detail="Missing required fields: coacheeName, topic, nudge, channel, destination"
        )
    
    logger.info(f"Sending nudge via {req.channel} to {req.coacheeName} ({req.destination})")
    logger.info(f"Topic: {req.topic}")
    logger.info(f"Nudge preview: {req.nudge[:100]}...")
    
    try:
        if req.channel == "Email":
            await send_email(
                coachee_name=req.coacheeName,
                topic=req.topic,
                nudge=req.nudge,
                destination=req.destination,
                coach=req.coach
            )
        elif req.channel == "WhatsApp":
            await send_whatsapp(
                coachee_name=req.coacheeName,
                nudge=req.nudge,
                destination=req.destination
            )
        else:
            raise HTTPException(status_code=400, detail=f'Channel "{req.channel}" not supported yet.')
        
        logger.info(f"✅ Sent successfully via {req.channel} to {req.destination}")
        
        # Record in history
        record_nudge(req.coacheeName, req.topic, req.nudge)
        
        return {"success": True, "channel": req.channel, "destination": req.destination}
    
    except Exception as e:
        logger.error(f"❌ Failed to send nudge to {req.destination}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
