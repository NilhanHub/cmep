import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type ProofStatus = "unverified" | "verified" | "falsified" | "blocked";

export type ProofEntry = {
  id: string;
  claim: string;
  status: ProofStatus;
  evidencePaths: string[];
  lastVerifiedAt: string | null;
  runIds: string[];
  blockingGap: string | null;
  notes: string[];
};

export type ProofMatrix = {
  generatedAt: string;
  entries: ProofEntry[];
};

const proofMatrixJsonPath = path.join(process.cwd(), "san", "state", "proof-matrix.json");
const proofMatrixMarkdownPath = path.join(process.cwd(), "san", "state", "proof-matrix.md");

const canonicalClaims: Array<{ id: string; claim: string }> = [
  {
    id: "claim.boot.local",
    claim: "The app boots locally on this PC from a clean-ish repo state using documented commands.",
  },
  {
    id: "claim.surfaces.endToEnd",
    claim: "The 7 CMEP v1 surfaces work end-to-end locally across the accountable happy path.",
  },
  {
    id: "claim.tenantIsolation",
    claim: "Tenant isolation holds across the main read/write paths.",
  },
  {
    id: "claim.portalScoping",
    claim: "Portal/client scoping does not leak cross-client or cross-tenant data.",
  },
  {
    id: "claim.dbDeterminism",
    claim: "The Windows-local DB bootstrap/reset path is deterministic enough for repeatable verification.",
  },
  {
    id: "claim.runtimeIntegrity",
    claim: "There are no silent runtime blockers, hidden hydration problems, or dead critical controls in the primary flows.",
  },
  {
    id: "claim.oracleOfflineReview",
    claim: "Oracle can review the repo and a run bundle offline, without guesswork, and determine what happened.",
  },
  {
    id: "claim.offeringSpine",
    claim: "CMEP has a first-class offering/catalog spine and the core business flows route through it end-to-end.",
  },
];

function buildDefaultMatrix(): ProofMatrix {
  return {
    generatedAt: new Date().toISOString(),
    entries: canonicalClaims.map((claim) => ({
      ...claim,
      status: "unverified",
      evidencePaths: [],
      lastVerifiedAt: null,
      runIds: [],
      blockingGap: "Evidence has not been emitted yet.",
      notes: [],
    })),
  };
}

function renderMarkdown(matrix: ProofMatrix) {
  const lines = [
    "# Proof Matrix",
    "",
    `Generated: ${matrix.generatedAt}`,
    "",
    "| Claim ID | Status | Last Verified | Run IDs | Evidence | Blocking Gap |",
    "| --- | --- | --- | --- | --- | --- |",
  ];

  for (const entry of matrix.entries) {
    lines.push(
      `| ${entry.id} | ${entry.status} | ${entry.lastVerifiedAt ?? "-"} | ${entry.runIds.join(", ") || "-"} | ${entry.evidencePaths.join("<br>") || "-"} | ${entry.blockingGap ?? "-"} |`,
    );

    if (entry.notes.length > 0) {
      lines.push(`|  | notes |  |  | ${entry.notes.join("<br>")} |  |`);
    }
  }

  return `${lines.join("\n")}\n`;
}

export async function readProofMatrix(): Promise<ProofMatrix> {
  try {
    const value = await readFile(proofMatrixJsonPath, "utf8");
    return JSON.parse(value) as ProofMatrix;
  } catch {
    return buildDefaultMatrix();
  }
}

export async function writeProofMatrix(matrix: ProofMatrix) {
  matrix.generatedAt = new Date().toISOString();
  await mkdir(path.dirname(proofMatrixJsonPath), { recursive: true });
  await Promise.all([
    writeFile(proofMatrixJsonPath, `${JSON.stringify(matrix, null, 2)}\n`, "utf8"),
    writeFile(proofMatrixMarkdownPath, renderMarkdown(matrix), "utf8"),
  ]);
}

export async function ensureProofMatrix() {
  const matrix = reconcileProofMatrix(await readProofMatrix());
  await writeProofMatrix(matrix);
  return matrix;
}

function reconcileProofMatrix(matrix: ProofMatrix): ProofMatrix {
  const entryById = new Map(matrix.entries.map((entry) => [entry.id, entry]));

  return {
    ...matrix,
    entries: canonicalClaims.map((claim) => {
      const existing = entryById.get(claim.id);
      if (!existing) {
        return {
          ...claim,
          status: "unverified" as const,
          evidencePaths: [],
          lastVerifiedAt: null,
          runIds: [],
          blockingGap: "Evidence has not been emitted yet.",
          notes: [],
        };
      }

      return {
        ...existing,
        claim: claim.claim,
      };
    }),
  };
}

export async function applyProofUpdates(
  updates: Array<Partial<ProofEntry> & Pick<ProofEntry, "id">>,
) {
  const matrix = reconcileProofMatrix(await readProofMatrix());

  for (const update of updates) {
    const entry = matrix.entries.find((candidate) => candidate.id === update.id);
    if (!entry) continue;

    entry.status = update.status ?? entry.status;
    entry.evidencePaths = update.evidencePaths ?? entry.evidencePaths;
    entry.lastVerifiedAt = update.lastVerifiedAt ?? entry.lastVerifiedAt;
    entry.runIds = update.runIds ?? entry.runIds;
    if ("blockingGap" in update) {
      entry.blockingGap = update.blockingGap ?? null;
    }
    entry.notes = update.notes ?? entry.notes;
  }

  await writeProofMatrix(matrix);
  return matrix;
}
