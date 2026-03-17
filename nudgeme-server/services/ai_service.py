import os
import httpx
from typing import List
from .history import get_past_nudges


# ── Environment Variables ──
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")


# ── System Prompt ──
SYSTEM_PROMPT = """You are NudgeMe, a coaching nudge generator. Your job is to generate a single one-line practice nudge for a coachee based on a completed coaching topic.

STRICT RULES:
- Exactly ONE sentence. No more.
- Maximum 20 words.
- Action-oriented or awareness-based.
- Plain language only.
- No emojis, no formatting.
- No coaching theory or frameworks.
- No emotional or therapeutic language.
- No references to sessions, coaching, or past discussions.
- No personality labels or emotional assumptions.
- No multi-clause questions.
- Do not introduce new topics.
- Do not combine multiple skills.

Pattern to follow: notice / do / pause / ask — pick one that fits.

Respond with ONLY the nudge. Nothing else. No quotes, no explanation."""


async def generate_nudge_server(topic: str, coachee_name: str) -> str:
    """
    Generate a coaching nudge using Claude AI.
    
    Args:
        topic: The coaching topic
        coachee_name: Name of the coachee
        
    Returns:
        The generated nudge text
    """
    # Get past nudges to avoid repetition
    past_nudges = get_past_nudges(coachee_name, topic)
    past_nudges_text = [n["nudge"] for n in past_nudges]
    
    # Build avoid section
    avoid_section = ""
    if past_nudges_text:
        avoid_section = f"\n\nALREADY SENT — do NOT repeat or closely paraphrase any of these:\n"
        avoid_section += "\n".join([f"{i+1}. {n}" for i, n in enumerate(past_nudges_text)])
    
    # Call Anthropic API
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.anthropic.com/v1/messages",
            json={
                "model": "claude-sonnet-4-20250514",
                "max_tokens": 100,
                "system": SYSTEM_PROMPT,
                "messages": [
                    {
                        "role": "user",
                        "content": f'Generate a one-line practice nudge for the coaching topic: "{topic}"{avoid_section}'
                    }
                ]
            },
            headers={
                "Content-Type": "application/json",
                "x-api-key": ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01"
            },
            timeout=30.0
        )
        
        data = response.json()
        return data.get("content", [{}])[0].get("text", "").strip()

