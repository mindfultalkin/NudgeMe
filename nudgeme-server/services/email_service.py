import os
import httpx
from typing import Optional


# ── Environment Variables ──
SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")
SENDGRID_FROM_EMAIL = os.getenv("SENDGRID_FROM_EMAIL")


async def send_email(
    coachee_name: str,
    topic: str,
    nudge: str,
    destination: str,
    coach: Optional[str] = None
):
    """
    Send an email with a coaching nudge using SendGrid.
    
    Args:
        coachee_name: Name of the coachee
        topic: The coaching topic
        nudge: The nudge text to send
        destination: Email address to send to
        coach: Name of the coach (optional)
        
    Raises:
        Exception: If SendGrid API key is not configured
    """
    if not SENDGRID_API_KEY:
        raise Exception("SendGrid API key not configured")
    
    async with httpx.AsyncClient() as client:
        await client.post(
            "https://api.sendgrid.com/v3/mail/send",
            json={
                "personalizations": [{"to": [{"email": destination}]}],
                "from": {"email": SENDGRID_FROM_EMAIL},
                "subject": "Your practice nudge for today",
                "content": [
                    {"type": "text/plain", "value": nudge},
                    {"type": "text/html", "value": f"""
                        <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; padding: 2rem; background: #f7f4ef;">
                            <div style="background: #1a1a18; color: #f7f4ef; padding: 1.5rem; border-bottom: 3px solid #c9a84c; margin-bottom: 0;">
                                <div style="font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #c9a84c; margin-bottom: 4px;">NudgeMe</div>
                                <div style="font-size: 12px; color: #888;">Your daily practice nudge</div>
                            </div>
                            <div style="background: #fff; padding: 2rem; border: 1px solid #e0dcd4; border-top: none;">
                                <div style="font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #aaa; margin-bottom: 0.5rem;">{topic}</div>
                                <div style="font-size: 1.15rem; font-style: italic; border-left: 3px solid #c9a84c; padding-left: 1rem; color: #1a1a18; line-height: 1.6;">{nudge}</div>
                            </div>
                            <div style="text-align: center; padding: 1rem; font-size: 11px; color: #bbb;">Sent by {coach or 'your coach'} via NudgeMe</div>
                        </div>
                    """}
                ]
            },
            headers={
                "Authorization": f"Bearer {SENDGRID_API_KEY}",
                "Content-Type": "application/json"
            }
        )

