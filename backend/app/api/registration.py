from fastapi import APIRouter, HTTPException, Depends
from app.core.config import supabase
from app.core.security import create_access_token, verify_token_payload
from app.schemas.schemas import TeamCreate, TeamJoin
import uuid
import random
import string

router = APIRouter(prefix="/api/registration", tags=["Registration"])

def generate_join_code():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

@router.post("/create")
def create_team(team: TeamCreate):
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    # Check if event is open for registration
    setting_res = supabase.table("event_settings").select("registration_open").execute()
    if setting_res.data and not setting_res.data[0]["registration_open"]:
        raise HTTPException(status_code=403, detail="Registration is closed.")
    
    join_code = generate_join_code()
    team_code = f"TMH-{random.randint(100, 999)}"
    
    # Insert team
    new_team = {
        "team_code": team_code,
        "name": team.team_name,
        "join_code": join_code,
        "is_locked": False,
        "score": 0,
        "hints_remaining": 3,
        "current_checkpoint_sequence": 1
    }
    
    team_res = supabase.table("teams").insert(new_team).execute()
    if not team_res.data:
        raise HTTPException(status_code=500, detail="Failed to create team")
        
    team_id = team_res.data[0]["id"]
    
    # Insert Captain
    captain = {
        "team_id": team_id,
        "name": team.captain_name,
        "contact_info": team.contact,
        "department": team.department,
        "is_captain": True
    }
    cap_res = supabase.table("team_members").insert(captain).execute()
    
    # Create session token for the captain
    # Use sub=team_id to retain backward compatibility with game APIs, but add member_id to track who is who
    member_id = cap_res.data[0]["id"]
    token = create_access_token({
        "sub": team_id, 
        "member_id": member_id,
        "is_captain": True
    })
    
    return {
        "access_token": token,
        "team_id": team_id,
        "team_code": team_code,
        "join_code": join_code,
        "message": "Team created successfully"
    }

@router.post("/join")
def join_team(join_req: TeamJoin):
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not connected")
        
    # Check if registration is open
    setting_res = supabase.table("event_settings").select("registration_open").execute()
    if setting_res.data and not setting_res.data[0]["registration_open"]:
        raise HTTPException(status_code=403, detail="Registration is closed.")

    # Find team by join code
    res = supabase.table("teams").select("*").eq("join_code", join_req.join_code.upper()).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Invalid Join Code")
        
    team_data = res.data[0]
    team_id = team_data["id"]
    
    if team_data.get("is_locked", False):
        raise HTTPException(status_code=403, detail="Team is locked. You cannot join.")
        
    # Check max members
    members_res = supabase.table("team_members").select("id").eq("team_id", team_id).execute()
    if len(members_res.data) >= 4:
        raise HTTPException(status_code=403, detail="Team is already full (max 4 members).")
        
    # Insert member
    member = {
        "team_id": team_id,
        "name": join_req.member_name,
        "contact_info": join_req.contact,
        "department": join_req.department,
        "is_captain": False
    }
    mem_res = supabase.table("team_members").insert(member).execute()
    member_id = mem_res.data[0]["id"]
    
    token = create_access_token({
        "sub": team_id, 
        "member_id": member_id,
        "is_captain": False
    })
    
    return {
        "access_token": token,
        "team_id": team_id,
        "team_name": team_data["name"],
        "message": "Joined team successfully"
    }

@router.get("/lobby")
def get_lobby_status(payload: dict = Depends(verify_token_payload)):
    if not supabase:
        return {"error": "Mock DB"}
        
    team_id = payload.get("sub")
    member_id = payload.get("member_id")
    is_captain = payload.get("is_captain", False)
    
    team_res = supabase.table("teams").select("*").eq("id", team_id).execute()
    if not team_res.data:
        raise HTTPException(status_code=404, detail="Team not found")
        
    team_data = team_res.data[0]
    
    members_res = supabase.table("team_members").select("*").eq("team_id", team_id).execute()
    members = members_res.data
    
    settings_res = supabase.table("event_settings").select("event_status").execute()
    event_status = settings_res.data[0]["event_status"] if settings_res.data else "DRAFT"
    
    return {
        "team_id": team_id,
        "team_name": team_data["name"],
        "team_code": team_data["team_code"],
        "join_code": team_data["join_code"] if is_captain else None,
        "is_locked": team_data.get("is_locked", False),
        "is_captain": is_captain,
        "member_count": len(members),
        "members": [{"name": m["name"], "is_captain": m["is_captain"]} for m in members],
        "event_status": event_status,
        "can_start": event_status == "LIVE" and len(members) >= 2
    }

@router.post("/start")
def start_mission(payload: dict = Depends(verify_token_payload)):
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not connected")
        
    team_id = payload.get("sub")
    is_captain = payload.get("is_captain", False)
    
    if not is_captain:
        raise HTTPException(status_code=403, detail="Only the captain can start the mission.")
        
    settings_res = supabase.table("event_settings").select("event_status").execute()
    event_status = settings_res.data[0]["event_status"] if settings_res.data else "DRAFT"
    
    if event_status != "LIVE":
        raise HTTPException(status_code=403, detail="The event is not LIVE yet.")
        
    members_res = supabase.table("team_members").select("id").eq("team_id", team_id).execute()
    if len(members_res.data) < 2:
        raise HTTPException(status_code=403, detail="Minimum 2 members required to start.")
        
    # Lock the team so no one else can join
    supabase.table("teams").update({"is_locked": True}).eq("id", team_id).execute()
    
    return {"success": True, "message": "Mission started! Team locked."}
