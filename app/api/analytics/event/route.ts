import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { analyticsEventTypes } from "@/lib/analytics";
import { createPublicClient } from "@/lib/supabase/public";

const metadataValueSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);

const analyticsEventSchema = z.object({
  eventType: z.enum(analyticsEventTypes),
  visitorId: z.string().uuid(),
  productId: z.string().uuid().nullable().optional(),
  productSlug: z.string().trim().max(220).nullable().optional(),
  productName: z.string().trim().max(220).nullable().optional(),
  path: z.string().trim().max(500).nullable().optional(),
  referrer: z.string().trim().max(500).nullable().optional(),
  metadata: z.record(metadataValueSchema).optional()
});

function trimHeader(value: string | null, maxLength = 500) {
  return value ? value.slice(0, maxLength) : null;
}

export async function POST(request: NextRequest) {
  const supabase = createPublicClient();

  if (!supabase) {
    return NextResponse.json({ ok: true, skipped: "supabase_not_configured" }, { status: 202 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const parsed = analyticsEventSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  const event = parsed.data;
  const { error } = await supabase.from("analytics_events").insert({
    event_type: event.eventType,
    visitor_id: event.visitorId,
    product_id: event.productId ?? null,
    product_slug: event.productSlug || null,
    product_name: event.productName || null,
    path: event.path || null,
    referrer: event.referrer || trimHeader(request.headers.get("referer")),
    user_agent: trimHeader(request.headers.get("user-agent")),
    metadata: event.metadata ?? {}
  });

  if (error) {
    return NextResponse.json({ ok: false, error: "insert_failed" }, { status: 202 });
  }

  return NextResponse.json({ ok: true }, { status: 202 });
}
