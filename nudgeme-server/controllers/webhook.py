import os
import httpx
from fastapi import APIRouter, Request
from services.json_store import load_history, load_schedule
from services.whatsapp_service import send_whatsapp

router = APIRouter()

# ── Follow-up prompts per button ──
REPLY_PROMPTS = {
    "done": "The coachee completed the practice. Acknowledge warmly and briefly reinforce what they did. One sentence, max 20 words, no emojis.",
    "not yet": "The coachee hasn't done the practice yet. Encourage gently and suggest a simpler way to try it today. One sentence, max 20 words, no emojis.",
    "tell me more": "The coachee wants more explanation. Give one concrete real-world example of how to apply this practice today. One sentence, max 20 words, no emojis.",
}


async def generate_followup(reply: str, nudge: str, topic: str, coachee_name: str) -> str:
    """Generate a follow-up response using Claude based on coachee's button reply."""
    reply_lower = reply.lower().strip()
    instruction = REPLY_PROMPTS.get(reply_lower, REPLY_PROMPTS["tell me more"])

    user_message = f"""Coachee: {coachee_name}
Topic: {topic}
Original nudge: "{nudge}"
Coachee replied: "{reply}"

{instruction}"""

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.anthropic.com/v1/messages",
            json={
                "model": "claude-sonnet-4-20250514",
                "max_tokens": 100,
                "system": "You are NudgeMe. Respond to coachee replies with one short supportive sentence. Max 20 words. No emojis. No frameworks.",
                "messages": [{"role": "user", "content": user_message}]
            },
            headers={
                "Content-Type": "application/json",
                "x-api-key": os.getenv("ANTHROPIC_API_KEY"),
                "anthropic-version": "2023-06-01"
            },
            timeout=30.0
        )
        data = response.json()
        return data.get("content", [{}])[0].get("text", "").strip()


def find_coachee_by_phone(phone: str, schedule: list) -> dict:
    """Find coachee schedule entry by phone number."""
    digits = "".join(filter(str.isdigit, phone))
    last10 = digits[-10:] if len(digits) >= 10 else digits
    for entry in schedule:
        entry_digits = "".join(filter(str.isdigit, str(entry.get("phone", ""))))
        entry_last10 = entry_digits[-10:] if len(entry_digits) >= 10 else entry_digits
        if entry_last10 == last10:
            return entry
    return None


def get_last_nudge_for_coachee(coachee_name: str) -> dict:
    """Get the most recently sent nudge for a coachee across all topics."""
    history = load_history()
    latest_entry = None
    latest_time = ""
    for key, entries in history.items():
        if key.startswith(f"{coachee_name}::") and entries:
            last = entries[-1]
            if last.get("sentAt", "") > latest_time:
                latest_time = last.get("sentAt", "")
                topic = key.split("::", 1)[1]
                latest_entry = {"topic": topic, "nudge": last.get("nudge", "")}
    return latest_entry or {"topic": "", "nudge": ""}


@router.post("/webhook/aisensy")
async def aisensy_webhook(request: Request):
    """
    Receives WhatsApp button replies from AiSensy.
    Identifies coachee by phone, generates Claude AI follow-up,
    and sends it back via WhatsApp.
    """
    try:
        body = await request.json()
        print(f"\n📩 Webhook received: {body}")

        # ── Extract phone and button reply from AiSensy payload ──
        wa_id = body.get("waId") or body.get("from") or ""
        message_body = ""

        if "text" in body:
            message_body = body["text"].get("body", "")
        elif "button" in body:
            message_body = body["button"].get("text", "")
        elif "interactive" in body:
            interactive = body["interactive"]
            if "button_reply" in interactive:
                message_body = interactive["button_reply"].get("title", "")

        if not wa_id or not message_body:
            print("   ⚠ Missing waId or message body, skipping.")
            return {"status": "ignored"}

        print(f"   📱 From: {wa_id} | Reply: '{message_body}'")

        # ── Find coachee by phone number ──
        schedule = load_schedule()
        coachee_entry = find_coachee_by_phone(wa_id, schedule)

        if not coachee_entry:
            print(f"   ⚠ No coachee found for phone: {wa_id}")
            return {"status": "coachee_not_found"}

        coachee_name = coachee_entry["coacheeName"]
        print(f"   👤 Coachee identified: {coachee_name}")

        # ── Get last nudge sent to this coachee ──
        last = get_last_nudge_for_coachee(coachee_name)
        topic = last.get("topic", "")
        nudge = last.get("nudge", "")

        if not nudge:
            print(f"   ⚠ No nudge history found for {coachee_name}")
            return {"status": "no_history"}

        print(f"   📝 Topic: {topic} | Nudge: '{nudge[:60]}...'")

        # ── Generate follow-up using Claude ──
        followup = await generate_followup(
            reply=message_body,
            nudge=nudge,
            topic=topic,
            coachee_name=coachee_name
        )
        print(f"   🤖 Follow-up: '{followup}'")

        # ── Send follow-up back via WhatsApp ──
        await send_whatsapp(
            coachee_name=coachee_name,
            nudge=followup,
            destination=coachee_entry.get("phone", "")
        )
        print(f"   ✅ Follow-up sent to {coachee_name}")

        return {"status": "ok", "followup": followup}

    except Exception as e:
        print(f"   ❌ Webhook error: {str(e)}")
        return {"status": "error", "detail": str(e)}