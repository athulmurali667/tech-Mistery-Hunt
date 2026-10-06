from pydantic import BaseModel
from typing import Optional, Dict, Any

class TeamLogin(BaseModel):
    team_code: str

class AnswerSubmission(BaseModel):
    team_id: str
    checkpoint_id: str
    answer: str

class HintRequest(BaseModel):
    team_id: str
    checkpoint_id: str
