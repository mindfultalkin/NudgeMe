from datetime import datetime
from typing import Dict, Any
from .json_store import load_queue, save_queue


def queue_nudge(entry: Dict[str, Any]):
    """
    Add a nudge to the queue for approval.
    
    Args:
        entry: Dictionary containing nudge details
    """
    queue = load_queue()
    
    entry["id"] = str(datetime.now().timestamp())
    entry["status"] = "pending"
    entry["queuedAt"] = datetime.now().isoformat()
    
    queue.append(entry)
    save_queue(queue)

