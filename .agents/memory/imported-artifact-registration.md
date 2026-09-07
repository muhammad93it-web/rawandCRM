---
name: Imported artifact registration
description: How to get pre-existing artifact.toml files (from a GitHub import) registered as artifacts with managed workflows.
---

Artifact directories that arrive with an existing `.replit-artifact/artifact.toml` (for example after a GitHub import) are not discovered automatically: `listArtifacts()` stays empty and no managed workflows exist. Re-submitting each unchanged `artifact.toml` through `verifyAndReplaceArtifactToml` (temp copy → real path) triggers the rescan, registers the artifacts, and creates the `artifacts/<slug>: <service>` workflows.

**Why:** The artifact watcher scans once at init and on explicit rescans; `createArtifact` cannot be used because it refuses an existing slug directory.

**How to apply:** After an import (or whenever `listArtifacts()` disagrees with the `artifacts/` tree), run the verify-and-replace round trip for every artifact before trying to start workflows; do not hand-configure replacement workflows.
