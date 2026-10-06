# Tech Mystery Hunt — The Missing Code

A technology-based mystery hunt platform built with React, Tailwind CSS, FastAPI, and Supabase.

## Setup Instructions

### 1. Database Setup (Supabase)
1. Create a new Supabase project at [https://supabase.com](https://supabase.com).
2. Go to the SQL Editor in your Supabase dashboard.
3. Copy the contents of `backend/schema.sql` and run it to create the tables.
4. Retrieve your Project URL and Anon Key from Project Settings > API.

### 2. Backend Setup
1. Navigate to the `backend/` directory.
2. Create a virtual environment and install dependencies:
   ```bash
   cd backend
   python -m venv venv
   .\venv\Scripts\activate
   pip install -r requirements.txt # (or pip install fastapi uvicorn supabase python-dotenv pydantic)
   ```
3. Update the `.env` file in the `backend/` directory with your Supabase credentials:
   ```env
   SUPABASE_URL="your-supabase-url"
   SUPABASE_KEY="your-anon-key"
   ```
4. Run the seed script to populate the database with test checkpoints and a test team (`TEST-123`):
   ```bash
   python seed.py
   ```
5. Start the FastAPI server:
   ```bash
   uvicorn main:app --reload
   ```
   The API will run on `http://localhost:8000`.

### 3. Frontend Setup
1. Navigate to the `frontend/` directory.
2. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open the displayed local URL (usually `http://localhost:5173`) in your browser.
5. Log in using the test team code: `TEST-123`.

## Organizer Configuration
You can configure the puzzles, hints, and answers directly in your Supabase database or by modifying the `backend/seed.py` file before seeding. All answers are hashed using SHA-256 for security.
