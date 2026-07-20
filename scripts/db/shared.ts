import "dotenv/config";

import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

export const repoRoot = path.resolve(__dirname, "..", "..");
const prismaDir = path.join(repoRoot, "prisma");
const schemaSqlPath = path.join(prismaDir, "schema.sql");

function requireDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set.");
  }

  return databaseUrl;
}

export function resolveDatabasePath() {
  const databaseUrl = requireDatabaseUrl();

  if (!databaseUrl.startsWith("file:")) {
    throw new Error(`Only sqlite file DATABASE_URL values are supported. Received: ${databaseUrl}`);
  }

  const relativePart = databaseUrl.slice("file:".length);
  const resolved = path.resolve(prismaDir, relativePart);
  mkdirSync(path.dirname(resolved), { recursive: true });
  return resolved;
}

function openDatabase(dbPath: string) {
  return new DatabaseSync(dbPath);
}

export function hasSchema(dbPath = resolveDatabasePath()) {
  if (!existsSync(dbPath)) {
    return false;
  }

  const db = openDatabase(dbPath);
  try {
    const row = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'Tenant'")
      .get() as { name?: string } | undefined;

    return row?.name === "Tenant";
  } finally {
    db.close();
  }
}

export function applySchema(dbPath = resolveDatabasePath()) {
  const sql = readFileSync(schemaSqlPath, "utf8");
  const db = openDatabase(dbPath);

  try {
    db.exec("PRAGMA foreign_keys = ON;");
    db.exec(sql);
  } finally {
    db.close();
  }
}

export function exportSchemaSql() {
  execSync(
    "npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > prisma/schema.sql",
    {
      cwd: repoRoot,
      stdio: "inherit",
    },
  );
}

export function seedDatabase() {
  execSync("npx prisma db seed", {
    cwd: repoRoot,
    stdio: "inherit",
  });
}

export function deleteDatabaseFiles(dbPath = resolveDatabasePath()) {
  const sleep = (milliseconds: number) => {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);
  };

  const removeWithRetry = (target: string) => {
    const maxAttempts = process.platform === "win32" ? 8 : 1;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        rmSync(target, { force: true });
        return;
      } catch (error) {
        const code = typeof error === "object" && error !== null && "code" in error ? (error as { code?: string }).code : undefined;
        const retryable = code === "EBUSY" || code === "EPERM";
        if (!retryable || attempt === maxAttempts) {
          throw error;
        }
        sleep(150 * attempt);
      }
    }
  };

  for (const suffix of ["", "-journal", "-shm", "-wal"]) {
    const target = `${dbPath}${suffix}`;
    if (existsSync(target)) {
      removeWithRetry(target);
    }
  }
}
