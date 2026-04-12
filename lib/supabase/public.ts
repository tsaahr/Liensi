import { createClient } from "@supabase/supabase-js";

import { hasSupabaseConfig, supabaseAnonKey, supabaseUrl } from "@/lib/env";

export function createPublicClient() {
  if (!hasSupabaseConfig) {
    return null;
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
