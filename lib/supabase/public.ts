import { createClient } from "@supabase/supabase-js";

import { hasSupabaseConfig, supabasePublicKey, supabaseUrl } from "@/lib/env";

export function createPublicClient() {
  if (!hasSupabaseConfig) {
    return null;
  }

  return createClient(supabaseUrl, supabasePublicKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
