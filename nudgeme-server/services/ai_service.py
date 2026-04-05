import os
import json
import httpx
from pathlib import Path
from .history import get_past_nudges

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
GUARDRAILS_FILE   = Path(__file__).parent.parent / "nudge-guardrails.json"

# ── Default System Prompt ──
DEFAULT_SYSTEM_PROMPT = """You are NudgeMe, a coaching nudge generator. Your job is to generate a single one-line practice nudge for a coachee based on a completed coaching topic.

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

# ── Topic-Specific System Prompts ──
TOPIC_SYSTEM_PROMPTS = {
    "Know your Communication Style": """You are NudgeMe, a coaching nudge generator for workplace communication using the ADEA social styles model (Analytical, Driver, Expressive, Amiable).

Generate a workplace nudge in this exact format:
- 2 to 3 sentences describing a realistic micro-moment with a named fictional person and their role
- The scenario must surface exactly ONE clear behavioural cue
- Then 2 reflection questions on separate lines

STRICT RULES:
- Include a named fictional person with a specific role (e.g. "Priya, a senior product manager")
- Show exactly ONE behavioural cue only — not multiple traits
- Vary the perspective each time: Observer, Actor, or Recipient
- Vary the channel each time: verbal, written, async, or meeting
- Target one ADEA style per nudge: Analytical, Driver, Expressive, or Amiable
- Frame the style neutrally — no negative judgment
- Reflection Question 1: Ask what the coachee observed or experienced
- Reflection Question 2: Ask which social style they think this represents
- Total length: 60 to 90 words
- No emojis, no formatting symbols

Respond with ONLY the nudge scenario and two questions. No labels, no explanation.""",
}

TOPIC_MAX_TOKENS = {
    "Know your Communication Style": 300,
}
DEFAULT_MAX_TOKENS = 100


def load_guardrails() -> dict:
    """Load coach-defined guardrails from file."""
    if GUARDRAILS_FILE.exists():
        try:
            with open(GUARDRAILS_FILE) as f:
                return json.load(f)
        except Exception:
            pass
    return {}


def build_system_prompt(topic: str) -> str:
    """
    Build the system prompt for a topic.
    Priority: topic-specific built-in > default built-in
    Then appends any coach-defined guardrails from the dashboard.
    """
    # 1. Start with built-in prompt
    base = TOPIC_SYSTEM_PROMPTS.get(topic, DEFAULT_SYSTEM_PROMPT)

    # 2. Load coach-defined guardrails
    guardrails = load_guardrails()

    # 3. Get topic-specific override, fall back to default
    custom = guardrails.get(topic) or guardrails.get("_default", "")

    if custom.strip():
        base += f"\n\nADDITIONAL RULES FROM COACH:\n{custom.strip()}"

    return base


def build_difficulty_hint(topic: str, nudge_count: int) -> str:
    """Add difficulty hint for topics that support it."""
    if topic not in TOPIC_SYSTEM_PROMPTS:
        return ""
    if nudge_count == 0:
        return "\n\nDIFFICULTY: Easy — use a very obvious behavioural cue."
    elif nudge_count <= 2:
        return "\n\nDIFFICULTY: Medium — use a moderately clear cue."
    else:
        return "\n\nDIFFICULTY: Hard — use an ambiguous cue that requires careful observation."


async def generate_nudge_server(topic: str, coachee_name: str) -> str:
    """Generate a coaching nudge using Claude AI."""
    past_nudges      = get_past_nudges(coachee_name, topic)
    past_nudges_text = [n["nudge"] for n in past_nudges]

    avoid_section = ""
    if past_nudges_text:
        avoid_section = "\n\nALREADY SENT — do NOT repeat or closely paraphrase:\n"
        avoid_section += "\n".join([f"{i+1}. {n}" for i, n in enumerate(past_nudges_text)])

    system_prompt  = build_system_prompt(topic)
    difficulty     = build_difficulty_hint(topic, len(past_nudges_text))
    max_tokens     = TOPIC_MAX_TOKENS.get(topic, DEFAULT_MAX_TOKENS)
    user_message   = f'Generate a coaching nudge for the topic: "{topic}"{avoid_section}{difficulty}'

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.anthropic.com/v1/messages",
            json={
                "model":      "claude-sonnet-4-20250514",
                "max_tokens": max_tokens,
                "system":     system_prompt,
                "messages":   [{"role": "user", "content": user_message}]
            },
            headers={
                "Content-Type":    "application/json",
                "x-api-key":       ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01"
            },
            timeout=30.0
        )
        data = response.json()
        return data.get("content", [{}])[0].get("text", "").strip()