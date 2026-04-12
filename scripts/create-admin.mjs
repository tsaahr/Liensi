import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnvFile(fileName) {
  const filePath = resolve(process.cwd(), fileName);

  if (!existsSync(filePath)) {
    return;
  }

  const content = readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const [rawKey, ...rawValue] = trimmed.split("=");
    const key = rawKey.trim();
    const value = rawValue.join("=").trim().replace(/^["']|["']$/g, "");

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const email = process.argv[2] ?? process.env.ADMIN_EMAIL;
const password = process.argv[3] ?? process.env.ADMIN_PASSWORD;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const adminKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!email || !password) {
  console.error("Informe email e senha: npm.cmd run create-admin -- email@site.com SenhaForte");
  process.exit(1);
}

if (!supabaseUrl || !adminKey) {
  console.error(
    "Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY no .env (ou use SUPABASE_SERVICE_ROLE_KEY legado)."
  );
  console.error("Sem chave de backend, crie o usuario manualmente em Supabase Auth > Users.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, adminKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const { data, error } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true
});

if (error && !/already|registered|exists/i.test(error.message)) {
  console.error(`Falha ao criar admin via service role: ${error.message}`);
  process.exit(1);
}

const { error: whitelistError } = await supabase
  .from("admin_users")
  .upsert({ email, active: true }, { onConflict: "email" });

if (whitelistError) {
  console.warn(
    `Usuario Auth criado, mas nao consegui atualizar public.admin_users: ${whitelistError.message}`
  );
  console.warn("Aplique supabase.sql no Supabase para autorizar este email como admin.");
}

console.log(`Admin pronto via service role: ${data?.user?.email ?? email}`);
