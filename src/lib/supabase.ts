import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Business client for authenticated business users
export const businessSupabase = createClient(supabaseUrl, supabaseAnonKey);

// Client client for end users (customers)
export const clientSupabase = createClient(supabaseUrl, supabaseAnonKey);