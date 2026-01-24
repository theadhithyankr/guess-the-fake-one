-- Create the Games table
CREATE TABLE public.games (
    room_code TEXT PRIMARY KEY,
    phase TEXT NOT NULL,
    secret_word TEXT,
    impostor_word TEXT,
    turn_index INTEGER DEFAULT 0,
    settings JSONB,
    winner TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the Players table
CREATE TABLE public.players (
    id UUID PRIMARY KEY,
    room_code TEXT NOT NULL REFERENCES public.games(room_code) ON DELETE CASCADE,
    name TEXT NOT NULL,
    is_host BOOLEAN DEFAULT FALSE,
    is_impostor BOOLEAN DEFAULT FALSE,
    description TEXT DEFAULT '',
    voted_for_id TEXT, -- stored as string/uuid
    score INTEGER DEFAULT 0,
    is_ready BOOLEAN DEFAULT FALSE
);

-- Enable Row Level Security (Optional: Open for public access for this demo)
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

-- Allow public access (For development simplicity. Secure this for production!)
CREATE POLICY "Allow public access to games" ON public.games FOR ALL USING (true);
CREATE POLICY "Allow public access to players" ON public.players FOR ALL USING (true);

-- Enable Realtime for these tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.games;
ALTER PUBLICATION supabase_realtime ADD TABLE public.players;