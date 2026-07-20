import { spawn, type ChildProcessWithoutNullStreams, execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile, appendFile, cp, stat } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { getFeatureManifest } from "@/shared/observability/runtime";
import { stableHash } from "@/shared/observability/sanitize";

export type RunContext = {
  id: string;
  scenario: string;
  createdAt: string;
  rootDir: string;
  screenshotsDir: string;
  videosDir: string;
  commandsDir: string;
};

function powershellCommand() {
  return process.platform === "win32" ? "powershell.exe" : "pwsh";
}

function repoCliPath(...segments: string[]) {
  return path.join(process.cwd(), ...segments);
}

export function tsxCli(scriptPath: string, args: string[] = []) {
  return {
    command: process.execPath,
    args: [repoCliPath("node_modules", "tsx", "dist", "cli.cjs"), scriptPath, ...args],
  };
}

export function nextCli(args: string[]) {
  return {
    command: process.execPath,
    args: [repoCliPath("node_modules", "next", "dist", "bin", "next"), ...args],
  };
}

export function playwrightCli(args: string[]) {
  return {
    command: process.execPath,
    args: [repoCliPath("node_modules", "@playwright", "test", "cli.js"), ...args],
  };
}

function resolveNodeCli(command: string, args: string[]) {
  if (process.platform !== "win32") {
    return { command, args };
  }

  const executableName = command.toLowerCase();
  const nodeDir = path.dirname(process.execPath);

  if (executableName === "npm.cmd" || executableName === "npm") {
    return {
      command: process.execPath,
      args: [path.join(nodeDir, "node_modules", "npm", "bin", "npm-cli.js"), ...args],
    };
  }

  if (executableName === "npx.cmd" || executableName === "npx") {
    return {
      command: process.execPath,
      args: [path.join(nodeDir, "node_modules", "npm", "bin", "npx-cli.js"), ...args],
    };
  }

  return { command, args };
}

function sanitizeSpawnEnv(env: NodeJS.ProcessEnv) {
  return Object.fromEntries(
    Object.entries(env).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
  ) as NodeJS.ProcessEnv;
}

function spawnForWorkspace(command: string, args: string[], env: NodeJS.ProcessEnv) {
  const resolved = resolveNodeCli(command, args);

  return spawn(resolved.command, resolved.args, {
    cwd: process.cwd(),
    env: sanitizeSpawnEnv(env),
    stdio: "pipe",
  });
}

export async function ensureDirectory(target: string) {
  await mkdir(target, { recursive: true });
}

export async function writeJson(target: string, value: unknown) {
  await ensureDirectory(path.dirname(target));
  await writeFile(target, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export async function writeText(target: string, value: string) {
  await ensureDirectory(path.dirname(target));
  await writeFile(target, value, "utf8");
}

export async function appendText(target: string, value: string) {
  await ensureDirectory(path.dirname(target));
  await appendFile(target, value, "utf8");
}

export function createRunContext(scenario: string): RunContext {
  const createdAt = new Date().toISOString();
  const stamp = createdAt.replaceAll(":", "").replaceAll("-", "").replace(/\.\d+Z$/, "Z").replace("T", "-");
  const id = `${scenario}-${randomUUID().slice(0, 8)}`;
  const rootDir = path.join(process.cwd(), "artifacts", "runs", `${stamp}-${scenario}-${id}`);

  return {
    id,
    scenario,
    createdAt,
    rootDir,
    screenshotsDir: path.join(rootDir, "screenshots"),
    videosDir: path.join(rootDir, "videos"),
    commandsDir: path.join(rootDir, "commands"),
  };
}

export async function initializeRunContext(run: RunContext, inputs: Record<string, unknown>) {
  await Promise.all([
    ensureDirectory(run.rootDir),
    ensureDirectory(run.screenshotsDir),
    ensureDirectory(run.videosDir),
    ensureDirectory(run.commandsDir),
  ]);

  const gitRevision = getGitRevision();
  const gitDirty = isGitDirty();
  const appVersion = JSON.parse(await readFile(path.join(process.cwd(), "package.json"), "utf8")).version as string;
  const configFingerprint = stableHash(
    JSON.stringify({
      node: process.version,
      appVersion,
      gitRevision,
      gitDirty,
      featureManifest: getFeatureManifest(),
      env: {
        NODE_ENV: process.env.NODE_ENV ?? "development",
      },
    }),
  );

  await Promise.all([
    writeJson(path.join(run.rootDir, "inputs.sanitized.json"), inputs),
    writeJson(path.join(run.rootDir, "effective-config.sanitized.json"), {
      nodeVersion: process.version,
      platform: process.platform,
      appVersion,
      gitRevision,
      gitDirty,
      configFingerprint,
      env: {
        NODE_ENV: process.env.NODE_ENV ?? "development",
      },
    }),
    writeJson(path.join(run.rootDir, "build-meta.json"), {
      appVersion,
      buildId: run.id,
      gitRevision,
      gitDirty,
      createdAt: run.createdAt,
    }),
    writeJson(path.join(run.rootDir, "feature-flags.json"), getFeatureManifest()),
  ]);

  return { appVersion, gitRevision, gitDirty, configFingerprint };
}

export function getGitRevision() {
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "unknown";
  }
}

export function isGitDirty() {
  try {
    return execFileSync("git", ["status", "--porcelain"], {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim().length > 0;
  } catch {
    return false;
  }
}

export async function updateLatestRunPointer(run: RunContext, extra: Record<string, unknown> = {}) {
  await writeJson(path.join(process.cwd(), "artifacts", "runs", "latest.json"), {
    id: run.id,
    scenario: run.scenario,
    createdAt: run.createdAt,
    path: run.rootDir,
    ...extra,
  });
}

export async function runCommandCapture(
  run: RunContext,
  name: string,
  command: string,
  args: string[],
  env: NodeJS.ProcessEnv = process.env,
) {
  await ensureDirectory(run.commandsDir);
  const stdoutPath = path.join(run.commandsDir, `${name}.stdout.log`);
  const stderrPath = path.join(run.commandsDir, `${name}.stderr.log`);

  return new Promise<{ exitCode: number | null; stdoutPath: string; stderrPath: string }>((resolve, reject) => {
    const child = spawnForWorkspace(command, args, env);

    const stdoutStream = appendFile(stdoutPath, "");
    const stderrStream = appendFile(stderrPath, "");
    void stdoutStream;
    void stderrStream;

    child.stdout.on("data", (chunk) => {
      void appendText(stdoutPath, chunk.toString());
    });

    child.stderr.on("data", (chunk) => {
      void appendText(stderrPath, chunk.toString());
    });

    child.on("error", reject);
    child.on("close", (exitCode) => {
      resolve({ exitCode, stdoutPath, stderrPath });
    });
  });
}

export async function startAppServer(run: RunContext, port: number, env: NodeJS.ProcessEnv) {
  const stdoutPath = path.join(run.rootDir, "stdout.log");
  const stderrPath = path.join(run.rootDir, "stderr.log");
  await Promise.all([writeText(stdoutPath, ""), writeText(stderrPath, "")]);

  const start = nextCli(["start", "--port", String(port)]);
  const child = spawnForWorkspace(start.command, start.args, env);

  child.stdout.on("data", (chunk) => {
    void appendText(stdoutPath, chunk.toString());
  });

  child.stderr.on("data", (chunk) => {
    void appendText(stderrPath, chunk.toString());
  });

  await waitForHttp(`http://localhost:${port}/app`, 120_000);

  return child;
}

export async function stopProcess(child: ChildProcessWithoutNullStreams) {
  if (child.killed) return;

  if (process.platform === "win32" && child.pid) {
    await new Promise<void>((resolve) => {
      const killer = spawn(powershellCommand(), ["-NoProfile", "-Command", `taskkill /PID ${child.pid} /T /F`], {
        stdio: "ignore",
      });
      killer.on("close", () => resolve());
      killer.on("error", () => resolve());
    });
    return;
  }

  child.kill("SIGTERM");
}

export async function waitForHttp(url: string, timeoutMs: number) {
  const started = Date.now();
  let lastError: unknown;

  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch (error) {
      lastError = error;
    }

    await new Promise((resolve) => setTimeout(resolve, 1_500));
  }

  throw lastError ?? new Error(`Timed out waiting for ${url}`);
}

export async function copyIfExists(source: string, destination: string) {
  try {
    await stat(source);
    await ensureDirectory(path.dirname(destination));
    await cp(source, destination, { recursive: true, force: true });
    return true;
  } catch {
    return false;
  }
}
