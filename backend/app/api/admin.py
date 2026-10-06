from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from app.core.config import supabase
from app.core.security import verify_admin_token
import hashlib

router = APIRouter(prefix="/api/admin", tags=["Admin"])

class TeamUpdate(BaseModel):
    name: str
    team_code: str
    score: int
    hints_remaining: int
    current_checkpoint_sequence: int

class CheckpointUpdate(BaseModel):
    title: str
    description: str
    type: str
    puzzle_data: dict
    answer_hash: Optional[str] = None
    hint_text: str
    is_enabled: bool = True
    location_clue: Optional[str] = None
    qr_activation_code: Optional[str] = None

class EvidenceUpdate(BaseModel):
    piece_data: str

class EvidenceCreate(BaseModel):
    checkpoint_sequence: int
    piece_data: str

@router.get("/teams")
def get_all_teams(_=Depends(verify_admin_token)):
    if not supabase:
        return [{"id": "test-id", "team_code": "TEST-123", "name": "DEMO TEAM", "score": 0, "current_checkpoint_sequence": 1}]
    res = supabase.table("teams").select("*").order("score", desc=True).execute()
    return res.data

@router.post("/teams")
def create_team(team: TeamUpdate):
    if not supabase: return {"success": True}
    res = supabase.table("teams").insert(team.dict()).execute()
    return res.data[0] if res.data else None

@router.put("/teams/{team_id}")
def update_team(team_id: str, team: TeamUpdate, _=Depends(verify_admin_token)):
    if not supabase: return {"success": True}
    res = supabase.table("teams").update(team.dict()).eq("id", team_id).execute()
    return res.data[0] if res.data else None

@router.delete("/teams/{team_id}")
def delete_team(team_id: str, _=Depends(verify_admin_token)):
    if not supabase: return {"success": True}
    supabase.table("teams").delete().eq("id", team_id).execute()
    return {"success": True}

@router.get("/checkpoints")
def get_all_checkpoints(_=Depends(verify_admin_token)):
    if not supabase:
        return [
            {
                "sequence": 1,
                "title": "Mission Activation",
                "description": "Your first evidence piece is hidden at LOCATION_1. Find the physical location and enter its exact designated codename below to unlock Round 2.",
                "type": "location",
                "answer_hash": "hash_1",
                "hint_text": "Check the main entrance.",
                "puzzle_data": {},
                "location_clue": "Near the entrance",
                "qr_activation_code": "ACTIVATE-1",
                "is_enabled": True
            },
            {
                "sequence": 2,
                "title": "Code Breaking",
                "description": "Our interceptors caught this transmission. Decrypt it to reveal the next evidence piece.",
                "type": "caesar_cipher",
                "puzzle_data": {
                    "encrypted_text": "KHOOR",
                    "shift": 3
                },
                "answer_hash": "hash_2",
                "hint_text": "It's a Caesar Cipher with a shift of 3.",
                "location_clue": "Cafeteria",
                "qr_activation_code": "ACTIVATE-2",
                "is_enabled": True
            },
            {
                "sequence": 3,
                "title": "Authenticity Protocol",
                "description": "Scan the genuine QR code to proceed. The mathematical pattern from the previous clue points to the correct node.",
                "type": "qr_authenticity",
                "puzzle_data": {
                    "qrs": [
                        {"id": "QR-ALPHA", "is_correct": False, "decoy_message": "DECOY DETECTED: Penalty applied."},
                        {"id": "QR-BETA", "is_correct": True, "decoy_message": ""},
                        {"id": "QR-GAMMA", "is_correct": False, "decoy_message": "DECOY DETECTED: Penalty applied."}
                    ]
                },
                "answer_hash": "hash_3",
                "hint_text": "BETA represents the 2nd letter of the Greek alphabet.",
                "location_clue": "Library",
                "qr_activation_code": "ACTIVATE-3",
                "is_enabled": True
            },
            {
                "sequence": 4,
                "title": "Media Analysis",
                "description": "Analyze the intercepted file. What is the hidden keyword?",
                "type": "media_mystery",
                "puzzle_data": {
                    "media_type": "image",
                    "media_url": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=500&q=80"
                },
                "answer_hash": "hash_4",
                "hint_text": "The image represents a famous 1999 sci-fi movie.",
                "location_clue": "Computer Lab",
                "qr_activation_code": "ACTIVATE-4",
                "is_enabled": True
            },
            {
                "sequence": 5,
                "title": "Logic Gate Breach",
                "description": "Fix the broken logic in this Python script to output exactly '21AIGREEN'.",
                "type": "mini_coding",
                "puzzle_data": {
                    "language": "py",
                    "code": "def generate_key():\n    # MISSING LOGIC\n    return '???'\n\nprint(generate_key())",
                    "explanation": "Return the specific 9 character string."
                },
                "answer_hash": "hash_5",
                "hint_text": "Just return the exact string '21AIGREEN'.",
                "location_clue": "Auditorium",
                "qr_activation_code": "ACTIVATE-5",
                "is_enabled": True
            },
            {
                "sequence": 6,
                "title": "Final Master Code",
                "description": "Use all collected evidence to determine the final master code.",
                "type": "final_boss",
                "answer_hash": "hash_final",
                "hint_text": "Look at the numbers in discovery order.",
                "puzzle_data": {},
                "location_clue": "The Vault",
                "qr_activation_code": "VAULT-ACCESS",
                "is_enabled": True
            }
        ]
    res = supabase.table("checkpoints").select("*").order("sequence").execute()
    return res.data

@router.post("/checkpoints")
def create_checkpoint(cp: CheckpointUpdate, _=Depends(verify_admin_token)):
    if not supabase: return {"success": True}
    
    insert_data = {
        "title": cp.title,
        "description": cp.description,
        "type": cp.type,
        "puzzle_data": cp.puzzle_data,
        "hint_text": cp.hint_text,
        "is_enabled": cp.is_enabled,
        "location_clue": cp.location_clue,
        "qr_activation_code": cp.qr_activation_code,
        "answer_hash": hashlib.sha256(cp.answer_hash.lower().strip().encode()).hexdigest() if cp.answer_hash else "nohash"
    }
    
    # Auto-increment sequence
    res = supabase.table("checkpoints").select("sequence").order("sequence", desc=True).limit(1).execute()
    next_seq = 1
    if res.data:
        next_seq = res.data[0]["sequence"] + 1
    insert_data["sequence"] = next_seq
    
    res = supabase.table("checkpoints").insert(insert_data).execute()
    return res.data[0] if res.data else None

@router.put("/checkpoints/{sequence}")
def update_checkpoint(sequence: int, cp: CheckpointUpdate, _=Depends(verify_admin_token)):
    if not supabase: return {"success": True}
    
    update_data = {
        "title": cp.title,
        "description": cp.description,
        "type": cp.type,
        "puzzle_data": cp.puzzle_data,
        "hint_text": cp.hint_text,
        "is_enabled": cp.is_enabled,
        "location_clue": cp.location_clue,
        "qr_activation_code": cp.qr_activation_code
    }
    
    if cp.answer_hash:
        hashed = hashlib.sha256(cp.answer_hash.lower().strip().encode()).hexdigest()
        update_data["answer_hash"] = hashed
        
    res = supabase.table("checkpoints").update(update_data).eq("sequence", sequence).execute()
    return res.data[0] if res.data else None

@router.delete("/checkpoints/{sequence}")
def delete_checkpoint(sequence: int, _=Depends(verify_admin_token)):
    if not supabase: return {"success": True}
    supabase.table("checkpoints").delete().eq("sequence", sequence).execute()
    return {"success": True}

@router.get("/evidence")
def get_all_evidence(_=Depends(verify_admin_token)):
    if not supabase:
        return [
            {"id": "ev-1", "checkpoint_sequence": 1, "clue_data": "EVIDENCE 1: 7"},
            {"id": "ev-2", "checkpoint_sequence": 2, "clue_data": "EVIDENCE 2: GREEN"}
        ]
    res = supabase.table("evidence").select("*").order("checkpoint_sequence").execute()
    return res.data

@router.put("/evidence/{sequence}")
def update_evidence(sequence: int, ev: EvidenceUpdate, _=Depends(verify_admin_token)):
    if not supabase: return {"success": True}
    res = supabase.table("evidence").update({"piece_data": ev.piece_data}).eq("checkpoint_sequence", sequence).execute()
    return res.data[0] if res.data else None

@router.post("/evidence")
def create_evidence(ev: EvidenceCreate, _=Depends(verify_admin_token)):
    if not supabase: return {"success": True}
    res = supabase.table("evidence").insert(ev.dict()).execute()
    return res.data[0] if res.data else None

@router.delete("/evidence/{sequence}")
def delete_evidence(sequence: int, _=Depends(verify_admin_token)):
    if not supabase: return {"success": True}
    supabase.table("evidence").delete().eq("checkpoint_sequence", sequence).execute()
    return {"success": True}

@router.post("/test/reset/{team_id}")
def reset_team_progress(team_id: str, _=Depends(verify_admin_token)):
    if not supabase: return {"success": True}
    
    # Delete progress and score logs
    supabase.table("team_progress").delete().eq("team_id", team_id).execute()
    supabase.table("score_logs").delete().eq("team_id", team_id).execute()
    
    # Reset team to start
    supabase.table("teams").update({
        "score": 0,
        "hints_used": 0,
        "hints_remaining": 3,
        "current_checkpoint_sequence": 1,
        "end_time": None
    }).eq("id", team_id).execute()
    
    return {"success": True}
