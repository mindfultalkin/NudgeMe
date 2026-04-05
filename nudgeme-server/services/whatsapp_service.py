import os
import httpx

AISENSY_API_KEY              = os.getenv("AISENSY_API_KEY")
AISENSY_CAMPAIGN_NAME        = os.getenv("AISENSY_CAMPAIGN_NAME")
AISENSY_INTERACTIVE_CAMPAIGN = os.getenv("AISENSY_INTERACTIVE_CAMPAIGN", "")
AISENSY_IMAGE_CAMPAIGN       = os.getenv("AISENSY_IMAGE_CAMPAIGN", "")
NUDGE_IMAGE_URL              = os.getenv("NUDGE_IMAGE_URL", "")
NUDGE_CTA_URL                = os.getenv("NUDGE_CTA_URL", "")


def format_phone(destination: str) -> str:
    digits = "".join(filter(str.isdigit, destination))
    if len(digits) == 12 and digits.startswith("91"):
        return digits
    if len(digits) == 10:
        return "91" + digits
    return "91" + digits[-10:]


def pick_campaign() -> tuple[str, str]:
    """
    Pick best campaign based on what is configured.
    Returns (campaign_name, campaign_type)
    Types: 'image_cta' | 'interactive' | 'standard'
    """
    if AISENSY_IMAGE_CAMPAIGN and NUDGE_IMAGE_URL:
        return AISENSY_IMAGE_CAMPAIGN, "image_cta"
    if AISENSY_INTERACTIVE_CAMPAIGN:
        return AISENSY_INTERACTIVE_CAMPAIGN, "interactive"
    return AISENSY_CAMPAIGN_NAME, "standard"


async def send_whatsapp(coachee_name: str, nudge: str, destination: str):
    """
    Send a WhatsApp nudge via AiSensy.
    Automatically picks the best template based on what is configured:
      - Image + CTA button  → if AISENSY_IMAGE_CAMPAIGN + NUDGE_IMAGE_URL are set
      - Interactive buttons → if AISENSY_INTERACTIVE_CAMPAIGN is set
      - Standard text       → fallback
    """
    if not AISENSY_API_KEY:
        raise Exception("AiSensy API key not configured.")
    if not AISENSY_CAMPAIGN_NAME:
        raise Exception("AiSensy campaign name not configured.")

    phone = format_phone(destination)
    campaign, campaign_type = pick_campaign()

    print(f"   📱 WhatsApp → {phone} via [{campaign_type}] template: {campaign}")

    # Base payload
    payload = {
        "apiKey":       AISENSY_API_KEY,
        "campaignName": campaign,
        "destination":  phone,
        "userName":     coachee_name,
        "templateParams": [
            coachee_name,  # {{1}}
            nudge,         # {{2}}
        ]
    }

    # Image + CTA: add media and buttons
    if campaign_type == "image_cta":
        payload["media"] = {
            "url":      NUDGE_IMAGE_URL,
            "filename": "nudge_banner.jpg"
        }
        if NUDGE_CTA_URL:
            payload["buttons"] = [
                {"type": "url", "url": NUDGE_CTA_URL}
            ]

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

            print(f"   ✅ Sent via AiSensy [{campaign_type}] to {phone}")
            return response_data

    except httpx.TimeoutException:
        raise Exception("AiSensy request timed out.")
    except Exception as e:
        print(f"   ❌ WhatsApp Failed: {str(e)}")
        raise