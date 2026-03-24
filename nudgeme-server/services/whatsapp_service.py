import os
import httpx

# ── Environment Variables ──
AISENSY_API_KEY = os.getenv("AISENSY_API_KEY")
AISENSY_CAMPAIGN_NAME = os.getenv("AISENSY_CAMPAIGN_NAME")
AISENSY_INTERACTIVE_CAMPAIGN = os.getenv("AISENSY_INTERACTIVE_CAMPAIGN", "")


def format_phone(destination: str) -> str:
    """Format phone number to AiSensy format: 91XXXXXXXXXX"""
    digits = "".join(filter(str.isdigit, destination))
    if len(digits) == 12 and digits.startswith("91"):
        return digits
    if len(digits) == 10:
        return "91" + digits
    return "91" + digits[-10:]


async def send_whatsapp(coachee_name: str, nudge: str, destination: str):
    """
    Send a WhatsApp nudge via AiSensy.
    Uses interactive template (with buttons) if AISENSY_INTERACTIVE_CAMPAIGN is set,
    otherwise uses standard template.
    """
    if not AISENSY_API_KEY:
        raise Exception("AiSensy API key not configured. Set AISENSY_API_KEY in .env")
    if not AISENSY_CAMPAIGN_NAME:
        raise Exception("AiSensy campaign name not configured. Set AISENSY_CAMPAIGN_NAME in .env")

    phone = format_phone(destination)

    # Use interactive campaign if configured, else standard
    campaign = AISENSY_INTERACTIVE_CAMPAIGN if AISENSY_INTERACTIVE_CAMPAIGN else AISENSY_CAMPAIGN_NAME
    is_interactive = bool(AISENSY_INTERACTIVE_CAMPAIGN)

    print(f"   📱 WhatsApp (AiSensy): Sending to {phone} via {'interactive' if is_interactive else 'standard'} template")

    payload = {
        "apiKey": AISENSY_API_KEY,
        "campaignName": campaign,
        "destination": phone,
        "userName": coachee_name,
        "templateParams": [
            coachee_name,   # {{1}} — coachee name
            nudge           # {{2}} — nudge text
        ]
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://backend.aisensy.com/campaign/t1/api/v2",
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=30.0
            )

            response_data = response.json() if response.text else {}

            if response.status_code >= 400:
                error_msg = response_data.get("message", response.text or "Unknown error")
                print(f"   ❌ AiSensy Error [{response.status_code}]: {error_msg}")
                raise Exception(f"AiSensy error: {error_msg}")

            print(f"   ✅ WhatsApp sent via AiSensy to {phone}")
            return response_data

    except httpx.TimeoutException:
        print(f"   ❌ AiSensy request timed out")
        raise Exception("AiSensy request timed out. Please try again.")

    except Exception as e:
        print(f"   ❌ WhatsApp Failed: {str(e)}")
        raise