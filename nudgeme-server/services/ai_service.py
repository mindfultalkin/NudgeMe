import os
import httpx
from .history import get_past_nudges


ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")


# ── Default System Prompt (all other topics) ──
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
- Early nudges use obvious cues (a Driver who says "bottom line it"), later ones are ambiguous
- Reflection Question 1: Ask what the coachee observed or experienced
- Reflection Question 2: Ask which social style they think this represents
- Total length: 60 to 90 words
- No emojis, no formatting symbols, no bullet points in the output
- Do not name the social style in the scenario — only in the question

Respond with ONLY the nudge scenario and two questions. No labels, no explanation.""",

}


# ── User Prompt Templates ──
DEFAULT_USER_PROMPT = 'Generate a one-line practice nudge for the coaching topic: "{topic}"'

TOPIC_USER_PROMPTS = {
    "Know your Communication Style": 'Generate a workplace communication style nudge for the topic: "{topic}". Use the ADEA model. Vary perspective and channel from previous nudges.',
}


# ── Max tokens per topic ──
TOPIC_MAX_TOKENS = {
    "Know your Communication Style": 300,
}
DEFAULT_MAX_TOKENS = 100


def get_system_prompt(topic: str) -> str:
    """Return the appropriate system prompt for the topic."""
    return TOPIC_SYSTEM_PROMPTS.get(topic, DEFAULT_SYSTEM_PROMPT)


def get_user_prompt(topic: str) -> str:
    """Return the appropriate user prompt template for the topic."""
    template = TOPIC_USER_PROMPTS.get(topic, DEFAULT_USER_PROMPT)
    return template.format(topic=topic)


def get_max_tokens(topic: str) -> int:
    """Return the appropriate max tokens for the topic."""
    return TOPIC_MAX_TOKENS.get(topic, DEFAULT_MAX_TOKENS)


async def generate_nudge_server(topic: str, coachee_name: str) -> str:
    """
    Generate a coaching nudge using Claude AI.
    Uses topic-specific prompts and rules where defined.

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
        avoid_section = "\n\nALREADY SENT — do NOT repeat or closely paraphrase any of these:\n"
        avoid_section += "\n".join([f"{i+1}. {n}" for i, n in enumerate(past_nudges_text)])

    # Build difficulty hint based on how many nudges already sent
    difficulty_section = ""
    nudge_count = len(past_nudges_text)
    if topic in TOPIC_SYSTEM_PROMPTS:
        if nudge_count == 0:
            difficulty_section = "\n\nDIFFICULTY: Easy — use a very obvious behavioural cue (e.g. a Driver who says 'bottom line it for me')."
        elif nudge_count <= 2:
            difficulty_section = "\n\nDIFFICULTY: Medium — use a moderately clear cue that requires some observation."
        else:
            difficulty_section = "\n\nDIFFICULTY: Hard — use an ambiguous cue (e.g. someone who seems Analytical but is actually Amiable under stress)."

    # Get topic-specific settings
    system_prompt = get_system_prompt(topic)
    user_prompt   = get_user_prompt(topic)
    max_tokens    = get_max_tokens(topic)

    full_user_message = user_prompt + avoid_section + difficulty_section

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.anthropic.com/v1/messages",
            json={
                "model": "claude-sonnet-4-20250514",
                "max_tokens": max_tokens,
                "system": system_prompt,
                "messages": [
                    {
                        "role": "user",
                        "content": full_user_message
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