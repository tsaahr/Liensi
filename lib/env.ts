export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
const supabaseLegacyAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const supabasePublicKey = supabasePublishableKey || supabaseLegacyAnonKey;
export const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";

type JwtPayload = {
  role?: string;
};

function decodeJwtPayload(token: string): JwtPayload | null {
  const [, payload] = token.split(".");

  if (!payload) {
    return null;
  }

  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    return JSON.parse(atob(padded)) as JwtPayload;
  } catch {
    return null;
  }
}

function isSupabaseSecretKey(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return false;
  }

  if (trimmed.startsWith("sb_secret_")) {
    return true;
  }

  return decodeJwtPayload(trimmed)?.role === "service_role";
}

export const hasUnsafeSupabasePublicKey = isSupabaseSecretKey(supabasePublicKey);

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

export const hasSupabaseConfig = Boolean(
  supabaseUrl && supabasePublicKey && !hasUnsafeSupabasePublicKey
);

export function assertSupabaseConfig() {
  if (hasUnsafeSupabasePublicKey) {
    throw new Error(
      "Use NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (ou a anon key legada) no frontend. Nunca exponha sb_secret/service_role em NEXT_PUBLIC_*."
    );
  }

  if (!hasSupabaseConfig) {
    throw new Error(
      "Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (ou NEXT_PUBLIC_SUPABASE_ANON_KEY legado) antes de usar o Supabase."
    );
  }
}
