import { AsyncLocalStorage } from "node:async_hooks";

import { sanitizeIdentifier, sanitizePortalAccess } from "@/shared/observability/sanitize";

export type ObservationContext = {
  requestId: string;
  interactionId: string;
  traceId: string;
  spanId: string;
  route?: string;
  endpoint?: string;
  screen?: string;
  workflow?: string;
  tenantId?: string | null;
  userId?: string | null;
  portalAccessKey?: string | null;
};

const observationStore = new AsyncLocalStorage<ObservationContext>();

function createUuid() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `cmep-${Math.random().toString(16).slice(2)}-${Date.now().toString(16)}`;
}

export function createObservationContext(input: Partial<ObservationContext> = {}): ObservationContext {
  return {
    requestId: input.requestId ?? createUuid(),
    interactionId: input.interactionId ?? createUuid(),
    traceId: input.traceId ?? createUuid(),
    spanId: input.spanId ?? createUuid(),
    route: input.route,
    endpoint: input.endpoint,
    screen: input.screen,
    workflow: input.workflow,
    tenantId: input.tenantId ?? null,
    userId: input.userId ?? null,
    portalAccessKey: input.portalAccessKey ?? null,
  };
}

export function withObservationContext<T>(
  context: ObservationContext,
  handler: () => Promise<T> | T,
) {
  return observationStore.run(context, handler);
}

export function getObservationContext() {
  return observationStore.getStore();
}

export function sanitizeObservationContext(context: ObservationContext) {
  return {
    requestId: context.requestId,
    interactionId: context.interactionId,
    traceId: context.traceId,
    spanId: context.spanId,
    route: context.route ?? null,
    endpoint: context.endpoint ?? null,
    screen: context.screen ?? null,
    workflow: context.workflow ?? null,
    tenant: sanitizeIdentifier(context.tenantId, "tenant"),
    user: sanitizeIdentifier(context.userId, "user"),
    portalAccess: sanitizePortalAccess(context.portalAccessKey),
  };
}
