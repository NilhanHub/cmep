const secretKeyPattern = /(authorization|cookie|password|token|secret|accesskey|apikey|session)/i;

function truncate(value: string, limit = 160) {
  return value.length > limit ? `${value.slice(0, limit)}...` : value;
}

export function stableHash(value: string) {
  let hash = 2166136261;
  const payload = `cmep::${value}`;

  for (let index = 0; index < payload.length; index += 1) {
    hash ^= payload.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  const normalized = (hash >>> 0).toString(16).padStart(8, "0");
  return `${normalized}${normalized}`;
}

export function sanitizeIdentifier(value: string | null | undefined, prefix: string) {
  if (!value) return null;
  return `${prefix}_${stableHash(value)}`;
}

export function sanitizePortalAccess(value: string | null | undefined) {
  return sanitizeIdentifier(value, "portal");
}

export function sanitizeRecord(value: unknown, depth = 0): unknown {
  if (value == null) return null;

  if (typeof value === "string") {
    return truncate(value);
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    if (depth > 2) {
      return { kind: "array", length: value.length };
    }

    return value.slice(0, 20).map((item) => sanitizeRecord(item, depth + 1));
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).slice(0, 30);
    const sanitized = entries.map(([key, entryValue]) => {
      if (secretKeyPattern.test(key)) {
        return [key, "[redacted]"] as const;
      }

      return [key, sanitizeRecord(entryValue, depth + 1)] as const;
    });

    return Object.fromEntries(sanitized);
  }

  return String(value);
}

export function normalizeException(error: unknown) {
  if (error instanceof Error) {
    const normalized = {
      className: error.name,
      message: truncate(error.message, 240),
      stack: error.stack ? truncate(error.stack, 4_000) : null,
    };

    return "digest" in error
      ? {
          ...normalized,
          digest: typeof error.digest === "string" ? error.digest : null,
        }
      : normalized;
  }

  return {
    className: "UnknownError",
    message: truncate(String(error), 240),
    stack: null,
    digest: null,
  };
}

export function sanitizeHeaders(headers: Headers | Record<string, string | string[] | undefined>) {
  const source = headers instanceof Headers ? Object.fromEntries(headers.entries()) : headers;
  const sanitized = Object.entries(source)
    .filter(([key]) => !secretKeyPattern.test(key))
    .map(([key, value]) => [key, Array.isArray(value) ? value.join(",") : value]);

  return Object.fromEntries(sanitized);
}
