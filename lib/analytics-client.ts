"use client";

import type { AnalyticsTrackInput } from "@/lib/analytics";

const VISITOR_STORAGE_KEY = "liensi_visitor_id";
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function fallbackVisitorId() {
  const bytes = new Uint8Array(16);
  window.crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(
    16,
    20
  )}-${hex.slice(20)}`;
}

function getOrCreateVisitorId() {
  try {
    const stored = window.localStorage.getItem(VISITOR_STORAGE_KEY);

    if (stored && UUID_PATTERN.test(stored)) {
      return stored;
    }

    const visitorId =
      typeof window.crypto.randomUUID === "function"
        ? window.crypto.randomUUID()
        : fallbackVisitorId();

    window.localStorage.setItem(VISITOR_STORAGE_KEY, visitorId);
    return visitorId;
  } catch {
    return typeof window.crypto.randomUUID === "function"
      ? window.crypto.randomUUID()
      : fallbackVisitorId();
  }
}

function shouldSkipTracking() {
  return typeof navigator !== "undefined" && navigator.doNotTrack === "1";
}

export function trackAnalyticsEvent(input: AnalyticsTrackInput) {
  if (typeof window === "undefined" || shouldSkipTracking()) {
    return;
  }

  const body = JSON.stringify({
    ...input,
    visitorId: getOrCreateVisitorId(),
    path: `${window.location.pathname}${window.location.search}`,
    referrer: document.referrer || null
  });

  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon("/api/analytics/event", blob);
    return;
  }

  fetch("/api/analytics/event", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body,
    keepalive: true
  }).catch(() => {
    // Analytics cannot interrupt catalog browsing.
  });
}
