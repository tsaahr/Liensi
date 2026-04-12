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
