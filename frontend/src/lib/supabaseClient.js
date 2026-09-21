/* Creates the single Supabase client (used for login/auth) from VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in the .env file. */
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
