"use client";

type ClientEventPayload = {
  kind: string;
  route?: string;
  navigationType?: string;
  detail?: unknown;
};

function sanitizeClientDetail(value: unknown, depth = 0): unknown {
  if (value == null) return null;

  if (typeof value === "string") {
    return value.length > 160 ? `${value.slice(0, 160)}...` : value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (Array.isArray(value)) {
    if (depth > 2) return { kind: "array", length: value.length };
    return value.slice(0, 20).map((item) => sanitizeClientDetail(item, depth + 1));
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).slice(0, 20);
    return Object.fromEntries(
      entries.map(([key, entryValue]) => [key, sanitizeClientDetail(entryValue, depth + 1)]),
    );
  }

  return String(value);
}

function postClientEvent(payload: ClientEventPayload) {
  try {
    const body = JSON.stringify({
      ...payload,
      detail: sanitizeClientDetail(payload.detail),
    });

    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon("/api/observability/client-event", blob);
      return;
    }

    void fetch("/api/observability/client-event", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body,
      keepalive: true,
    });
  } catch {
    // Client instrumentation must never block app behavior.
  }
}

export function reportClientError(kind: string, detail: unknown) {
  postClientEvent({
    kind,
    route: window.location.pathname,
    detail,
  });
}

export function reportClientNavigation(url: string, navigationType: string) {
  postClientEvent({
    kind: "client.navigation.start",
    route: window.location.pathname,
    navigationType,
    detail: {
      nextUrl: url,
    },
  });
}
