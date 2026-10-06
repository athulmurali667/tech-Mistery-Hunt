import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://placeholder.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "placeholder")
SECRET_KEY = os.getenv("SECRET_KEY", "supersecret-placeholder-key")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "techfest_admin")
ALGORITHM = "HS256"

try:
    if "placeholder" in SUPABASE_URL.lower():
        supabase = None
    else:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
except Exception as e:
    print(f"Warning: Could not initialize Supabase client. {e}")
    supabase = None
