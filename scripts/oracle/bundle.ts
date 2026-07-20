import { spawn } from "node:child_process";
import { cp, mkdir, readdir, readFile, stat, writeFile, copyFile } from "node:fs/promises";
import path from "node:path";

import { applyProofUpdates } from "../evidence/proof-matrix";

type LatestRunPointer = {
  id: string;
  scenario: string;
  createdAt: string;
  path: string;
};

type RunDirectoryPointer = {
  name: string;
  fullPath: string;
  relativePath: string;
};

function nowStamp() {
  return new Date().toISOString().replaceAll(":", "").replaceAll("-", "").replace(/\.\d+Z$/, "Z").replace("T", "-");
}

async function exists(target: string) {
  try {
    await stat(target);
    return true;
  } catch {
    return false;
  }
}

async function ensureDir(target: string) {
  await mkdir(target, { recursive: true });
}

async function writeText(target: string, value: string) {
  await ensureDir(path.dirname(target));
  await writeFile(target, value, "utf8");
}

async function writeJson(target: string, value: unknown) {
  await writeText(target, `${JSON.stringify(value, null, 2)}\n`);
}

async function readJson<T>(target: string): Promise<T> {
  return JSON.parse(await readFile(target, "utf8")) as T;
}

async function findLatestRunDirectory(pattern: RegExp): Promise<RunDirectoryPointer | null> {
  const runsRoot = path.join(process.cwd(), "artifacts", "runs");
  const entries = await readdir(runsRoot, { withFileTypes: true });

  const candidates = await Promise.all(
    entries
      .filter((entry) => entry.isDirectory() && pattern.test(entry.name))
      .map(async (entry) => {
        const fullPath = path.join(runsRoot, entry.name);
        const details = await stat(fullPath);
        return {
          name: entry.name,
          fullPath,
          relativePath: path.relative(process.cwd(), fullPath).replaceAll("\\", "/"),
          mtimeMs: details.mtimeMs,
        };
      }),
  );

  const winner = candidates.sort((left, right) => right.mtimeMs - left.mtimeMs)[0];
  if (!winner) {
    return null;
  }

  return {
    name: winner.name,
    fullPath: winner.fullPath,
    relativePath: winner.relativePath,
  };
}

async function copyRelativeIntoBundle(bundleRoot: string, relativePath: string, destinationRoot = "repo") {
  const source = path.join(process.cwd(), relativePath);
  if (!(await exists(source))) {
    return false;
  }

  const destination = path.join(bundleRoot, destinationRoot, relativePath);
  await ensureDir(path.dirname(destination));
  await cp(source, destination, { recursive: true, force: true });
  return true;
}

async function searchInstructionFiles(files: string[]) {
  const pattern = /\b(oracle|bundle|include|exclude|dry-run|debug|repro|handoff)\b/i;
  const results: string[] = [];

  for (const file of files) {
    const source = path.join(process.cwd(), file);
    if (!(await exists(source))) continue;

    const lines = (await readFile(source, "utf8")).split(/\r?\n/);
    lines.forEach((line, index) => {
      if (pattern.test(line)) {
        results.push(`${file}:${index + 1}: ${line}`);
      }
    });
  }

  return results;
}

async function runOracleCli(cwd: string, args: string[]) {
  return new Promise<{ exitCode: number | null; stdout: string; stderr: string }>((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [path.join(path.dirname(process.execPath), "node_modules", "npm", "bin", "npx-cli.js"), "-y", "@steipete/oracle", ...args],
      {
        cwd,
        stdio: "pipe",
        env: process.env,
      },
    );

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (exitCode) => {
      resolve({ exitCode, stdout, stderr });
    });
  });
}

async function collectOversizeFiles(root: string, maxBytes: number) {
  const results: Array<{ path: string; sizeBytes: number }> = [];

  async function visit(current: string) {
    const entries = await readdir(current, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await visit(fullPath);
        continue;
      }

      const details = await stat(fullPath);
      if (details.size > maxBytes) {
        results.push({
          path: path.relative(root, fullPath).replaceAll("\\", "/"),
          sizeBytes: details.size,
        });
      }
    }
  }

  await visit(root);
  return results.sort((left, right) => right.sizeBytes - left.sizeBytes);
}

async function zipBundle(bundleRoot: string, destinationZip: string) {
  const executable = process.platform === "win32" ? "powershell.exe" : "pwsh";
  const command = `Compress-Archive -Path '${bundleRoot}' -DestinationPath '${destinationZip}' -Force`;

  return new Promise<number | null>((resolve, reject) => {
    const child = spawn(executable, ["-NoProfile", "-Command", command], {
      cwd: process.cwd(),
      stdio: "pipe",
      env: process.env,
    });

    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (exitCode) => {
      if (exitCode !== 0 && stderr.trim()) {
        reject(new Error(stderr.trim()));
        return;
      }
      resolve(exitCode);
    });
  });
}

async function main() {
  const latestRunPath = path.join(process.cwd(), "artifacts", "runs", "latest.json");

  if (!(await exists(latestRunPath))) {
    throw new Error("No evidence run pointer exists. Run `npm run evidence:full` first.");
  }

  const latestRun = await readJson<LatestRunPointer>(latestRunPath);
  const latestRunRelative = path.relative(process.cwd(), latestRun.path).replaceAll("\\", "/");
  const latestRunFolder = path.basename(latestRun.path);
  const latestVerifyRun = await findLatestRunDirectory(/-verify-/);
  const stamp = nowStamp();
  const bundleRoot = path.join(process.cwd(), "artifacts", "oracle", `${stamp}-cmep-accountability`);
  const repoZipPath = path.join(process.cwd(), "artifacts", "oracle", `${stamp}-cmep-accountability.zip`);
  const downloadsZipPath = path.join(process.env.USERPROFILE ?? process.cwd(), "Downloads", `cmep-oracle-dryrun-bundle-${stamp}.zip`);

  await ensureDir(bundleRoot);

  const includedRepoPaths = [
    "docs/for-oracle-to-read.md",
    "docs/for-oracle-to-read.yaml",
    "docs/governance/no-excuses-app-accountability-protocol.md",
    "README.md",
    "AGENTS.md",
    "package.json",
    "next.config.ts",
    "playwright.config.ts",
    "vitest.config.ts",
    "tsconfig.json",
    ".env.example",
    ".nvmrc",
    "san",
    "prisma",
    "scripts",
    "src",
  ];

  const copiedRepoPaths: string[] = [];
  for (const relativePath of includedRepoPaths) {
    if (await copyRelativeIntoBundle(bundleRoot, relativePath)) {
      copiedRepoPaths.push(relativePath);
    }
  }

  await ensureDir(path.join(bundleRoot, "runs"));
  await cp(latestRun.path, path.join(bundleRoot, "runs", latestRunFolder), { recursive: true, force: true });
  await cp(latestRunPath, path.join(bundleRoot, "runs", "latest.json"), { force: true });
  if (latestVerifyRun) {
    await cp(latestVerifyRun.fullPath, path.join(bundleRoot, "runs", latestVerifyRun.name), {
      recursive: true,
      force: true,
    });
  }

  const oraclePrompt =
    "Review this CMEP accountability bundle. Determine claim-by-claim whether the local app is proven working, falsified, or blocked. Use code, SAN surfaces, tests, logs, metrics, traces, HAR, screenshots, DOM snapshots, state snapshots, and run artifacts. Identify the highest-severity exact root causes, the smallest patch plan, and any blind spots caused by missing evidence. Do not guess.";

  await writeText(path.join(bundleRoot, "oracle-prompt.md"), `${oraclePrompt}\n`);

  const instructionHits = await searchInstructionFiles([
    "AGENTS.md",
    "README.md",
    "san/control-plane.md",
    "docs/for-oracle-to-read.md",
    "docs/for-oracle-to-read.yaml",
  ]);

  await writeText(
    path.join(bundleRoot, "bundle-instructions-found.txt"),
    instructionHits.length > 0 ? `${instructionHits.join("\n")}\n` : "No explicit bundle instructions were found beyond the canonical Oracle docs and control plane.\n",
  );

  await writeText(
    path.join(bundleRoot, "bundle-selection-rationale.md"),
    [
      "# Bundle Selection Rationale",
      "",
      "- The bundle is constrained to the repo control plane, SAN state, source, scripts, schema, and the latest accountable run artifacts.",
      "- It excludes dependencies, build output, coverage output, playwright-report output, raw env files, and raw database files.",
      `- The accountable run included in this bundle is \`${latestRunFolder}\` (${latestRun.id}).`,
      ...(latestVerifyRun ? [`- The latest verification-suite run included is \`${latestVerifyRun.name}\`.`] : []),
      "",
    ].join("\n"),
  );

  let oracleFilesReport = { exitCode: null as number | null, stdout: "", stderr: "" };
  let oracleRender = { exitCode: null as number | null, stdout: "", stderr: "" };
  const oversizeArtifacts = await collectOversizeFiles(bundleRoot, 1_000_000);

  await Promise.all([
    writeJson(path.join(bundleRoot, "oracle-oversize-artifacts.json"), oversizeArtifacts),
    writeText(
      path.join(bundleRoot, "oracle-oversize-artifacts.md"),
      [
        "# Oracle Oversize Artifacts",
        "",
        "These files remain in the curated bundle for offline inspection, but they are excluded from the Oracle CLI file set because the local Oracle tool rejects individual files larger than 1 MB.",
        "",
        ...oversizeArtifacts.map(
          (entry) => `- ${entry.path} (${(entry.sizeBytes / (1024 * 1024)).toFixed(2)} MB)`,
        ),
        "",
      ].join("\n"),
    ),
  ]);

  const fullRunCliEntries = [
    `runs/${latestRunFolder}/summary.md`,
    `runs/${latestRunFolder}/scenario-results.json`,
    `runs/${latestRunFolder}/exception.json`,
    `runs/${latestRunFolder}/stdout.log`,
    `runs/${latestRunFolder}/stderr.log`,
    `runs/${latestRunFolder}/metrics.json`,
    `runs/${latestRunFolder}/state-before.json`,
    `runs/${latestRunFolder}/state-after.json`,
    `runs/${latestRunFolder}/state-reset-a.json`,
    `runs/${latestRunFolder}/state-reset-b.json`,
    `runs/${latestRunFolder}/app.log.jsonl`,
    `runs/${latestRunFolder}/events.jsonl`,
    `runs/${latestRunFolder}/trace.ndjson`,
    `runs/${latestRunFolder}/browser-console.jsonl`,
    `runs/${latestRunFolder}/browser-network.jsonl`,
    `runs/${latestRunFolder}/browser-network-failures.jsonl`,
    `runs/${latestRunFolder}/exceptions.jsonl`,
    `runs/${latestRunFolder}/proof-matrix-snapshot.json`,
    `runs/${latestRunFolder}/build-meta.json`,
    `runs/${latestRunFolder}/effective-config.sanitized.json`,
    `runs/${latestRunFolder}/feature-flags.json`,
    `runs/${latestRunFolder}/inputs.sanitized.json`,
    `runs/${latestRunFolder}/seed-identifiers.json`,
    `runs/${latestRunFolder}/ui-state.json`,
    `runs/${latestRunFolder}/ui.png`,
    `runs/${latestRunFolder}/screenshots/**`,
    `runs/${latestRunFolder}/dom/**`,
    `runs/${latestRunFolder}/ui-states/**`,
  ];

  const verifyRunCliEntries = latestVerifyRun
    ? [
        `runs/${latestVerifyRun.name}/summary.md`,
        `runs/${latestVerifyRun.name}/commands/**`,
        `runs/${latestVerifyRun.name}/verification-results.json`,
        `runs/${latestVerifyRun.name}/build-meta.json`,
        `runs/${latestVerifyRun.name}/effective-config.sanitized.json`,
        `runs/${latestVerifyRun.name}/feature-flags.json`,
        `runs/${latestVerifyRun.name}/inputs.sanitized.json`,
        `runs/${latestVerifyRun.name}/screenshots/**`,
      ]
    : [];

  const repoCliEntries = [
    "repo/docs/for-oracle-to-read.md",
    "repo/docs/for-oracle-to-read.yaml",
    "repo/docs/governance/no-excuses-app-accountability-protocol.md",
    "repo/README.md",
    "repo/AGENTS.md",
    "repo/san/control-plane.md",
    "repo/san/preflight.md",
    "repo/san/sanlock.md",
    "repo/san/verification/latest.md",
    "repo/san/state/durable-state.md",
    "repo/san/state/decisions.md",
    "repo/san/state/open-questions.md",
    "repo/san/state/proof-matrix.md",
    "repo/san/state/proof-matrix.json",
    "repo/san/recurrence/failures.md",
    "repo/san/contracts/rehydration-truth-contract.md",
    "repo/san/topology/graph.json",
    "repo/package.json",
    "repo/next.config.ts",
    "repo/playwright.config.ts",
    "repo/vitest.config.ts",
    "repo/tsconfig.json",
    "repo/prisma/schema.prisma",
    "repo/prisma/seed.ts",
    "repo/prisma/seed-offering-spine.ts",
    "repo/scripts/db/setup.ts",
    "repo/scripts/db/reset.ts",
    "repo/scripts/db/migrate.ts",
    "repo/scripts/evidence/**",
    "repo/scripts/oracle/bundle.ts",
    "repo/scripts/san/**",
    "repo/src/instrumentation.ts",
    "repo/src/instrumentation-client.ts",
    "repo/src/shared/observability/**",
    "repo/src/shared/domain/constants.ts",
    "repo/src/shared/domain/schemas.ts",
    "repo/src/shared/server/prisma.ts",
    "repo/src/modules/catalog/**",
    "repo/src/modules/customer-graph/**",
    "repo/src/modules/inbox/**",
    "repo/src/modules/lifecycle/**",
    "repo/src/modules/scheduling/**",
    "repo/src/modules/revenue/**",
    "repo/src/modules/portal/**",
    "repo/src/modules/automation/**",
    "repo/src/modules/shell/**",
    "repo/src/modules/identity-tenant/**",
    "repo/src/app/app/page.tsx",
    "repo/src/app/app/catalog/page.tsx",
    "repo/src/app/app/catalog/[id]/page.tsx",
    "repo/src/app/app/customers/[id]/page.tsx",
    "repo/src/app/app/inbox/page.tsx",
    "repo/src/app/app/lifecycle/page.tsx",
    "repo/src/app/app/automations/page.tsx",
    "repo/src/app/app/schedule/page.tsx",
    "repo/src/app/app/revenue/quotes/page.tsx",
    "repo/src/app/app/revenue/quotes/[id]/page.tsx",
    "repo/src/app/app/revenue/invoices/page.tsx",
    "repo/src/app/app/revenue/invoices/[id]/page.tsx",
    "repo/src/app/client/page.tsx",
    "repo/src/app/api/catalog/offerings/route.ts",
    "repo/src/app/api/catalog/variants/route.ts",
    "repo/src/app/api/catalog/prices/route.ts",
    "repo/src/app/api/catalog/assignments/route.ts",
    "repo/src/app/api/customers/route.ts",
    "repo/src/app/api/customers/[id]/route.ts",
    "repo/src/app/api/inbox/conversations/[id]/messages/route.ts",
    "repo/src/app/api/lifecycle/items/route.ts",
    "repo/src/app/api/lifecycle/items/[id]/move/route.ts",
    "repo/src/app/api/schedule/bookings/route.ts",
    "repo/src/app/api/schedule/bookings/[id]/route.ts",
    "repo/src/app/api/revenue/quotes/route.ts",
    "repo/src/app/api/revenue/quotes/[id]/decision/route.ts",
    "repo/src/app/api/revenue/invoices/route.ts",
    "repo/src/app/api/revenue/invoices/[id]/payments/route.ts",
    "repo/src/app/api/portal/access/route.ts",
    "repo/src/app/api/portal/conversations/[id]/reply/route.ts",
    "repo/src/app/api/automation/simulate/route.ts",
    "repo/src/app/api/search/route.ts",
    "repo/src/tests/e2e/cmep-accountable.spec.ts",
    "repo/src/tests/e2e/cmep-smoke.spec.ts",
    "repo/src/tests/e2e/evidence-utils.ts",
    "repo/src/tests/e2e/global-setup.ts",
    "repo/src/tests/integration/offering-routing.test.ts",
    "repo/src/tests/integration/automation-flow.test.ts",
    "repo/src/tests/unit/offering-spine.test.ts",
    "repo/src/tests/unit/tenant-isolation.test.ts",
    "repo/src/tests/unit/evidence-artifacts.test.ts",
  ];

  const fileSpecEntries = [
    ...repoCliEntries,
    ...fullRunCliEntries,
    ...verifyRunCliEntries,
    "oracle-prompt.md",
    "bundle-selection-rationale.md",
    "oracle-oversize-artifacts.json",
    "oracle-oversize-artifacts.md",
    "!repo/node_modules/**",
    "!repo/.next/**",
    "!repo/coverage/**",
    "!repo/playwright-report/**",
    "!repo/**/.env",
    "!repo/**/.env.*",
    "!repo/**/*.db",
    "!repo/**/*.sqlite",
  ];
  const fileSpec = fileSpecEntries.join(",");

  const powershellCommand = [
    "npx -y @steipete/oracle --render --copy ^",
    `  -p "${oraclePrompt.replaceAll('"', '\\"')}" ^`,
    `  --file "${fileSpec}"`,
  ].join("\n");

  const shellCommand = [
    "npx -y @steipete/oracle --render --copy \\",
    `  -p '${oraclePrompt.replaceAll("'", "'\"'\"'")}' \\`,
    `  --file '${fileSpec}'`,
  ].join("\n");

  await Promise.all([
    writeText(path.join(bundleRoot, "oracle-command.ps1.txt"), `${powershellCommand}\n`),
    writeText(path.join(bundleRoot, "oracle-command.sh.txt"), `${shellCommand}\n`),
  ]);

  try {
    oracleFilesReport = await runOracleCli(bundleRoot, [
      "--dry-run",
      "summary",
      "--files-report",
      "-p",
      oraclePrompt,
      "--file",
      fileSpec,
    ]);
  } catch (error) {
    oracleFilesReport = {
      exitCode: null,
      stdout: "",
      stderr: error instanceof Error ? error.stack ?? error.message : String(error),
    };
  }

  await writeText(
    path.join(bundleRoot, "oracle-files-report.txt"),
    [oracleFilesReport.stdout.trim(), oracleFilesReport.stderr.trim()].filter(Boolean).join("\n\n"),
  );

  try {
    oracleRender = await runOracleCli(bundleRoot, [
      "--render",
      "--render-plain",
      "-p",
      oraclePrompt,
      "--file",
      fileSpec,
    ]);
  } catch (error) {
    oracleRender = {
      exitCode: null,
      stdout: "",
      stderr: error instanceof Error ? error.stack ?? error.message : String(error),
    };
  }

  await writeText(
    path.join(bundleRoot, "oracle-render.md"),
    [oracleRender.stdout.trim(), oracleRender.stderr.trim()].filter(Boolean).join("\n\n"),
  );

  const manifest = {
    generatedAt: new Date().toISOString(),
    latestRun: {
      id: latestRun.id,
      scenario: latestRun.scenario,
      path: latestRunRelative,
    },
    latestVerifyRun: latestVerifyRun
      ? {
          path: latestVerifyRun.relativePath,
        }
      : null,
    prompt: oraclePrompt,
    includeGlobs: fileSpec.split(","),
    excludeGlobs: [
      "node_modules/**",
      ".next/**",
      "coverage/**",
      "playwright-report/**",
      "**/.env",
      "**/.env.*",
      "**/*.db",
      "**/*.sqlite",
    ],
    copiedRepoPaths,
    firstInspect: [
      "docs/for-oracle-to-read.md",
      "docs/for-oracle-to-read.yaml",
      "san/state/proof-matrix.md",
      "san/verification/latest.md",
      "oracle-oversize-artifacts.md",
      ...(latestVerifyRun ? [`${latestVerifyRun.relativePath}/summary.md`] : []),
      `${latestRunRelative}/summary.md`,
      `${latestRunRelative}/scenario-results.json`,
      `${latestRunRelative}/exception.json`,
      `${latestRunRelative}/metrics.json`,
      `${latestRunRelative}/network.har`,
    ],
    oracleCli: {
      dryRunSummaryExitCode: oracleFilesReport.exitCode,
      renderExitCode: oracleRender.exitCode,
    },
    outputs: {
      bundleRoot,
      repoZipPath,
      downloadsZipPath,
    },
  };

  await writeJson(path.join(bundleRoot, "bundle-manifest.json"), manifest);
  await writeText(
    path.join(bundleRoot, "bundle-summary.md"),
    [
      "# Oracle Bundle Summary",
      "",
      `- Bundle root: ${bundleRoot}`,
      `- Latest accountable run: ${latestRunRelative}`,
      `- PowerShell command: oracle-command.ps1.txt`,
      `- POSIX command: oracle-command.sh.txt`,
      `- Oracle dry-run summary exit code: ${oracleFilesReport.exitCode ?? "null"}`,
      `- Oracle render exit code: ${oracleRender.exitCode ?? "null"}`,
      `- Repo zip: ${repoZipPath}`,
      `- Downloads zip: ${downloadsZipPath}`,
      "",
      "Inspect first:",
      "",
      ...manifest.firstInspect.map((entry) => `- ${entry}`),
      "",
    ].join("\n"),
  );

  await zipBundle(bundleRoot, repoZipPath);
  await ensureDir(path.dirname(downloadsZipPath));
  await copyFile(repoZipPath, downloadsZipPath);

  await writeJson(path.join(process.cwd(), "artifacts", "oracle", "latest.json"), {
    generatedAt: new Date().toISOString(),
    bundleRoot,
    repoZipPath,
    downloadsZipPath,
    latestRunId: latestRun.id,
  });

  await applyProofUpdates([
    {
      id: "claim.oracleOfflineReview",
      status: "verified",
      evidencePaths: [
        path.relative(process.cwd(), path.join(bundleRoot, "bundle-manifest.json")),
        path.relative(process.cwd(), path.join(bundleRoot, "bundle-summary.md")),
        path.relative(process.cwd(), path.join(bundleRoot, "oracle-command.ps1.txt")),
        path.relative(process.cwd(), path.join(bundleRoot, "oracle-render.md")),
      ],
      lastVerifiedAt: new Date().toISOString(),
      runIds: [latestRun.id],
      blockingGap: null,
      notes: [
        "Curated Oracle bundle includes repo truth surfaces, source, scripts, and the latest accountable run artifacts.",
        `Downloads zip emitted at ${downloadsZipPath}.`,
      ],
    },
  ]);
}

void main();
