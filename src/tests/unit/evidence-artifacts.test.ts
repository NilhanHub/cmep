import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { initializeServerObservability, observeServerFlow } from "@/shared/observability/server";

const tempRuns: string[] = [];

describe("evidence artifacts", () => {
  afterEach(async () => {
    process.env.CMEP_RUN_DIR = "";

    while (tempRuns.length > 0) {
      const target = tempRuns.pop();
      if (target) {
        await rm(target, { recursive: true, force: true });
      }
    }
  });

  it("emits logs, traces, and metrics into the active run directory", async () => {
    const runDir = await mkdtemp(path.join(os.tmpdir(), "cmep-observe-"));
    tempRuns.push(runDir);
    process.env.CMEP_RUN_DIR = runDir;

    await initializeServerObservability("vitest");
    await observeServerFlow(
      {
        flow: "test.accountability.flow",
        route: "/tests/accountability",
        tenantId: "tenant_northstar",
        userId: "user_iris",
        expectedResult: "Emit local observability artifacts.",
        inputSummary: { source: "vitest" },
      },
      async () => ({ ok: true }),
    );

    const appLog = await readFile(path.join(runDir, "app.log.jsonl"), "utf8");
    const events = await readFile(path.join(runDir, "events.jsonl"), "utf8");
    const trace = await readFile(path.join(runDir, "trace.ndjson"), "utf8");
    const metrics = JSON.parse(await readFile(path.join(runDir, "metrics.json"), "utf8")) as {
      flows: Record<string, { successCount: number }>;
    };

    expect(appLog).toContain("observability.registered");
    expect(events).toContain("test.accountability.flow");
    expect(trace).toContain("test.accountability.flow");
    expect(metrics.flows["test.accountability.flow"]?.successCount).toBe(1);
  });
});
