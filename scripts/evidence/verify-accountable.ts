import path from "node:path";

import { createRunContext, initializeRunContext, runCommandCapture, writeJson, writeText } from "./lib";

type VerificationCommand = {
  name: string;
  command: string;
  args: string[];
};

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const verificationCommands: VerificationCommand[] = [
  { name: "lint", command: npmCommand, args: ["run", "lint"] },
  { name: "typecheck", command: npmCommand, args: ["run", "typecheck"] },
  { name: "build", command: npmCommand, args: ["run", "build"] },
  { name: "test", command: npmCommand, args: ["run", "test"] },
  { name: "test-e2e", command: npmCommand, args: ["run", "test:e2e"] },
  { name: "san-preflight", command: npmCommand, args: ["run", "san:preflight"] },
  { name: "san-lock", command: npmCommand, args: ["run", "san:lock"] },
  { name: "san-graph-validate", command: npmCommand, args: ["run", "san:graph:validate"] },
  { name: "evidence-catalog", command: npmCommand, args: ["run", "evidence:catalog"] },
  { name: "evidence-full", command: npmCommand, args: ["run", "evidence:full"] },
];

async function main() {
  const run = createRunContext("verify");
  await initializeRunContext(run, {
    scenario: "verify-accountable",
    commands: verificationCommands.map((entry) => `${entry.command} ${entry.args.join(" ")}`),
  });

  const results = [];

  for (const entry of verificationCommands) {
    const result = await runCommandCapture(run, entry.name, entry.command, entry.args);
    results.push({
      name: entry.name,
      exitCode: result.exitCode,
      stdoutPath: path.relative(process.cwd(), result.stdoutPath),
      stderrPath: path.relative(process.cwd(), result.stderrPath),
    });

    if (result.exitCode !== 0) {
      break;
    }
  }

  const failed = results.find((entry) => entry.exitCode !== 0) ?? null;

  await writeJson(path.join(run.rootDir, "verification-results.json"), {
    createdAt: run.createdAt,
    runId: run.id,
    failedCommand: failed?.name ?? null,
    results,
  });

  await writeText(
    path.join(run.rootDir, "summary.md"),
    [
      `# Accountable Verification ${run.id}`,
      "",
      `- Created: ${run.createdAt}`,
      `- Status: ${failed ? `failed at ${failed.name}` : "pass"}`,
      "",
      "## Commands",
      "",
      ...results.map(
        (entry) =>
          `- \`${entry.name}\` -> ${entry.exitCode === 0 ? "pass" : `fail (${entry.exitCode ?? "no-exit"})`} (${entry.stdoutPath})`,
      ),
      "",
    ].join("\n"),
  );

  if (failed) {
    process.exit(failed.exitCode ?? 1);
  }
}

void main();
