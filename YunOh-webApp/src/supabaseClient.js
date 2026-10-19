import { createClient } from "@supabase/supabase-js";

// Read the Project URL and Anon/Publishable Key from your .env.local file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Create and export the Supabase client so any React component can use it
export const supabase = createClient(supabaseUrl, supabasePublishableKey);
