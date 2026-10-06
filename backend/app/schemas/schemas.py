from pydantic import BaseModel
from typing import Optional

class TeamLogin(BaseModel):
    team_code: str

class AnswerSubmission(BaseModel):
    answer: str

class HintRequest(BaseModel):
    checkpoint_sequence: int

class VolunteerVerification(BaseModel):
    team_id: str
    checkpoint_sequence: int
    verification_code: str
