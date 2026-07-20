import "server-only";

import { performance } from "node:perf_hooks";

import { ZodError } from "zod";
import { NextResponse } from "next/server";

import { createObservationContext, getObservationContext, sanitizeObservationContext, withObservationContext, type ObservationContext } from "@/shared/observability/context";
import { isAccessDeniedError, isResourceNotFoundError } from "@/shared/observability/errors";
import { getFeatureManifest, getRuntimeMeta } from "@/shared/observability/runtime";
import { normalizeException, sanitizeHeaders, sanitizeIdentifier, sanitizePortalAccess, sanitizeRecord } from "@/shared/observability/sanitize";
import { appendJsonLine, readArtifactJson, writeArtifactJson } from "@/shared/observability/writer";

type FlowObservationInput = {
  flow: string;
  route?: string;
  endpoint?: string;
  screen?: string;
  workflow?: string;
  tenantId?: string | null;
  userId?: string | null;
  portalAccessKey?: string | null;
  expectedResult?: string;
  inputSummary?: unknown;
  stateBefore?: unknown;
  dependencyTarget?: string | null;
  retryCount?: number;
};

type FlowOutcome = {
  flow: string;
  context: ObservationContext;
  startedAt: string;
  endedAt: string;
  latencyMs: number;
  status: "success" | "failure";
  expectedResult?: string;
  inputSummary?: unknown;
  outputSummary?: unknown;
  stateBefore?: unknown;
  stateAfter?: unknown;
  dependencyTarget?: string | null;
  retryCount: number;
  exception?: ReturnType<typeof normalizeException> | null;
  guardDenied?: boolean;
};

type MetricsState = {
  generatedAt: string;
  flows: Record<
    string,
    {
      successCount: number;
      failureCount: number;
      guardDeniedCount: number;
      totalLatencyMs: number;
      minLatencyMs: number;
      maxLatencyMs: number;
      retryCount: number;
    }
  >;
  counters: Record<string, number>;
};

function isPrismaNotFound(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2025"
  );
}

function getBaseEvent(context: ObservationContext) {
  const runtimeMeta = getRuntimeMeta("node");
  return {
    timestamp: new Date().toISOString(),
    severity: "info",
    environment: runtimeMeta.environment,
    appVersion: runtimeMeta.appVersion,
    buildId: runtimeMeta.buildId,
    gitRevision: runtimeMeta.gitRevision,
    gitDirty: runtimeMeta.gitDirty,
    featureFlags: getFeatureManifest(),
    effectiveConfigFingerprint: runtimeMeta.configFingerprint,
    ...sanitizeObservationContext(context),
  };
}

async function updateMetrics(outcome: FlowOutcome) {
  const metrics = (await readArtifactJson<MetricsState>("metrics.json")) ?? {
    generatedAt: new Date().toISOString(),
    flows: {},
    counters: {},
  };

  const current = metrics.flows[outcome.flow] ?? {
    successCount: 0,
    failureCount: 0,
    guardDeniedCount: 0,
    totalLatencyMs: 0,
    minLatencyMs: Number.POSITIVE_INFINITY,
    maxLatencyMs: 0,
    retryCount: 0,
  };

  current.totalLatencyMs += outcome.latencyMs;
  current.minLatencyMs = Math.min(current.minLatencyMs, outcome.latencyMs);
  current.maxLatencyMs = Math.max(current.maxLatencyMs, outcome.latencyMs);
  current.retryCount += outcome.retryCount;

  if (outcome.status === "success") {
    current.successCount += 1;
  } else {
    current.failureCount += 1;
  }

  if (outcome.guardDenied) {
    current.guardDeniedCount += 1;
    metrics.counters.guardDeniedCount = (metrics.counters.guardDeniedCount ?? 0) + 1;
  }

  metrics.flows[outcome.flow] = current;
  metrics.generatedAt = new Date().toISOString();

  await writeArtifactJson("metrics.json", metrics);
}

async function recordOutcome(outcome: FlowOutcome) {
  const baseEvent = getBaseEvent(outcome.context);
  const traceEvent = {
    ...baseEvent,
    type: "span",
    flow: outcome.flow,
    startedAt: outcome.startedAt,
    endedAt: outcome.endedAt,
    latencyMs: outcome.latencyMs,
    status: outcome.status,
    route: outcome.context.route ?? null,
    endpoint: outcome.context.endpoint ?? null,
    screen: outcome.context.screen ?? null,
    workflow: outcome.context.workflow ?? null,
    tenant: sanitizeIdentifier(outcome.context.tenantId, "tenant"),
    user: sanitizeIdentifier(outcome.context.userId, "user"),
    portalAccess: sanitizePortalAccess(outcome.context.portalAccessKey),
  };

  const event = {
    ...traceEvent,
    expectedResult: outcome.expectedResult ?? null,
    dependencyTarget: outcome.dependencyTarget ?? null,
    retryCount: outcome.retryCount,
    inputSummary: sanitizeRecord(outcome.inputSummary),
    outputSummary: sanitizeRecord(outcome.outputSummary),
    stateBefore: sanitizeRecord(outcome.stateBefore),
    stateAfter: sanitizeRecord(outcome.stateAfter),
    resultStatus: outcome.status,
    exception: outcome.exception ?? null,
    guardDenied: outcome.guardDenied ?? false,
  };

  await Promise.all([
    appendJsonLine("app.log.jsonl", {
      ...baseEvent,
      severity: outcome.status === "success" ? "info" : "error",
      message: `${outcome.flow} ${outcome.status}`,
      flow: outcome.flow,
      latencyMs: outcome.latencyMs,
      resultStatus: outcome.status,
    }),
    appendJsonLine("events.jsonl", event),
    appendJsonLine("trace.ndjson", traceEvent),
    updateMetrics(outcome),
  ]);
}

export async function observeServerFlow<T>(
  input: FlowObservationInput,
  handler: () => Promise<T>,
) {
  const parent = getObservationContext();
  const context = createObservationContext({
    ...parent,
    route: input.route ?? parent?.route,
    endpoint: input.endpoint ?? parent?.endpoint,
    screen: input.screen ?? parent?.screen,
    workflow: input.workflow ?? parent?.workflow,
    tenantId: input.tenantId ?? parent?.tenantId ?? null,
    userId: input.userId ?? parent?.userId ?? null,
    portalAccessKey: input.portalAccessKey ?? parent?.portalAccessKey ?? null,
  });

  const started = performance.now();
  const startedAt = new Date().toISOString();

  return withObservationContext(context, async () => {
    try {
      const result = await handler();

      await recordOutcome({
        flow: input.flow,
        context,
        startedAt,
        endedAt: new Date().toISOString(),
        latencyMs: Number((performance.now() - started).toFixed(2)),
        status: "success",
        expectedResult: input.expectedResult,
        inputSummary: input.inputSummary,
        outputSummary: result,
        stateBefore: input.stateBefore,
        dependencyTarget: input.dependencyTarget ?? null,
        retryCount: input.retryCount ?? 0,
      });

      return result;
    } catch (error) {
      const guardDenied = isAccessDeniedError(error) || isResourceNotFoundError(error) || isPrismaNotFound(error);

      await recordOutcome({
        flow: input.flow,
        context,
        startedAt,
        endedAt: new Date().toISOString(),
        latencyMs: Number((performance.now() - started).toFixed(2)),
        status: "failure",
        expectedResult: input.expectedResult,
        inputSummary: input.inputSummary,
        stateBefore: input.stateBefore,
        dependencyTarget: input.dependencyTarget ?? null,
        retryCount: input.retryCount ?? 0,
        exception: normalizeException(error),
        guardDenied,
      });

      throw error;
    }
  });
}

export async function observeRouteRequest<T>(
  request: Request,
  input: FlowObservationInput,
  handler: () => Promise<T>,
) {
  const requestHeaders = request.headers;

  return observeServerFlow(
    {
      ...input,
      inputSummary: {
        method: request.method,
        path: new URL(request.url).pathname,
        headers: sanitizeHeaders(requestHeaders),
        body: sanitizeRecord(input.inputSummary),
      },
    },
    handler,
  );
}

export async function handleObservedRouteError(error: unknown, input: FlowObservationInput) {
  const status = error instanceof ZodError ? 400 : isAccessDeniedError(error) ? 403 : isResourceNotFoundError(error) || isPrismaNotFound(error) ? 404 : 500;
  const message =
    status === 400
      ? "Validation failed."
      : status === 403
        ? "Access denied."
        : status === 404
          ? "Resource not found."
          : "Unexpected server error.";

  const context = getObservationContext() ?? createObservationContext({
    route: input.route,
    endpoint: input.endpoint,
    screen: input.screen,
    workflow: input.workflow,
    tenantId: input.tenantId ?? null,
    userId: input.userId ?? null,
    portalAccessKey: input.portalAccessKey ?? null,
  });

  await appendJsonLine("exceptions.jsonl", {
    ...getBaseEvent(context),
    flow: input.flow,
    status,
    exception: normalizeException(error),
  });

  return NextResponse.json(
    {
      error: message,
      details: error instanceof ZodError ? error.flatten() : undefined,
    },
    { status },
  );
}

export async function recordClientSideEvent(input: {
  kind: string;
  route?: string;
  navigationType?: string;
  detail?: unknown;
}) {
  const baseEvent = getBaseEvent(
    createObservationContext({
      route: input.route ?? undefined,
      screen: input.route ?? undefined,
    }),
  );

  await appendJsonLine("events.jsonl", {
    ...baseEvent,
    type: "client-event",
    kind: input.kind,
    route: input.route ?? null,
    navigationType: input.navigationType ?? null,
    detail: sanitizeRecord(input.detail),
  });
}

export async function incrementMetricCounter(counter: string, amount = 1) {
  const metrics = (await readArtifactJson<MetricsState>("metrics.json")) ?? {
    generatedAt: new Date().toISOString(),
    flows: {},
    counters: {},
  };

  metrics.counters[counter] = (metrics.counters[counter] ?? 0) + amount;
  metrics.generatedAt = new Date().toISOString();

  await writeArtifactJson("metrics.json", metrics);
}

export async function initializeServerObservability(source: string) {
  const runtimeMeta = getRuntimeMeta(process.env.NEXT_RUNTIME === "edge" ? "edge" : "node");
  await Promise.all([
    writeArtifactJson("build-meta.json", runtimeMeta),
    writeArtifactJson("feature-flags.json", getFeatureManifest()),
    appendJsonLine("app.log.jsonl", {
      timestamp: new Date().toISOString(),
      severity: "info",
      message: "observability.registered",
      source,
      ...runtimeMeta,
    }),
  ]);
}
