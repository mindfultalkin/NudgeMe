import logging
logger = logging.getLogger(__name__)

import random
from datetime import datetime
from .json_store import load_schedule, save_json, SCHEDULE_FILE
from .ai_service import generate_nudge_server
from .email_service import send_email
from .whatsapp_service import send_whatsapp
from .history import record_nudge


# Day name → weekday number (Monday=0)
DAY_MAP = {
    "monday": 0, "tuesday": 1, "wednesday": 2,
    "thursday": 3, "friday": 4, "saturday": 5, "sunday": 6
}


def should_send_now(entry: dict) -> bool:
    """
    Check if this coachee should receive a nudge right now.
    Called every minute by the scheduler.
    """
    now = datetime.now()
    current_hour = now.hour
    current_minute = now.minute
    current_weekday = now.weekday()  # Monday=0, Sunday=6

    # Parse scheduled send time (default 09:00)
    send_time = entry.get("sendTime", "09:00")
    try:
        sched_hour, sched_minute = map(int, send_time.split(":"))
    except Exception:
        sched_hour, sched_minute = 9, 0

    # Check time matches current minute
    if current_hour != sched_hour or current_minute != sched_minute:
        return False

    frequency = entry.get("frequency", "daily")

    if frequency == "daily":
        return True  # Send every day at this time

    if frequency == "weekly":
        send_day = entry.get("sendDay", "monday").lower()
        target_weekday = DAY_MAP.get(send_day, 0)
        return current_weekday == target_weekday

    return False


def pick_next_topic(entry: dict) -> str:
    topics = entry.get("topics", [])
    if not topics:
        return None
    last_index = entry.get("lastTopicIndex", -1)  # ✅ already handles missing
    next_index = (last_index + 1) % len(topics)
    entry["lastTopicIndex"] = next_index
    return topics[next_index]


async def run_scheduled_nudges():
    """
    Called every minute by APScheduler.
    Checks each coachee's schedule and sends nudges when time matches.
    """
    now = datetime.now()
    logger.info(f"Scheduler check: {now.strftime('%Y-%m-%d %H:%M')}")

    if not SCHEDULE_FILE.exists():
        logger.debug("No schedule file found")
        return

    schedules = load_schedule()
    updated = False

    for entry in schedules:
        if not entry.get("active", False):
            continue

        if not should_send_now(entry):
            continue

        topics = entry.get("topics", [])
        if not topics:
            logger.warning(f"No topics for {entry['coacheeName']}, skipping.")
            continue

        # Pick next topic (round-robin)
        topic = pick_next_topic(entry)
        updated = True  # lastTopicIndex changed

        logger.info(f"Sending scheduled nudge to {entry['coacheeName']} → {topic}")

        try:
            # Generate nudge
            nudge = await generate_nudge_server(topic, entry["coacheeName"])
            if not nudge:
                raise Exception("Empty nudge generated")

            # Determine destination
            destination = entry.get("email") if entry.get("channel") == "Email" else entry.get("phone", "")

            # Send
            if entry.get("channel") == "Email":
                await send_email(
                    coachee_name=entry["coacheeName"],
                    topic=topic,
                    nudge=nudge,
                    destination=destination,
                    coach=entry.get("coach")
                )
            elif entry.get("channel") == "WhatsApp":
                await send_whatsapp(
                    coachee_name=entry["coacheeName"],
                    nudge=nudge,
                    destination=destination
                )

            # Record in history
            record_nudge(entry["coacheeName"], topic, nudge)
            logger.info(f"✅ Sent: '{nudge[:60]}...' → {destination}")

        except Exception as err:
            logger.error(f"Failed for {entry['coacheeName']}: {str(err)}")

    # Save updated lastTopicIndex values
    if updated:
        save_json(SCHEDULE_FILE, schedules)

    logger.info("Scheduler check complete.")
