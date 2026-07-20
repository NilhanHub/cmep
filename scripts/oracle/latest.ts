import { readFile } from "node:fs/promises";
import path from "node:path";

async function main() {
  const latestPath = path.join(process.cwd(), "artifacts", "oracle", "latest.json");
  const latest = JSON.parse(await readFile(latestPath, "utf8")) as {
    bundleRoot: string;
    repoZipPath: string;
    downloadsZipPath: string;
    latestRunId: string;
  };

  console.log(JSON.stringify(latest, null, 2));
}

void main();
