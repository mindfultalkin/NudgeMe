import os
import httpx

# ── Environment Variables ──
AISENSY_API_KEY = os.getenv("AISENSY_API_KEY")
AISENSY_CAMPAIGN_NAME = os.getenv("AISENSY_CAMPAIGN_NAME")

def format_phone(destination: str) -> str:
    """
    Format phone number to AiSensy format: 91XXXXXXXXXX (no + or spaces)
    
    Args:
        destination: Raw phone number in any format
        
    Returns:
        Formatted phone number string
    """
    # Strip everything except digits
    digits = "".join(filter(str.isdigit, destination))
    
    # If already has country code 91 and is 12 digits → use as is
    if len(digits) == 12 and digits.startswith("91"):
        return digits
    
    # If 10 digits → add 91 prefix
    if len(digits) == 10:
        return "91" + digits
    
    # If longer (e.g. someone passed +91XXXXXXXXXX = 12 digits) → trim to last 10 and add 91
    return "91" + digits[-10:]


async def send_whatsapp(
    coachee_name: str,
    nudge: str,
    destination: str
):
    """
    Send a WhatsApp message with a coaching nudge using AiSensy.
    
    Args:
        coachee_name: Name of the coachee (used as {{1}} in template)
        nudge: The nudge text to send (used as {{2}} in template)
        destination: Phone number to send to (any format)
        
    Raises:
        Exception: If AiSensy credentials are not configured or send fails
    """
    if not AISENSY_API_KEY:
        raise Exception("AiSensy API key not configured. Set AISENSY_API_KEY in .env")
    
    if not AISENSY_CAMPAIGN_NAME:
        raise Exception("AiSensy campaign name not configured. Set AISENSY_CAMPAIGN_NAME in .env")
    
    # Format phone number
    phone = format_phone(destination)
    
    print(f"   📱 WhatsApp (AiSensy): Sending to {phone}")
    
    payload = {
        "apiKey": AISENSY_API_KEY,
        "campaignName": AISENSY_CAMPAIGN_NAME,
        "destination": phone,
        "userName": coachee_name,
        "templateParams": [
            coachee_name,   # {{1}} in template
            nudge           # {{2}} in template
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