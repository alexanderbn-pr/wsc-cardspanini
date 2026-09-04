/*import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getEnv } from '../';

let supabase: SupabaseClient;

export function initDatabase(): SupabaseClient {
  if (!supabase) {
    const env = getEnv();
    supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    console.log('✅ Supabase client initialized');
  }
  return supabase;
}

export function getDatabase(): SupabaseClient {
  if (!supabase) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return supabase;
}*/
