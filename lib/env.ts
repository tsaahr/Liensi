export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";

function normalizeSiteUrl(value: string) {
  const trimmed = value.trim().replace(/\/+$/, "");

  if (!trimmed) {
    return "http://localhost:3000";
  }

  if (/^https?:\/\//.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith("localhost")) {
    return `http://${trimmed}`;
  }

  return `https://${trimmed}`;
}

export const siteUrl = normalizeSiteUrl(
  process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
);

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

export function assertSupabaseConfig() {
  if (!hasSupabaseConfig) {
    throw new Error(
      "Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY antes de usar o Supabase."
    );
  }
}
