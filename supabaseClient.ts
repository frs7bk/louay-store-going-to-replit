import { createClient } from '@supabase/supabase-js';
import { Database } from './types';

// Hardcoded values to resolve environment variable loading issues.
const supabaseUrl = "https://thoijvtgprxpcjytsjhq.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRob2lqdnRncHJ4cGNqeXRzamhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2OTU4MDQsImV4cCI6MjA2OTI3MTgwNH0.KwUplxtRgQ38neulouQddlvxvdjLQOXTkwj46JnIdGQ";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL or Anon Key is missing. Check your .env file.");
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);