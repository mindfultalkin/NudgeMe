from datetime import datetime
from typing import List, Dict, Any
from .json_store import load_history, save_history


def get_past_nudges(coachee_name: str, topic: str) -> List[Dict[str, Any]]:
    """
    Get all past nudges sent to a coachee for a specific topic.
    
    Args:
        coachee_name: Name of the coachee
        topic: Coaching topic
        
    Returns:
        List of past nudge entries
    """
    history = load_history()
    key = f"{coachee_name}::{topic}"
    return history.get(key, [])


def record_nudge(coachee_name: str, topic: str, nudge: str):
    """
    Record a nudge that was sent to a coachee.
    
    Args:
        coachee_name: Name of the coachee
        topic: Coaching topic
        nudge: The nudge text that was sent
    """
    history = load_history()
    key = f"{coachee_name}::{topic}"
    
    if key not in history:
        history[key] = []
    
    history[key].append({
        "nudge": nudge,
        "sentAt": datetime.now().isoformat()
    })
    
    save_history(history)

