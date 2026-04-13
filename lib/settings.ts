import { unstable_cache } from "next/cache";

import { whatsappNumber } from "@/lib/env";
import { createPublicClient } from "@/lib/supabase/public";
import { digitsOnly } from "@/lib/utils";

export const WHATSAPP_SETTING_KEY = "whatsapp_number";

export type PublicSiteSettings = {
  whatsappNumber: string;
  whatsappNumberSource: "database" | "env";
};

export function normalizeWhatsAppNumber(value: string | null | undefined) {
  return digitsOnly(value ?? "");
}

export function getFallbackWhatsAppNumber() {
  return normalizeWhatsAppNumber(whatsappNumber);
}

function isMissingSettingsTable(message: string) {
  return message.includes("site_settings") || message.includes("Could not find the table");
}

async function fetchPublicSiteSettings(): Promise<PublicSiteSettings> {
  const fallbackNumber = getFallbackWhatsAppNumber();
  const supabase = createPublicClient();

  if (!supabase) {
    return {
      whatsappNumber: fallbackNumber,
      whatsappNumberSource: "env"
    };
  }

  const { data, error } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", WHATSAPP_SETTING_KEY)
    .maybeSingle();

  if (error) {
    if (isMissingSettingsTable(error.message)) {
      return {
        whatsappNumber: fallbackNumber,
        whatsappNumberSource: "env"
      };
    }

    throw new Error(error.message);
  }

  const savedNumber = normalizeWhatsAppNumber(data?.value);

  return {
    whatsappNumber: savedNumber || fallbackNumber,
    whatsappNumberSource: savedNumber ? "database" : "env"
  };
}

export function getPublicSiteSettings() {
  return unstable_cache(fetchPublicSiteSettings, ["site-settings"], {
    revalidate: 60,
    tags: ["catalog", "settings"]
  })();
}
