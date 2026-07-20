import { readFileSync } from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..", "..");
const graph = JSON.parse(readFileSync(path.join(repoRoot, "san/topology/graph.json"), "utf8"));

if (!graph.authoritative) {
  throw new Error("Topology graph must be authoritative.");
}

const nodeIds = new Set<string>(graph.nodes.map((node: { id: string }) => node.id));
for (const edge of graph.edges as Array<{ from: string; to: string }>) {
  if (!nodeIds.has(edge.from) || !nodeIds.has(edge.to)) {
    throw new Error(`Invalid topology edge ${edge.from} -> ${edge.to}`);
  }
}

console.log("Topology graph validated.");
