import "server-only";

import { mkdir, readFile, writeFile, appendFile } from "node:fs/promises";
import path from "node:path";

type JsonValue = Record<string, unknown> | Array<unknown> | string | number | boolean | null;

let writeQueue = Promise.resolve();

function queueWrite<T>(work: () => Promise<T>) {
  const next = writeQueue.then(work, work);
  writeQueue = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

export function getRunDirectory() {
  const runDirectory = process.env.CMEP_RUN_DIR ?? null;
  if (!runDirectory) return null;

  if (process.env.CMEP_RUN_DIR_ALLOW_ABSOLUTE === "true" || process.env.NODE_ENV === "test") {
    return runDirectory;
  }

  return path.join(/* turbopackIgnore: true */ process.cwd(), "artifacts", "runs", path.basename(runDirectory));
}

function getArtifactPath(name: string) {
  const runDirectory = getRunDirectory();
  if (!runDirectory) return null;
  // Runtime evidence is written outside the application bundle. Prevent
  // Turbopack's file tracer from treating an operator-selected run directory
  // as a build-time asset glob over the entire project.
  return path.join(/* turbopackIgnore: true */ runDirectory, name);
}

async function ensureArtifactDirectory(name: string) {
  const artifactPath = getArtifactPath(name);
  if (!artifactPath) return null;
  await mkdir(/* turbopackIgnore: true */ path.dirname(artifactPath), { recursive: true });
  return artifactPath;
}

export async function appendJsonLine(name: string, value: JsonValue) {
  const artifactPath = await ensureArtifactDirectory(name);
  if (!artifactPath) return;

  await queueWrite(async () => {
    await appendFile(
      /* turbopackIgnore: true */ artifactPath,
      `${JSON.stringify(value)}\n`,
      "utf8",
    );
  });
}

export async function writeArtifactJson(name: string, value: JsonValue) {
  const artifactPath = await ensureArtifactDirectory(name);
  if (!artifactPath) return;

  await queueWrite(async () => {
    await writeFile(
      /* turbopackIgnore: true */ artifactPath,
      `${JSON.stringify(value, null, 2)}\n`,
      "utf8",
    );
  });
}

export async function writeArtifactText(name: string, value: string) {
  const artifactPath = await ensureArtifactDirectory(name);
  if (!artifactPath) return;

  await queueWrite(async () => {
    await writeFile(/* turbopackIgnore: true */ artifactPath, value, "utf8");
  });
}

export async function readArtifactJson<T>(name: string): Promise<T | null> {
  const artifactPath = getArtifactPath(name);
  if (!artifactPath) return null;

  try {
    const value = await readFile(/* turbopackIgnore: true */ artifactPath, "utf8");
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}
