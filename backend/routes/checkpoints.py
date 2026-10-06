from fastapi import APIRouter, HTTPException
from database import supabase
from models import AnswerSubmission, HintRequest
import hashlib

router = APIRouter(prefix="/checkpoints", tags=["Checkpoints"])

@router.get("/")
def get_checkpoints():
    if not supabase:
        return [{"id": "cp1", "sequence": 1, "title": "First Puzzle (No DB)", "type": "logic"}]
    
    response = supabase.table("checkpoints").select("id, sequence, title, description, type, puzzle_data").order("sequence").execute()
    return response.data

@router.post("/submit")
def submit_answer(submission: AnswerSubmission):
    # Hash the answer and compare to avoid sending plain text answers in API
    answer_hash = hashlib.sha256(submission.answer.lower().strip().encode()).hexdigest()
    
    if not supabase:
        if submission.answer.lower().strip() == "test":
            return {"correct": True, "message": "Test correct"}
        return {"correct": False, "message": "Test incorrect, penalty applied."}
        
    # Check answer
    cp_response = supabase.table("checkpoints").select("answer_hash").eq("id", submission.checkpoint_id).execute()
    if not cp_response.data:
        raise HTTPException(status_code=404, detail="Checkpoint not found")
        
    actual_hash = cp_response.data[0]["answer_hash"]
    if answer_hash == actual_hash:
        # Update team score and progress
        team_resp = supabase.table("teams").select("score").eq("id", submission.team_id).execute()
        new_score = team_resp.data[0]["score"] + 10 # 10 pts for correct answer
        supabase.table("teams").update({"score": new_score}).eq("id", submission.team_id).execute()
        return {"correct": True, "message": "Access Granted."}
    else:
        # Penalty rule: -2 points for wrong answer
        team_resp = supabase.table("teams").select("score").eq("id", submission.team_id).execute()
        new_score = team_resp.data[0]["score"] - 2
        supabase.table("teams").update({"score": new_score}).eq("id", submission.team_id).execute()
        return {"correct": False, "message": "Invalid code. -2 point penalty applied."}

@router.post("/hint")
def request_hint(req: HintRequest):
    if not supabase:
        return {"hint": "This is a placeholder hint."}
        
    # Check if team has hints
    team_resp = supabase.table("teams").select("hints_remaining, score, hints_used").eq("id", req.team_id).execute()
    if not team_resp.data:
        raise HTTPException(status_code=404, detail="Team not found")
        
    hints_rem = team_resp.data[0]["hints_remaining"]
    score = team_resp.data[0]["score"]
    hints_used = team_resp.data[0]["hints_used"]
    
    if hints_rem <= 0:
        raise HTTPException(status_code=400, detail="No hint tokens remaining")
        
    # Apply penalty and decrement tokens
    new_hints = hints_rem - 1
    new_score = score - 5
    new_hints_used = hints_used + 1
    supabase.table("teams").update({"hints_remaining": new_hints, "score": new_score, "hints_used": new_hints_used}).eq("id", req.team_id).execute()
    
    # Get hint
    cp_resp = supabase.table("checkpoints").select("hint_text").eq("id", req.checkpoint_id).execute()
    return {"hint": cp_resp.data[0]["hint_text"], "hints_remaining": new_hints}
