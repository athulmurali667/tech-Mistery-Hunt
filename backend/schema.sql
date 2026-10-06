-- Placeholder SQL schema for Supabase
-- Can be executed in the Supabase SQL Editor by the organizer.

-- Teams Table
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    score INTEGER DEFAULT 0,
    hints_used INTEGER DEFAULT 0,
    hints_remaining INTEGER DEFAULT 3,
    current_checkpoint_sequence INTEGER DEFAULT 1,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    checkpoint_status VARCHAR(20) DEFAULT 'transit' -- 'transit' or 'active'
);

-- Checkpoints Table
CREATE TABLE checkpoints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sequence INTEGER UNIQUE NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- e.g., 'python_code', 'logic_puzzle', 'crypto'
    puzzle_data JSONB, -- Placeholder for puzzle specific configs
    answer_hash VARCHAR(255) NOT NULL, -- Hashed answer for verification
    hint_text TEXT NOT NULL,
    location_clue TEXT,
    qr_activation_code VARCHAR(255),
    is_enabled BOOLEAN DEFAULT TRUE
);

-- Evidence Table
CREATE TABLE evidence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    checkpoint_sequence INTEGER REFERENCES checkpoints(sequence) ON DELETE CASCADE,
    piece_data TEXT NOT NULL -- The actual evidence piece given when checkpoint is solved
);

-- Progress Log (Optional, for tracking time per puzzle)
CREATE TABLE team_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    checkpoint_sequence INTEGER REFERENCES checkpoints(sequence) ON DELETE CASCADE,
    solved_at TIMESTAMP WITH TIME ZONE,
    attempts INTEGER DEFAULT 1,
    hint_used BOOLEAN DEFAULT FALSE,
    UNIQUE(team_id, checkpoint_sequence)
);

-- Score History Log
CREATE TABLE score_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    points INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
