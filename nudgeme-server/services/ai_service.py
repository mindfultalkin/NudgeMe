import os
import json
import httpx
from pathlib import Path
from .history import get_past_nudges

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
GUARDRAILS_FILE   = Path(__file__).parent.parent / "nudge-guardrails.json"

# ── Default System Prompt ──
DEFAULT_SYSTEM_PROMPT = """You are NudgeMe, a coaching nudge generator. Your job is to generate a short workplace scenario for a coachee based on a completed coaching topic, ending with a prompt that makes them think through how they would respond.

Generate a nudge in this exact format:
- 2 to 3 sentences describing a realistic workplace micro-moment relevant to the topic, with a named fictional person and their role
- The scenario must put the coachee in a position where a response is needed — framing an answer, asking a question, or making a statement
- Then ONE closing line that prompts the coachee to work out their own response to the moment

STRICT RULES:
- Include a named fictional person with a specific role (e.g. "Priya, a senior product manager")
- The scenario must be directly relevant to the coaching topic given
- Vary the perspective each time: Observer, Actor, or Recipient
- Vary the channel each time: verbal, written, async, or meeting
- Frame the scenario neutrally — no negative judgment, no implying anyone did something wrong
- Vary the closing prompt's form each time — sometimes ask what they'd say, sometimes ask what question they'd ask, sometimes ask what statement they'd make
- Plain language only
- No emojis, no formatting symbols
- No coaching theory or frameworks
- No emotional or therapeutic language
- No references to sessions, coaching, or past discussions
- No personality labels or emotional assumptions
- Do not introduce topics unrelated to the one given
- Total length: 60 to 100 words

Respond with ONLY the nudge scenario and the closing prompt. No labels, no explanation."""

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
"Impromptu Speaking": """You are NudgeMe, a coaching nudge generator for workplace communication using the PREP framework (Point, Reason,Example/Elaborate/Explain, Point).

Generate a workplace nudge in this exact format:
- 1 sentence describing a realistic micro-moment with a named fictional person and their role
- The scenario must surface exactly ONE clear moment where structuring a response with PREP (Point, Reason, Example, Point) would help
- Then a reflection question and a practice prompt, on separate lines

STRICT RULES:
- Include a named fictional person with a specific role (e.g. "Arjun, a tech lead" or "Priya, a project manager")
- The role must be a mid-level manager, project lead, tech lead, or supervisor archetype
- Show exactly ONE behavioural cue only — a moment of explaining, justifying, updating, escalating, or giving feedback without clear structure
- Vary the perspective each time: Observer, Actor, or Recipient
- Vary the channel each time: verbal, written, async, or meeting
- Target exactly ONE PREP element per nudge as the one that's missing or weak: Point, Reason, or Example
- Frame the moment neutrally — no negative judgment, no implying the person did something wrong
- Reflection Question: Ask what the coachee observed or experienced in the moment
- Practice Prompt: Invite the reader to draft their own Point, Reason, Example, Point answer for this exact situation, as if they were the person in the scenario — phrase it as a direct instruction to practise (e.g. "Now write your own Point, Reason, Example for this moment.")
- Total length: 80 t 120 words
- No emojis, no formatting symbols

Respond with ONLY the nudge scenario, the reflection question, and the practice prompt. No labels, no explanation.""",

}

TOPIC_MAX_TOKENS = {
    "Know your Communication Style": 300,
}
DEFAULT_MAX_TOKENS = 300


def load_guardrails() -> dict:
    """Load coach-defined guardrails from file."""
    if GUARDRAILS_FILE.exists():
        try:
            with open(GUARDRAILS_FILE) as f:
                return json.load(f)
        except Exception:
            pass
    return {}


def build_system_prompt(topic: str, coachee_profile: str = "") -> str:
    """
    Build the system prompt for a topic.
    Priority: topic-specific built-in > default built-in
    Then appends any coach-defined guardrails from the dashboard,
    then instructions for using the coachee's profile, if provided.
    """
    # 1. Start with built-in prompt
    base = TOPIC_SYSTEM_PROMPTS.get(topic, DEFAULT_SYSTEM_PROMPT)

    # 2. Load coach-defined guardrails
    guardrails = load_guardrails()

    # 3. Get topic-specific override, fall back to default
    custom = guardrails.get(topic) or guardrails.get("_default", "")

    if custom.strip():
        base += f"\n\nADDITIONAL RULES FROM COACH:\n{custom.strip()}"

    # 4. If a coachee profile is available, instruct the model to tailor to it
    if coachee_profile.strip():
        base += (
            "\n\nCOACHEE PROFILE:\n"
            f"{coachee_profile.strip()}\n\n"
            "Use this profile to make the scenario, role, and questions feel specific to this "
            "coachee — their seniority, function, industry, or day-to-day context. Where relevant, "
            "you may include one brief insight or observation tailored to them. Do not quote or "
            "restate the profile text verbatim, and do not reference that a profile was provided."
        )

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


async def generate_nudge_server(topic: str, coachee_name: str, coachee_profile: str = "") -> str:
    """Generate a coaching nudge using Claude AI."""
    past_nudges      = get_past_nudges(coachee_name, topic)
    past_nudges_text = [n["nudge"] for n in past_nudges]

    avoid_section = ""
    if past_nudges_text:
        avoid_section = "\n\nALREADY SENT — do NOT repeat or closely paraphrase:\n"
        avoid_section += "\n".join([f"{i+1}. {n}" for i, n in enumerate(past_nudges_text)])

    system_prompt  = build_system_prompt(topic, coachee_profile)
    difficulty     = build_difficulty_hint(topic, len(past_nudges_text))
    max_tokens     = TOPIC_MAX_TOKENS.get(topic, DEFAULT_MAX_TOKENS)
    user_message   = f'Generate a coaching nudge for the topic: "{topic}"{avoid_section}{difficulty}'

    if not ANTHROPIC_API_KEY:
        raise RuntimeError("ANTHROPIC_API_KEY is not set")

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.anthropic.com/v1/messages",
            json={
                "model":      "claude-sonnet-5",
                "max_tokens": max_tokens,
                "system":     system_prompt,
                "thinking":   {"type": "disabled"},
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
        if response.status_code != 200 or "content" not in data:
            error = data.get("error", {})
            raise RuntimeError(
                f"Anthropic API error ({response.status_code}): "
                f"{error.get('type', 'unknown')} - {error.get('message', data)}"
            )
        text_block = next((b for b in data["content"] if b.get("type") == "text"), None)
        if text_block is None:
            raise RuntimeError(f"No text block in Anthropic response: {data}")
        return text_block.get("text", "").strip()