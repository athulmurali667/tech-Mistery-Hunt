-- Create team_members table
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    contact_info VARCHAR(100),
    department VARCHAR(100),
    is_captain BOOLEAN DEFAULT FALSE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add fields to teams table
ALTER TABLE teams ADD COLUMN IF NOT EXISTS join_code VARCHAR(10) UNIQUE;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE;

-- Global settings table
CREATE TABLE IF NOT EXISTS event_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_status VARCHAR(20) DEFAULT 'DRAFT', -- DRAFT, LIVE, PAUSED, COMPLETED
    registration_open BOOLEAN DEFAULT TRUE
);

-- Insert default row if none exists
INSERT INTO event_settings (event_status, registration_open)
SELECT 'DRAFT', TRUE
WHERE NOT EXISTS (SELECT 1 FROM event_settings);

-- Disable RLS on new tables so our backend can access them
ALTER TABLE team_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE event_settings DISABLE ROW LEVEL SECURITY;

-- Reload Supabase Schema Cache
NOTIFY pgrst, 'reload schema';
