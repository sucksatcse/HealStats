import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isPlaceholder = (val: string) =>
  !val ||
  val === 'your-anon-key' ||
  val.includes('your-project-id') ||
  val.trim() === '';

export const supabaseConfigured =
  !isPlaceholder(supabaseUrl) && !isPlaceholder(supabaseAnonKey);

// If credentials are missing/placeholder, export a dummy client that won't crash
// the app but will fail gracefully on actual API calls.
export const supabase: SupabaseClient = supabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (createClient(
      'https://placeholder.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiJ9.placeholder',
    ) as SupabaseClient);

if (!supabaseConfigured) {
  console.warn(
    '[HealStats] Supabase credentials are not configured. ' +
      'Update VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in frontend/.env ' +
      'with your real Supabase project credentials.',
  );
}
