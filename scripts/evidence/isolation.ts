import { runEvidenceScenario } from "./run";

async function main() {
  await runEvidenceScenario({
    scenario: "isolation",
    segment: "isolation",
    updateProof: false,
  });
}

void main();
