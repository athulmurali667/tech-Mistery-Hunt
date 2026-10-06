from fastapi import APIRouter, HTTPException, Depends
from app.core.config import supabase
from app.core.security import verify_token
from app.schemas.schemas import AnswerSubmission, HintRequest, VolunteerVerification
import hashlib
from datetime import datetime, timezone
from pydantic import BaseModel

router = APIRouter(prefix="/api/game", tags=["Game"])

@router.get("/state")
def get_game_state(team_id: str = Depends(verify_token)):
    if not supabase:
        return {"score": 0, "hints_remaining": 3, "current_checkpoint_sequence": 1, "evidence": []}
    
    team_resp = supabase.table("teams").select("*").eq("id", team_id).execute()
    if not team_resp.data:
        raise HTTPException(status_code=404, detail="Team not found")
    
    team = team_resp.data[0]
    
    # Get unlocked evidence
    evidence_resp = supabase.table("evidence").select("*").lt("checkpoint_sequence", team["current_checkpoint_sequence"]).execute()
    
    return {
        "score": team["score"],
        "hints_remaining": team["hints_remaining"],
        "current_checkpoint_sequence": team["current_checkpoint_sequence"],
        "evidence": evidence_resp.data
    }

@router.get("/checkpoints")
def get_checkpoints(team_id: str = Depends(verify_token)):
    if not supabase:
        return [{"id": "cp1", "sequence": 1, "title": "Test Puzzle", "type": "logic"}]
    
    response = supabase.table("checkpoints").select("sequence, title, description, type").order("sequence").execute()
    return response.data

@router.get("/checkpoints/{sequence}")
def get_checkpoint(sequence: int, team_id: str = Depends(verify_token)):
    if not supabase:
        if sequence == 1:
            return {
                "sequence": 1, 
                "title": "Mission Activation", 
                "description": "Your first evidence piece is hidden at LOCATION_1. Find the physical location and enter its exact designated codename below to unlock Round 2.", 
                "type": "location"
            }
        if sequence == 2:
            return {
                "sequence": 2,
                "title": "Code Breaking",
                "description": "Our interceptors caught this transmission. Decrypt it to reveal the next evidence piece.",
                "type": "caesar_cipher",
                "puzzle_data": {
                    "encrypted_text": "KHOOR",
                    "shift": 3
                }
            }
        if sequence == 3:
            return {
                "sequence": 3,
                "title": "Authenticity Protocol",
                "description": "Scan the genuine QR code to proceed. The mathematical pattern from the previous clue points to the correct node.",
                "type": "qr_authenticity",
                "puzzle_data": {
                    "qrs": [
                        {"id": "QR-ALPHA", "is_correct": False, "decoy_message": "DECOY DETECTED: This node is a honeypot."},
                        {"id": "QR-BETA", "is_correct": True, "decoy_message": ""},
                        {"id": "QR-GAMMA", "is_correct": False, "decoy_message": "DECOY DETECTED: Invalid signature sequence."}
                    ]
                }
            }
        if sequence == 4:
            return {
                "sequence": 4,
                "title": "Media Analysis",
                "description": "Analyze the intercepted file. What is the hidden keyword?",
                "type": "media_mystery",
                "puzzle_data": {
                    "media_type": "image",
                    "media_url": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=500&q=80"
                }
            }
        if sequence == 5:
            return {
                "sequence": 5,
                "title": "Logic Gate Breach",
                "description": "What is the exact printed output of this Python script?",
                "type": "mini_coding",
                "puzzle_data": {
                    "code": "x = 5\ny = 3\nprint(x * y + 2)",
                    "language": "python"
                }
            }

        if sequence == 6:
            return {
                "sequence": 6,
                "title": "Hardware Reassembly",
                "description": "Proceed to the Engineering Bay (Room 101). A volunteer will provide you with disassembled hardware. Reassemble it within 5 minutes. The volunteer will authorize your clearance upon successful completion.",
                "type": "physical",
                "puzzle_data": {}
            }

        if sequence == 7:
            return {
                "sequence": 7,
                "title": "Crack The Missing Code",
                "description": "Use the numerical evidence in discovery order.",
                "type": "final_boss",
                "puzzle_data": {}
            }
        return {"sequence": sequence, "title": "Test Puzzle", "description": "Solve me"}
        
    team_resp = supabase.table("teams").select("current_checkpoint_sequence, checkpoint_status").eq("id", team_id).execute()
    if not team_resp.data or sequence > team_resp.data[0]["current_checkpoint_sequence"]:
        raise HTTPException(status_code=403, detail="Checkpoint locked")
        
    team_status = team_resp.data[0].get("checkpoint_status", "active")
        
    response = supabase.table("checkpoints").select("sequence, title, description, type, puzzle_data, hint_text, location_clue, is_enabled").eq("sequence", sequence).execute()
    if not response.data:
         raise HTTPException(status_code=404, detail="Checkpoint not found")
         
    cp_data = response.data[0]
    
    if cp_data.get("is_enabled") is False:
        raise HTTPException(status_code=403, detail="This checkpoint is currently disabled by the organizer.")
    
    # Check if hint was already used
    prog = supabase.table("team_progress").select("hint_used").eq("team_id", team_id).eq("checkpoint_sequence", sequence).execute()
    
    res = {
        "sequence": cp_data["sequence"],
        "title": cp_data["title"] if team_status == 'active' else "TRANSIT TO NEXT NODE",
        "description": cp_data["description"] if team_status == 'active' else (cp_data.get("location_clue") or "Find the next QR code to activate this checkpoint."),
        "type": cp_data["type"] if team_status == 'active' else "transit",
        "puzzle_data": cp_data["puzzle_data"] if team_status == 'active' else {},
        "status": team_status
    }
    
    if prog.data and prog.data[0].get("hint_used"):
        res["hint_text"] = cp_data["hint_text"]
        
    return res

@router.post("/checkpoints/{sequence}/submit")
def submit_answer(sequence: int, submission: AnswerSubmission, team_id: str = Depends(verify_token)):
    answer_hash = hashlib.sha256(submission.answer.lower().strip().encode()).hexdigest()
    
    if not supabase:
        ans = submission.answer.lower().strip()
        if ans in ["test", "location_1", "hello", "qr-beta", "matrix", "17", "21aigreen", "739"]:
            return {"correct": True, "message": "Test successful"}
        
        # Mock decoy logic
        if ans == "qr-alpha":
            return {"correct": False, "message": "DECOY DETECTED: This node is a honeypot."}
        if ans == "qr-gamma":
            return {"correct": False, "message": "DECOY DETECTED: Invalid signature sequence."}
            
        return {"correct": False, "message": "Test incorrect. -2 point penalty applied."}

    team_resp = supabase.table("teams").select("*").eq("id", team_id).execute()
    if not team_resp.data:
        raise HTTPException(status_code=404, detail="Team not found")
        
    team = team_resp.data[0]
    if sequence > team["current_checkpoint_sequence"]:
        raise HTTPException(status_code=403, detail="Checkpoint locked")
    if sequence < team["current_checkpoint_sequence"]:
        return {"correct": True, "message": "Already solved"}
        
    cp_resp = supabase.table("checkpoints").select("answer_hash").eq("sequence", sequence).execute()
    if not cp_resp.data:
        raise HTTPException(status_code=404, detail="Checkpoint not found")
        
    if cp_resp.data[0]["answer_hash"] == answer_hash:
        points = 30 if sequence == 7 else 10
        action = "Final code cracked" if sequence == 7 else f"Checkpoint {sequence} solved"
        new_score = team["score"] + points
        new_seq = team["current_checkpoint_sequence"] + 1
        
        updates = {
            "score": new_score, 
            "current_checkpoint_sequence": new_seq,
            "checkpoint_status": "transit" if new_seq < 7 else "active"
        }
        if sequence >= 7:
            updates["end_time"] = datetime.utcnow().isoformat()
            updates["checkpoint_status"] = "active"
            
        supabase.table("teams").update(updates).eq("id", team_id).execute()
        _log_attempt(supabase, team_id, sequence, is_correct=True)
        _log_score(supabase, team_id, action, points)
        
        return {"correct": True, "message": "Access Granted."}
    else:
        new_score = team["score"] - 2
        supabase.table("teams").update({"score": new_score}).eq("id", team_id).execute()
        _log_attempt(supabase, team_id, sequence, is_correct=False)
        _log_score(supabase, team_id, "Wrong answer", -2)
        
        decoy_msg = "Invalid code. -2 point penalty applied."
        if cp_resp.data[0].get("type") == "qr_authenticity":
            puzzle_data = cp_resp.data[0].get("puzzle_data") or {}
            for qr in puzzle_data.get("qrs", []):
                if qr.get("id", "").lower() == submission.answer.lower().strip() and not qr.get("is_correct"):
                    decoy_msg = qr.get("decoy_message", decoy_msg)
                    break
        
        return {"correct": False, "message": decoy_msg}

class ActivationSubmission(BaseModel):
    qr_code: str

@router.post("/checkpoints/{sequence}/activate")
def activate_checkpoint(sequence: int, submission: ActivationSubmission, team_id: str = Depends(verify_token)):
    if not supabase:
        return {"activated": True}
        
    team_resp = supabase.table("teams").select("current_checkpoint_sequence, checkpoint_status").eq("id", team_id).execute()
    if not team_resp.data:
        raise HTTPException(status_code=404, detail="Team not found")
        
    team = team_resp.data[0]
    if sequence != team["current_checkpoint_sequence"]:
        return {"activated": False, "message": "Sequence mismatch."}
        
    if team.get("checkpoint_status") == "active":
        return {"activated": True, "message": "Already active."}
        
    cp_resp = supabase.table("checkpoints").select("qr_activation_code").eq("sequence", sequence).execute()
    if not cp_resp.data:
        raise HTTPException(status_code=404, detail="Checkpoint not found")
        
    # Standardize empty QR strings as None in db or empty string
    expected_qr = cp_resp.data[0].get("qr_activation_code")
    
    if not expected_qr or submission.qr_code.lower().strip() == expected_qr.lower().strip():
        supabase.table("teams").update({"checkpoint_status": "active"}).eq("id", team_id).execute()
        return {"activated": True, "message": "Node Activated."}
        
    return {"activated": False, "message": "Invalid Location QR."}

def _log_score(supabase, team_id, action, points):
    try:
        supabase.table("score_logs").insert({
            "team_id": team_id,
            "action": action,
            "points": points
        }).execute()
    except Exception as e:
        print(f"Failed to log score: {e}")

def _log_attempt(supabase, team_id, sequence, is_correct):
    try:
        resp = supabase.table("team_progress").select("*").eq("team_id", team_id).eq("checkpoint_sequence", sequence).execute()
        if resp.data:
            attempts = resp.data[0].get("attempts", 0) + 1
            updates = {"attempts": attempts}
            if is_correct:
                updates["solved_at"] = datetime.utcnow().isoformat()
            supabase.table("team_progress").update(updates).eq("id", resp.data[0]["id"]).execute()
        else:
            inserts = {
                "team_id": team_id,
                "checkpoint_sequence": sequence,
                "attempts": 1
            }
            if is_correct:
                inserts["solved_at"] = datetime.utcnow().isoformat()
            supabase.table("team_progress").insert(inserts).execute()
    except Exception as e:
        print(f"Failed to log attempt: {e}")

@router.post("/hints/request")
def request_hint(req: HintRequest, team_id: str = Depends(verify_token)):
    if not supabase:
        return {"hint": "Test hint"}
        
    prog_resp = supabase.table("team_progress").select("id, hint_used").eq("team_id", team_id).eq("checkpoint_sequence", req.checkpoint_sequence).execute()
    prog_id = prog_resp.data[0]["id"] if prog_resp.data else None
    
    cp_resp = supabase.table("checkpoints").select("hint_text").eq("sequence", req.checkpoint_sequence).execute()
    if not cp_resp.data:
        raise HTTPException(status_code=404, detail="Hint not found")
        
    if prog_resp.data and prog_resp.data[0].get("hint_used"):
        return {"hint": cp_resp.data[0]["hint_text"], "already_used": True}
        
    team_resp = supabase.table("teams").select("hints_remaining, score, hints_used").eq("id", team_id).execute()
    if not team_resp.data:
        raise HTTPException(status_code=404, detail="Team not found")
        
    team = team_resp.data[0]
    if team["hints_remaining"] <= 0:
        raise HTTPException(status_code=400, detail="No hints remaining")
        
    supabase.table("teams").update({
        "hints_remaining": team["hints_remaining"] - 1,
        "hints_used": team["hints_used"] + 1,
        "score": team["score"] - 5
    }).eq("id", team_id).execute()
    
    _log_score(supabase, team_id, f"Hint used for Checkpoint {req.checkpoint_sequence}", -5)
    
    if prog_id:
        supabase.table("team_progress").update({"hint_used": True}).eq("id", prog_id).execute()
    else:
        supabase.table("team_progress").insert({
            "team_id": team_id,
            "checkpoint_sequence": req.checkpoint_sequence,
            "hint_used": True
        }).execute()
        
    return {
        "hint": cp_resp.data[0]["hint_text"],
        "hints_remaining": team["hints_remaining"] - 1,
        "score": team["score"] - 5,
        "already_used": False
    }

@router.get("/evidence")
def get_evidence(team_id: str = Depends(verify_token)):
    if not supabase:
        return [
            {"sequence": 1, "piece_data": "7", "unlocked_at": "2026-10-06T12:00:00Z"},
            {"sequence": 2, "piece_data": "AI", "unlocked_at": "2026-10-06T12:05:00Z"},
            {"sequence": 3, "piece_data": "24", "unlocked_at": "2026-10-06T12:10:00Z"},
            {"sequence": 4, "piece_data": "GREEN", "unlocked_at": "2026-10-06T12:15:00Z"},
            {"sequence": 5, "piece_data": "3", "unlocked_at": "2026-10-06T12:20:00Z"},
            {"sequence": 6, "piece_data": "9", "unlocked_at": "2026-10-06T12:25:00Z"}
        ]
        
    prog_resp = supabase.table("team_progress").select("checkpoint_sequence, solved_at").eq("team_id", team_id).not_("solved_at", "is", "null").execute()
    if not prog_resp.data:
        return []
        
    seqs = [p["checkpoint_sequence"] for p in prog_resp.data]
    
    ev_resp = supabase.table("evidence").select("checkpoint_sequence, piece_data").in_("checkpoint_sequence", seqs).execute()
    
    result = []
    if ev_resp.data:
        for ev in ev_resp.data:
            prog = next((p for p in prog_resp.data if p["checkpoint_sequence"] == ev["checkpoint_sequence"]), None)
            result.append({
                "sequence": ev["checkpoint_sequence"],
                "piece_data": ev["piece_data"],
                "unlocked_at": prog["solved_at"] if prog else None
            })
            
    return sorted(result, key=lambda x: x["sequence"])

@router.get("/volunteer/teams")
def get_teams_needing_verification():
    if not supabase:
        return [{"id": "mock_team_id", "name": "Test Team (Mock)", "current_checkpoint_sequence": 6}]
    
    cp_resp = supabase.table("checkpoints").select("sequence").eq("type", "physical").execute()
    physical_seqs = [cp["sequence"] for cp in cp_resp.data] if cp_resp.data else []
    
    if not physical_seqs:
        return []
        
    teams_resp = supabase.table("teams").select("id, name, current_checkpoint_sequence").in_("current_checkpoint_sequence", physical_seqs).execute()
    return teams_resp.data if teams_resp.data else []

@router.post("/volunteer/verify")
def volunteer_verify(data: VolunteerVerification):
    if not supabase:
        if data.verification_code.lower().strip() == "admin123":
            return {"correct": True, "message": "Team verified and advanced."}
        return {"correct": False, "message": "Invalid volunteer code"}

    cp_resp = supabase.table("checkpoints").select("answer_hash").eq("sequence", data.checkpoint_sequence).execute()
    if not cp_resp.data:
        raise HTTPException(status_code=404, detail="Checkpoint not found")
        
    vh = hashlib.sha256(data.verification_code.lower().strip().encode()).hexdigest()
    if vh == cp_resp.data[0]["answer_hash"]:
        team_resp = supabase.table("teams").select("score").eq("id", data.team_id).execute()
        if not team_resp.data:
            raise HTTPException(404, "Team not found")
            
        new_score = team_resp.data[0]["score"] + 10
        new_seq = data.checkpoint_sequence + 1
        
        updates = {"score": new_score, "current_checkpoint_sequence": new_seq}
        if data.checkpoint_sequence >= 6:
            updates["end_time"] = datetime.utcnow().isoformat()
            
        supabase.table("teams").update(updates).eq("id", data.team_id).execute()
        
        _log_attempt(supabase, data.team_id, data.checkpoint_sequence, is_correct=True)
        _log_score(supabase, data.team_id, f"Physical Challenge {data.checkpoint_sequence} completed", 10)
        return {"correct": True, "message": "Team verified and advanced."}
    else:
        return {"correct": False, "message": "Invalid verification code."}

@router.get("/leaderboard")
def get_leaderboard():
    if not supabase:
         return []
    
    resp = supabase.table("teams").select("id, name, score, current_checkpoint_sequence, start_time, end_time").execute()
    
    now = datetime.utcnow()
    
    def calculate_status(team):
        if team.get("end_time"):
            return "COMPLETED"
        if team.get("start_time"):
            try:
                start_dt = datetime.fromisoformat(team["start_time"].replace("Z", "+00:00"))
                # If naive, make aware for comparison
                if start_dt.tzinfo is None:
                    start_dt = start_dt.replace(tzinfo=timezone.utc)
                now_dt = now.replace(tzinfo=timezone.utc)
                if (now_dt - start_dt).total_seconds() > 3600:
                    return "FAILED"
            except Exception:
                pass
        return "IN PROGRESS"

    def sort_key(team):
        score = -team["score"]
        time_val = team["end_time"] if team["end_time"] else "9999-12-31T23:59:59"
        return (score, time_val)
        
    ranked = sorted(resp.data, key=sort_key)
    
    result = []
    for rank, team in enumerate(ranked, 1):
        result.append({
            "rank": rank,
            "team_id": team["id"],
            "name": team["name"],
            "score": team["score"],
            "end_time": team.get("end_time"),
            "status": calculate_status(team)
        })
        
    return result
