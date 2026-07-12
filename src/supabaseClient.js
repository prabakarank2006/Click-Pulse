import { createClient } from '@supabase/supabase-js';

// Retrieve public environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase frontend environment variables are missing.");
}

// Initialize the client governed by RLS
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
