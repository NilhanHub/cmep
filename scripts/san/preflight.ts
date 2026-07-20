import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..", "..");
const requiredFiles = [
  "AGENTS.md",
  "san/control-plane.md",
  "san/state/durable-state.md",
  "san/preflight.md",
  "san/sanlock.md",
  "san/topology/graph.json",
  "san/contracts/rehydration-truth-contract.md",
  "san/verification/latest.md",
];

const missing = requiredFiles.filter((file) => !existsSync(path.join(repoRoot, file)));

if (missing.length > 0) {
  console.error("SAN preflight failed. Missing files:");
  for (const file of missing) {
    console.error(`- ${file}`);
  }
  process.exit(1);
}

const graph = JSON.parse(readFileSync(path.join(repoRoot, "san/topology/graph.json"), "utf8"));
if (!graph.authoritative || !Array.isArray(graph.nodes) || graph.nodes.length < 10) {
  console.error("SAN preflight failed. Topology graph is missing required authority or node coverage.");
  process.exit(1);
}

console.log("SAN preflight passed.");
