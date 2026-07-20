# No-Excuses App Accountability Protocol Reference

This repository applies the No-Excuses App Accountability Protocol as a governance and audit overlay. It does not replace the SAN control plane; it sharpens how this repo proves runtime truth.

Repo-local application:

- Claims must map to emitted evidence in `san/state/proof-matrix.md` and `san/state/proof-matrix.json`.
- Serious verification runs must emit protocol-compliant run folders under `artifacts/runs/`.
- Accountable runs must capture logs, traces, metrics, exceptions, state snapshots, network evidence, and UI evidence.
- Oracle handoff must be possible from repo artifacts plus curated bundle contents alone.
- Missing observability is treated as an engineering defect to fix, not as a narration caveat.

Canonical linkage:

- SAN doctrine entrypoint: `AGENTS.md`
- SAN control plane: `san/control-plane.md`
- Oracle instruction surface: `docs/for-oracle-to-read.md`
- Proof matrix: `san/state/proof-matrix.md`
