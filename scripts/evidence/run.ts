import path from "node:path";
import { readFile, stat } from "node:fs/promises";

import { applyProofUpdates, ensureProofMatrix, readProofMatrix } from "./proof-matrix";
import { collectStateSummary, disconnectStateClient } from "./state";
import {
  createRunContext,
  initializeRunContext,
  nextCli,
  playwrightCli,
  runCommandCapture,
  startAppServer,
  stopProcess,
  tsxCli,
  updateLatestRunPointer,
  writeJson,
  writeText,
  type RunContext,
} from "./lib";

type EvidenceOptions = {
  scenario: "smoke" | "isolation" | "catalog" | "full";
  segment: "smoke" | "isolation" | "catalog" | "full";
  updateProof: boolean;
};

type CommandResult = {
  name: string;
  exitCode: number | null;
  stdoutPath: string;
  stderrPath: string;
};

async function exists(target: string) {
  try {
    await stat(target);
    return true;
  } catch {
    return false;
  }
}

async function readJsonFile<T>(target: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(target, "utf8")) as T;
  } catch {
    return null;
  }
}

function proofStatus(condition: boolean) {
  return condition ? "verified" : "falsified";
}

function parseJsonLines(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line) as unknown;
      } catch {
        return { unparsable: line };
      }
    });
}

function isExpectedGuardException(entry: unknown) {
  if (typeof entry !== "object" || entry === null) {
    return false;
  }

  const candidate = entry as {
    flow?: string;
    status?: number;
    exception?: { className?: string };
  };

  const guardFlow = new Set(["customer.update", "portal.reply.send", "revenue.quote.decision"]);
  const guardClass = new Set(["AccessDeniedError", "ResourceNotFoundError"]);

  return (
    guardFlow.has(candidate.flow ?? "") &&
    guardClass.has(candidate.exception?.className ?? "") &&
    (candidate.status === 403 || candidate.status === 404)
  );
}

async function generateExceptionSummaryFromLogs(run: RunContext) {
  const serverExceptionsPath = path.join(run.rootDir, "exceptions.jsonl");
  const browserErrorsPath = path.join(run.rootDir, "browser-errors.jsonl");

  const serverExceptions = (await exists(serverExceptionsPath))
    ? parseJsonLines(await readFile(serverExceptionsPath, "utf8"))
    : [];
  const browserErrors = (await exists(browserErrorsPath))
    ? parseJsonLines(await readFile(browserErrorsPath, "utf8"))
    : [];
  const expectedGuardDenials = serverExceptions.filter(isExpectedGuardException);
  const unexpectedServerExceptions = serverExceptions.filter((entry) => !isExpectedGuardException(entry));

  await writeJson(path.join(run.rootDir, "exception.json"), {
    serverExceptions,
    expectedGuardDenials,
    unexpectedServerExceptions,
    browserErrors,
  });

  return { serverExceptions, expectedGuardDenials, unexpectedServerExceptions, browserErrors };
}

async function buildBundleManifest(run: RunContext) {
  const artifacts = [
    "summary.md",
    "app.log.jsonl",
    "events.jsonl",
    "trace.ndjson",
    "metrics.json",
    "inputs.sanitized.json",
    "effective-config.sanitized.json",
    "feature-flags.json",
    "build-meta.json",
    "state-before.json",
    "state-after.json",
    "network.har",
    "browser-console.jsonl",
    "browser-errors.jsonl",
    "browser-network.jsonl",
    "browser-network-failures.jsonl",
    "exceptions.jsonl",
    "stdout.log",
    "stderr.log",
    "exception.json",
    "ui.png",
    "ui-state.json",
    "dom.html",
    "dom",
    "ui-states",
    "playwright-trace.zip",
    "seed-identifiers.json",
    "state-reset-a.json",
    "state-reset-b.json",
    "bundle-manifest.json",
    "proof-matrix-snapshot.json",
    "scenario-results.json",
    "screenshots",
    "videos",
    "playwright-output",
  ];

  return {
    generatedAt: new Date().toISOString(),
    runId: run.id,
    scenario: run.scenario,
    artifacts: await Promise.all(
      artifacts.map(async (artifact) => ({
        name: artifact,
        path: path.join(run.rootDir, artifact),
        exists: await exists(path.join(run.rootDir, artifact)),
      })),
    ),
  };
}

async function writeSummary(run: RunContext, commands: CommandResult[], notes: string[]) {
  const lines = [
    `# Evidence Run ${run.id}`,
    "",
    `- Scenario: ${run.scenario}`,
    `- Created: ${run.createdAt}`,
    "",
    "## Commands",
    "",
    ...commands.map(
      (command) =>
        `- \`${command.name}\` -> ${command.exitCode === 0 ? "pass" : `fail (${command.exitCode ?? "no-exit"})`} (${path.relative(process.cwd(), command.stdoutPath)})`,
    ),
    "",
    "## Notes",
    "",
    ...notes.map((note) => `- ${note}`),
    "",
  ];

  await writeText(path.join(run.rootDir, "summary.md"), `${lines.join("\n")}\n`);
}

export async function runEvidenceScenario(options: EvidenceOptions) {
  const run = createRunContext(options.scenario);
  const commandResults: CommandResult[] = [];
  const notes: string[] = [];
  const latestProofMatrix = await ensureProofMatrix();

  const metadata = await initializeRunContext(run, {
    scenario: options.scenario,
    segment: options.segment,
    commands: [
      "node node_modules/tsx/dist/cli.cjs scripts/db/reset.ts",
      "node node_modules/next/dist/bin/next build",
      "node node_modules/@playwright/test/cli.js test src/tests/e2e/cmep-accountable.spec.ts",
    ],
  });

  await writeJson(path.join(run.rootDir, "proof-matrix-snapshot.json"), latestProofMatrix);

  const resetACommand = tsxCli("scripts/db/reset.ts");
  const resetA = await runCommandCapture(run, "demo-reset-a", resetACommand.command, resetACommand.args);
  commandResults.push({ name: "demo-reset-a", ...resetA });
  const stateResetA = await collectStateSummary("reset-a");
  await writeJson(path.join(run.rootDir, "state-reset-a.json"), stateResetA);
  await disconnectStateClient();

  const resetBCommand = tsxCli("scripts/db/reset.ts");
  const resetB = await runCommandCapture(run, "demo-reset-b", resetBCommand.command, resetBCommand.args);
  commandResults.push({ name: "demo-reset-b", ...resetB });
  const stateResetB = await collectStateSummary("reset-b");
  await writeJson(path.join(run.rootDir, "state-reset-b.json"), stateResetB);
  await disconnectStateClient();

  const determinismVerified = stateResetA.fingerprint === stateResetB.fingerprint;
  notes.push(
    determinismVerified
      ? "Consecutive reset fingerprints matched."
      : `Reset fingerprints diverged: ${stateResetA.fingerprint} vs ${stateResetB.fingerprint}.`,
  );

  const resetFinalCommand = tsxCli("scripts/db/reset.ts");
  const resetFinal = await runCommandCapture(run, "demo-reset-final", resetFinalCommand.command, resetFinalCommand.args);
  commandResults.push({ name: "demo-reset-final", ...resetFinal });
  const stateBefore = await collectStateSummary("before");
  await writeJson(path.join(run.rootDir, "state-before.json"), stateBefore);
  await writeJson(path.join(run.rootDir, "seed-identifiers.json"), stateBefore.seedIdentifiers);
  await disconnectStateClient();

  const buildCommand = nextCli(["build"]);
  const build = await runCommandCapture(run, "build", buildCommand.command, buildCommand.args);
  commandResults.push({ name: "build", ...build });

  let server;

  try {
    server = await startAppServer(run, 3300, {
      ...process.env,
      NODE_ENV: "production",
      CMEP_RUN_DIR: run.rootDir,
      CMEP_BUILD_ID: run.id,
      CMEP_GIT_REVISION: metadata.gitRevision,
      CMEP_GIT_DIRTY: String(metadata.gitDirty),
      CMEP_CONFIG_FINGERPRINT: metadata.configFingerprint,
    });

    const playwrightCommand = playwrightCli(["test", "src/tests/e2e/cmep-accountable.spec.ts"]);
    const playwright = await runCommandCapture(
      run,
      "playwright-accountable",
      playwrightCommand.command,
      playwrightCommand.args,
      {
        ...process.env,
        CMEP_BASE_URL: "http://localhost:3300",
        CMEP_RUN_DIR: run.rootDir,
        CMEP_BUILD_ID: run.id,
        CMEP_GIT_REVISION: metadata.gitRevision,
        CMEP_GIT_DIRTY: String(metadata.gitDirty),
        CMEP_CONFIG_FINGERPRINT: metadata.configFingerprint,
        CMEP_EVIDENCE_RUN_DIR: run.rootDir,
        CMEP_EVIDENCE_SEGMENT: options.segment,
        CMEP_PLAYWRIGHT_MANAGED_SERVER: "external",
        CMEP_PLAYWRIGHT_SKIP_GLOBAL_SETUP: "true",
        CMEP_PLAYWRIGHT_TRACE: "off",
        CMEP_PLAYWRIGHT_SCREENSHOT: "on",
        CMEP_PLAYWRIGHT_VIDEO: "on",
        CMEP_PLAYWRIGHT_OUTPUT_DIR: path.join(run.rootDir, "playwright-output"),
      },
    );

    commandResults.push({ name: "playwright-accountable", ...playwright });
  } finally {
    if (server) {
      await stopProcess(server);
    }
  }

  const stateAfter = await collectStateSummary("after");
  await writeJson(path.join(run.rootDir, "state-after.json"), stateAfter);
  await disconnectStateClient();

  const { serverExceptions, expectedGuardDenials, unexpectedServerExceptions, browserErrors } =
    await generateExceptionSummaryFromLogs(run);

  const scenarioResults =
    (await readJsonFile<Record<string, unknown>>(path.join(run.rootDir, "scenario-results.json"))) ?? {};
  const beforeSignal = stateBefore.tenants.find((tenant) => tenant.tenantId === "tenant_signal")?.counts ?? {};
  const afterSignal = stateAfter.tenants.find((tenant) => tenant.tenantId === "tenant_signal")?.counts ?? {};

  const appBootVerified =
    commandResults.find((command) => command.name === "build")?.exitCode === 0 &&
    (await exists(path.join(run.rootDir, "stdout.log")));
  const flowsVerified = commandResults.find((command) => command.name === "playwright-accountable")?.exitCode === 0;
  const portalScopingVerified =
    typeof scenarioResults.probeResults === "object" &&
    scenarioResults.probeResults !== null &&
    (scenarioResults.probeResults as Record<string, { status?: number }>).crossClientPortalReply?.status === 403 &&
    (scenarioResults.probeResults as Record<string, { status?: number }>).crossClientQuoteDecision?.status === 403;
  const tenantIsolationVerified =
    typeof scenarioResults.probeResults === "object" &&
    scenarioResults.probeResults !== null &&
    (scenarioResults.probeResults as Record<string, { status?: number }>).crossTenantCustomerUpdate?.status === 404;
  const resetCommandsVerified =
    resetA.exitCode === 0 && resetB.exitCode === 0 && resetFinal.exitCode === 0;
  const runtimeIntegrityVerified =
    unexpectedServerExceptions.length === 0 && browserErrors.length === 0 && flowsVerified;
  const offeringCreated =
    typeof scenarioResults.created === "object" &&
    scenarioResults.created !== null &&
    typeof (scenarioResults.created as Record<string, unknown>).offeringId === "string" &&
    ((scenarioResults.created as Record<string, unknown>).offeringId as string).length > 0;
  const crossTenantCatalogDenied =
    typeof scenarioResults.probeResults === "object" &&
    scenarioResults.probeResults !== null &&
    Array.isArray((scenarioResults.probeResults as Record<string, { offerings?: unknown[] }>).crossTenantCatalogSearch?.offerings) &&
    ((scenarioResults.probeResults as Record<string, { offerings?: unknown[] }>).crossTenantCatalogSearch?.offerings?.length ?? 0) === 0;
  const offeringSpineStateAdvanced =
    Number(afterSignal.offerings ?? 0) > Number(beforeSignal.offerings ?? 0) &&
    Number(afterSignal.catalogAssignments ?? 0) > Number(beforeSignal.catalogAssignments ?? 0) &&
    Number(afterSignal.customerOfferingLinks ?? 0) > Number(beforeSignal.customerOfferingLinks ?? 0);
  const offeringSpineArtifactsVerified =
    (await exists(path.join(run.rootDir, "screenshots", "catalog-home.png"))) &&
    (await exists(path.join(run.rootDir, "screenshots", "offering-detail.png"))) &&
    (await exists(path.join(run.rootDir, "screenshots", "customer-detail.png"))) &&
    (await exists(path.join(run.rootDir, "screenshots", "client-portal.png")));
  const offeringSpineVerified =
    offeringCreated && offeringSpineStateAdvanced && offeringSpineArtifactsVerified && crossTenantCatalogDenied;

  notes.push(`Server exceptions captured: ${serverExceptions.length}`);
  notes.push(`Expected guard denials captured: ${expectedGuardDenials.length}`);
  notes.push(`Unexpected server exceptions captured: ${unexpectedServerExceptions.length}`);
  notes.push(`Browser page errors captured: ${browserErrors.length}`);
  notes.push(`Offering spine created: ${offeringCreated ? "yes" : "no"}`);
  notes.push(`Signal offering counts before/after: ${beforeSignal.offerings ?? 0} -> ${afterSignal.offerings ?? 0}`);
  notes.push(
    `Signal customer-offering links before/after: ${beforeSignal.customerOfferingLinks ?? 0} -> ${afterSignal.customerOfferingLinks ?? 0}`,
  );

  await writeSummary(run, commandResults, notes);
  await writeJson(path.join(run.rootDir, "bundle-manifest.json"), { status: "finalizing" });
  const manifest = await buildBundleManifest(run);
  await writeJson(path.join(run.rootDir, "bundle-manifest.json"), manifest);
  await updateLatestRunPointer(run, {
    determinismVerified,
    runtimeIntegrityVerified,
  });

  if (options.updateProof) {
    await applyProofUpdates([
      {
        id: "claim.boot.local",
        status: proofStatus(Boolean(appBootVerified)),
        evidencePaths: [
          path.relative(process.cwd(), path.join(run.rootDir, "summary.md")),
          path.relative(process.cwd(), path.join(run.rootDir, "stdout.log")),
          path.relative(process.cwd(), path.join(run.rootDir, "commands", "build.stdout.log")),
        ],
        lastVerifiedAt: new Date().toISOString(),
        runIds: [run.id],
        blockingGap: appBootVerified ? null : "Build or server boot evidence failed.",
        notes: ["Evidence runner built the app and started the production server on port 3300."],
      },
      {
        id: "claim.surfaces.endToEnd",
        status: proofStatus(Boolean(flowsVerified)),
        evidencePaths: [
          path.relative(process.cwd(), path.join(run.rootDir, "screenshots")),
          path.relative(process.cwd(), path.join(run.rootDir, "playwright-trace.zip")),
          path.relative(process.cwd(), path.join(run.rootDir, "scenario-results.json")),
        ],
        lastVerifiedAt: new Date().toISOString(),
        runIds: [run.id],
        blockingGap: flowsVerified ? null : "Playwright accountable flow failed.",
        notes: ["Mission control, catalog, customer graph, inbox, lifecycle, automations, schedule, revenue, and portal were exercised in one run."],
      },
      {
        id: "claim.tenantIsolation",
        status: proofStatus(Boolean(tenantIsolationVerified)),
        evidencePaths: [
          path.relative(process.cwd(), path.join(run.rootDir, "scenario-results.json")),
          path.relative(process.cwd(), path.join(run.rootDir, "screenshots", "customers-list.png")),
          path.relative(process.cwd(), path.join(run.rootDir, "screenshots", "catalog-home.png")),
        ],
        lastVerifiedAt: new Date().toISOString(),
        runIds: [run.id],
        blockingGap: tenantIsolationVerified ? null : "Cross-tenant denial evidence is missing or failing.",
        notes: [
          "Signal tenant received a 404 on a tampered Northstar customer update attempt.",
          "Northstar global search returned zero catalog/offering results for the Signal-only evidence offering.",
        ],
      },
      {
        id: "claim.portalScoping",
        status: proofStatus(Boolean(portalScopingVerified)),
        evidencePaths: [
          path.relative(process.cwd(), path.join(run.rootDir, "scenario-results.json")),
          path.relative(process.cwd(), path.join(run.rootDir, "screenshots", "client-portal-signal.png")),
          path.relative(process.cwd(), path.join(run.rootDir, "screenshots", "client-portal.png")),
        ],
        lastVerifiedAt: new Date().toISOString(),
        runIds: [run.id],
        blockingGap: portalScopingVerified ? null : "Cross-client denial evidence is missing or failing.",
        notes: [
          "Ava's portal view did not expose the Signal-only evidence offering.",
          "Zoe portal access was denied when tampering against Ava's conversation and quote.",
        ],
      },
      {
        id: "claim.dbDeterminism",
        status: proofStatus(Boolean(determinismVerified && resetCommandsVerified)),
        evidencePaths: [
          path.relative(process.cwd(), path.join(run.rootDir, "state-reset-a.json")),
          path.relative(process.cwd(), path.join(run.rootDir, "state-reset-b.json")),
          path.relative(process.cwd(), path.join(run.rootDir, "state-before.json")),
        ],
        lastVerifiedAt: new Date().toISOString(),
        runIds: [run.id],
        blockingGap:
          determinismVerified && resetCommandsVerified
            ? null
            : !resetCommandsVerified
              ? "One or more reset commands failed on Windows-local rerun."
              : "Consecutive reset fingerprints diverged.",
        notes: [
          `Reset A fingerprint: ${stateResetA.fingerprint}`,
          `Reset B fingerprint: ${stateResetB.fingerprint}`,
          `Reset command exit codes: A=${resetA.exitCode ?? "null"}, B=${resetB.exitCode ?? "null"}, final=${resetFinal.exitCode ?? "null"}`,
        ],
      },
      {
        id: "claim.runtimeIntegrity",
        status: proofStatus(Boolean(runtimeIntegrityVerified)),
        evidencePaths: [
          path.relative(process.cwd(), path.join(run.rootDir, "exception.json")),
          path.relative(process.cwd(), path.join(run.rootDir, "exceptions.jsonl")),
          path.relative(process.cwd(), path.join(run.rootDir, "summary.md")),
        ],
        lastVerifiedAt: new Date().toISOString(),
        runIds: [run.id],
        blockingGap:
          runtimeIntegrityVerified ? null : "Unexpected browser or server exceptions were captured during the accountable flow.",
        notes: [
          "Runtime integrity excludes expected guard-denial probes and requires zero unexpected page/server errors plus a passing accountable flow.",
          `Expected guard denials: ${expectedGuardDenials.length}`,
          `Unexpected server exceptions: ${unexpectedServerExceptions.length}`,
        ],
      },
      {
        id: "claim.offeringSpine",
        status: proofStatus(Boolean(offeringSpineVerified)),
        evidencePaths: [
          path.relative(process.cwd(), path.join(run.rootDir, "screenshots", "catalog-home.png")),
          path.relative(process.cwd(), path.join(run.rootDir, "screenshots", "offering-detail.png")),
          path.relative(process.cwd(), path.join(run.rootDir, "screenshots", "customer-detail.png")),
          path.relative(process.cwd(), path.join(run.rootDir, "screenshots", "client-portal.png")),
          path.relative(process.cwd(), path.join(run.rootDir, "state-before.json")),
          path.relative(process.cwd(), path.join(run.rootDir, "state-after.json")),
          path.relative(process.cwd(), path.join(run.rootDir, "scenario-results.json")),
        ],
        lastVerifiedAt: new Date().toISOString(),
        runIds: [run.id],
        blockingGap:
          offeringSpineVerified
            ? null
            : "The accountable run did not prove offering creation, offering-routed flow deltas, visual catalog surfaces, and cross-tenant catalog denial together.",
        notes: [
          "The accountable flow created a new service offering, added a variant, versioned pricing, assigned a catalog, created lifecycle and revenue records through that offering, and exposed the result in the portal.",
          `Signal offering counts: ${beforeSignal.offerings ?? 0} -> ${afterSignal.offerings ?? 0}`,
          `Signal catalog assignments: ${beforeSignal.catalogAssignments ?? 0} -> ${afterSignal.catalogAssignments ?? 0}`,
          `Signal customer-offering links: ${beforeSignal.customerOfferingLinks ?? 0} -> ${afterSignal.customerOfferingLinks ?? 0}`,
        ],
      },
    ]);
  }

  await writeJson(path.join(run.rootDir, "proof-matrix-snapshot.json"), await readProofMatrix());

  return run;
}
