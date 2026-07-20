import { runEvidenceScenario } from "./run";

async function main() {
  await runEvidenceScenario({
    scenario: "smoke",
    segment: "smoke",
    updateProof: false,
  });
}

void main();
