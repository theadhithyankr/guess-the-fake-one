import { createClient } from '@supabase/supabase-js';

// Hardcoded for Vercel deployment stability (avoids 'process is not defined' error in browser)
// In a real production setup with Vite, use import.meta.env.VITE_SUPABASE_URL
const supabaseUrl = 'https://mfmbyrehcdjxmojmlxuz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mbWJ5cmVoY2RqeG1vam1seHV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwOTI4OTksImV4cCI6MjA4NDY2ODg5OX0.d6mt4KRCJ7FMvq7PeMu-6qZuAimuTBqDcCkuPvq51UQ';

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase credentials missing. Game will not function correctly.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);