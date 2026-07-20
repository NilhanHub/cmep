import { readFileSync } from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..", "..");
const graph = JSON.parse(readFileSync(path.join(repoRoot, "san/topology/graph.json"), "utf8"));

const overloaded = graph.nodes.filter((node: { effectiveLoad: { percent: number }; id: string }) => node.effectiveLoad.percent > 5);

if (overloaded.length > 0) {
  console.error("SANLOCK failed. Nodes over the review threshold:");
  for (const node of overloaded) {
    console.error(`- ${node.id}`);
  }
  process.exit(1);
}

console.log("SANLOCK passed.");
