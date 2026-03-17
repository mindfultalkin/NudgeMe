from pydantic import BaseModel
from typing import Optional


class QueueNudgeRequest(BaseModel):
    coacheeName: str
    coach: str
    topic: str
    channel: str
    email: str
    phone: str


class SendNudgeRequest(BaseModel):
    coacheeName: str
    topic: str
    nudge: str
    channel: str
    destination: str
    coach: Optional[str] = None


class EditNudgeRequest(BaseModel):
    nudge: str


class ScheduleUpdate(BaseModel):
    schedule: list

