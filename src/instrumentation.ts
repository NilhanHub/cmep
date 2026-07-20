import type { Instrumentation } from "next";

function truncate(value: string, limit = 4000) {
  return value.length > limit ? `${value.slice(0, limit)}...` : value;
}

function sanitizeHeaders(headers: Headers | Record<string, string | string[] | undefined>) {
  const blocked = /(authorization|cookie|password|token|secret|accesskey|apikey|session)/i;
  const source = headers instanceof Headers ? Object.fromEntries(headers.entries()) : headers;
  const entries = Object.entries(source).filter(([key]) => !blocked.test(key));
  return Object.fromEntries(entries);
}

function normalizeException(error: unknown) {
  if (error instanceof Error) {
    return {
      className: error.name,
      message: truncate(error.message, 400),
      stack: error.stack ? truncate(error.stack, 4000) : null,
    };
  }

  return {
    className: "UnknownError",
    message: truncate(String(error), 400),
    stack: null,
  };
}

function getRuntimeMeta() {
  return {
    environment: process.env.NODE_ENV ?? "development",
    appVersion: process.env.npm_package_version ?? "0.1.0",
    buildId: process.env.CMEP_BUILD_ID ?? "local",
    gitRevision: process.env.CMEP_GIT_REVISION ?? "unknown",
    gitDirty: process.env.CMEP_GIT_DIRTY === "true",
    configFingerprint: process.env.CMEP_CONFIG_FINGERPRINT ?? "unknown",
  };
}

export async function register() {
  console.info(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      severity: "info",
      message: "observability.registered",
      source: "next.server.register",
      ...getRuntimeMeta(),
    }),
  );
}

export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  console.error(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      severity: "error",
      message: "next.request.error",
      ...getRuntimeMeta(),
      request: {
        path: request.path,
        method: request.method,
        headers: sanitizeHeaders(request.headers),
      },
      context,
      exception: normalizeException(error),
    }),
  );
};
