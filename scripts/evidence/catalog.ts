import { runEvidenceScenario } from "./run";

async function main() {
  await runEvidenceScenario({
    scenario: "catalog",
    segment: "catalog",
    updateProof: true,
  });
}

void main();
