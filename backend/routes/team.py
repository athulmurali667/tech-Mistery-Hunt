from fastapi import APIRouter, HTTPException
from database import supabase
from models import TeamLogin

router = APIRouter(prefix="/team", tags=["Team"])

@router.post("/login")
def login(team: TeamLogin):
    if not supabase:
        return {"id": "test-team-id", "name": "Test Team (No DB)", "score": 0, "hints_remaining": 3, "current_checkpoint_id": "cp1"}
        
    response = supabase.table("teams").select("*").eq("team_code", team.team_code).execute()
    if not response.data:
        raise HTTPException(status_code=401, detail="Invalid team code")
    return response.data[0]

@router.get("/{team_id}")
def get_team_status(team_id: str):
    if not supabase:
        return {"id": team_id, "name": "Test Team (No DB)", "score": 0, "hints_remaining": 3}
        
    response = supabase.table("teams").select("*").eq("id", team_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Team not found")
    return response.data[0]
