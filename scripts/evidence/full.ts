import { runEvidenceScenario } from "./run";

async function main() {
  await runEvidenceScenario({
    scenario: "full",
    segment: "full",
    updateProof: true,
  });
}

void main();
