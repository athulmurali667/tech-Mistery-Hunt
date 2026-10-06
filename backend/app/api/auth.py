from fastapi import APIRouter, HTTPException
from app.core.config import supabase
from app.core.security import create_access_token
from app.schemas.schemas import TeamLogin

router = APIRouter(prefix="/api/auth", tags=["Auth"])

@router.post("/login")
def login(team: TeamLogin):
    if not supabase:
        token = create_access_token({"sub": "test-team-id"})
        return {"access_token": token, "team": {"id": "test-team-id", "name": "Test Team", "score": 0, "current_checkpoint_sequence": 1}}
        
    response = supabase.table("teams").select("*").eq("team_code", team.team_code).execute()
    if not response.data:
        raise HTTPException(status_code=401, detail="Invalid team code")
    
    team_data = response.data[0]
    token = create_access_token({"sub": team_data["id"]})
    
    return {
        "access_token": token,
        "team": {
            "id": team_data["id"],
            "name": team_data["name"],
            "score": team_data["score"],
            "current_checkpoint_sequence": team_data["current_checkpoint_sequence"],
            "hints_remaining": team_data["hints_remaining"]
        }
    }
