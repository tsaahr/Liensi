function decodeJwtPayload(token) {
  const parts = token.split(".");

  if (parts.length !== 3 || !parts[1]) {
    return null;
  }

  try {
    const normalized = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

function getSupabasePublicKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ""
  );
}

function hasUnsafeSupabasePublicKey() {
  const key = getSupabasePublicKey().trim();

  if (!key) {
    return false;
  }

  if (key.startsWith("sb_secret_")) {
    return true;
  }

  return decodeJwtPayload(key)?.role === "service_role";
}

if (hasUnsafeSupabasePublicKey()) {
  throw new Error(
    "Configuracao insegura: use NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (ou a anon key legada) no frontend. Nunca use sb_secret/service_role em NEXT_PUBLIC_*."
  );
}

function getSupabaseImagePattern() {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);

    return {
      protocol: url.protocol.replace(":", ""),
      hostname: url.hostname,
      port: url.port,
      pathname: "/storage/v1/object/public/produtos/**"
    };
  } catch {
    return null;
  }
}

const supabaseImagePattern = getSupabaseImagePattern();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: supabaseImagePattern ? [supabaseImagePattern] : []
  }
};

export default nextConfig;
