import os
import hashlib
from database import supabase

def seed_db():
    if not supabase:
        print("Supabase client not initialized. Cannot seed database.")
        return

    print("Clearing existing data...")
    try:
        supabase.table("evidence").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
        supabase.table("team_progress").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
        supabase.table("teams").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
        supabase.table("checkpoints").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
    except Exception as e:
        print(f"Error clearing data: {e}")

    print("Inserting checkpoints...")
    checkpoints = [
        {
            "sequence": 1,
            "title": "Mission Activation",
            "description": "Your first evidence piece is hidden at LOCATION_1. Find the physical location and enter its exact designated codename below to unlock Round 2.",
            "type": "location",
            "answer_hash": hashlib.sha256("location_1".encode()).hexdigest(), # location_1
            "hint_text": "Check the main entrance of the venue."
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
            "answer_hash": hashlib.sha256("hello".encode()).hexdigest(),
            "hint_text": "It's a Caesar Cipher with a shift of 3. 'K' shifts back 3 spaces to 'H'."
        },
        {
            "sequence": 3,
            "title": "Authenticity Protocol",
            "description": "Scan the genuine QR code to proceed. The mathematical pattern from the previous clue points to the correct node.",
            "type": "qr_authenticity",
            "puzzle_data": {
                "qrs": [
                    {"id": "QR-ALPHA", "is_correct": False, "decoy_message": "DECOY DETECTED: This node is a honeypot. Penalty applied."},
                    {"id": "QR-BETA", "is_correct": True, "decoy_message": ""},
                    {"id": "QR-GAMMA", "is_correct": False, "decoy_message": "DECOY DETECTED: Invalid signature sequence. Penalty applied."}
                ]
            },
            "answer_hash": hashlib.sha256("qr-beta".encode()).hexdigest(),
            "hint_text": "BETA represents the 2nd letter of the Greek alphabet. You need the second option."
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
            "answer_hash": hashlib.sha256("matrix".encode()).hexdigest(),
            "hint_text": "The image represents a famous 1999 sci-fi movie. What is it?"
        },
        {
            "sequence": 5,
            "title": "Logic Gate Breach",
            "description": "What is the exact printed output of this Python script?",
            "type": "mini_coding",
            "puzzle_data": {
                "code": "x = 5\ny = 3\nprint(x * y + 2)",
                "language": "python",
                "explanation": "Multiplies x (5) and y (3) to get 15, then adds 2."
            },
            "answer_hash": hashlib.sha256("17".encode()).hexdigest(),
            "hint_text": "Remember the order of operations (PEMDAS/BODMAS)."
        },
        {
            "sequence": 6,
            "title": "Hardware Reassembly",
            "description": "Proceed to the Engineering Bay (Room 101). A volunteer will provide you with disassembled hardware. Reassemble it within 5 minutes. The volunteer will authorize your clearance upon successful completion.",
            "type": "physical",
            "puzzle_data": {},
            "answer_hash": hashlib.sha256("admin123".encode()).hexdigest(),
            "hint_text": "Work together! Sort the pieces by color first."
        },
        {
            "sequence": 7,
            "title": "Crack The Missing Code",
            "description": "Use the numerical evidence in discovery order.",
            "type": "final_boss",
            "puzzle_data": {},
            "answer_hash": hashlib.sha256("739".encode()).hexdigest(),
            "hint_text": "Combine the numbers from your evidence list."
        }
    ]

    evidence_data = [
        {"checkpoint_sequence": 1, "piece_data": "7"},
        {"checkpoint_sequence": 2, "piece_data": "AI"},
        {"checkpoint_sequence": 3, "piece_data": "24"},
        {"checkpoint_sequence": 4, "piece_data": "GREEN"},
        {"checkpoint_sequence": 5, "piece_data": "3"},
        {"checkpoint_sequence": 6, "piece_data": "9"}
    ]

    for cp in checkpoints:
        try:
            supabase.table("checkpoints").insert(cp).execute()
        except Exception as e:
            print(f"Error inserting checkpoint {cp['sequence']}: {e}")

    for ev in evidence_data:
        try:
            supabase.table("evidence").insert(ev).execute()
        except Exception as e:
            print(f"Error inserting evidence {ev['checkpoint_sequence']}: {e}")

    print("Inserting test team...")
    try:
        supabase.table("teams").insert({
            "team_code": "TEST-123",
            "name": "Admin Testers",
            "score": 0,
            "hints_remaining": 3
        }).execute()
    except Exception as e:
        print(f"Error inserting team: {e}")

    print("Seeding complete.")

if __name__ == "__main__":
    seed_db()
