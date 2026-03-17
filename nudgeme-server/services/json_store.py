import json
from pathlib import Path
from typing import Any, Callable


# ── File Paths ──
BASE_DIR = Path(__file__).parent.parent
HISTORY_FILE = BASE_DIR / "nudge-history.json"
QUEUE_FILE = BASE_DIR / "nudge-queue.json"
SCHEDULE_FILE = BASE_DIR / "nudge-schedule.json"


# ── Generic JSON Functions ──
def load_json(file_path: Path, default_factory: Callable[[], Any]):
    """Load JSON from file, or return default if file doesn't exist."""
    if file_path.exists():
        with open(file_path, "r") as f:
            return json.load(f)
    return default_factory()


def save_json(file_path: Path, data: Any):
    """Save data to JSON file."""
    with open(file_path, "w") as f:
        json.dump(data, f, indent=2)


# ── History Functions ──
def load_history() -> dict:
    """Load history from file."""
    return load_json(HISTORY_FILE, dict)


def save_history(history: dict):
    """Save history to file."""
    save_json(HISTORY_FILE, history)


def get_history() -> dict:
    """Get the full history dictionary."""
    return load_history()


# ── Queue Functions ──
def load_queue() -> list:
    """Load queue from file."""
    return load_json(QUEUE_FILE, list)


def save_queue(queue: list):
    """Save queue to file."""
    save_json(QUEUE_FILE, queue)


def get_queue() -> list:
    """Get the full queue list."""
    return load_queue()


# ── Schedule Functions ──
def load_schedule() -> list:
    """Load schedule from file."""
    return load_json(SCHEDULE_FILE, list)


def get_schedule() -> list:
    """Get the full schedule list."""
    return load_schedule()

