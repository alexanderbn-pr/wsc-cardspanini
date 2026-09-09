import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { getEnv } from "./env.js";

let supabase: SupabaseClient;

/**
 * Initializes and returns the Supabase client singleton.
 * Uses the service role key for backend operations (bypasses RLS).
 */
export function initDatabase(): SupabaseClient {
  if (!supabase) {
    const env = getEnv();
    const key = env.SUPABASE_SERVICE_ROLE_KEY ?? env.SUPABASE_ANON_KEY;
    supabase = createClient(env.SUPABASE_URL, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    console.log("✅ Supabase client initialized");
  }
  return supabase;
}

/**
 * Returns the existing Supabase client.
 * Throws if initDatabase() hasn't been called yet.
 */
export function getDatabase(): SupabaseClient {
  if (!supabase) {
    throw new Error("Database not initialized. Call initDatabase() first.");
  }
  return supabase;
}
