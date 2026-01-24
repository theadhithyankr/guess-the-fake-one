import { createClient } from '@supabase/supabase-js';

// Using provided credentials
const supabaseUrl = process.env.SUPABASE_URL || 'https://mfmbyrehcdjxmojmlxuz.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mbWJ5cmVoY2RqeG1vam1seHV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwOTI4OTksImV4cCI6MjA4NDY2ODg5OX0.d6mt4KRCJ7FMvq7PeMu-6qZuAimuTBqDcCkuPvq51UQ';

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase credentials missing. Game will not function correctly.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);