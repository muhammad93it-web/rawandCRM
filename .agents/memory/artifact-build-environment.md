---
name: Artifact build environment
description: Environment variables required by the Rawand Decoration CRM frontend build.
---
The frontend Vite configuration intentionally fails fast unless both `PORT` and `BASE_PATH` are present. The managed web workflow supplies these values, but a direct shell build must provide them explicitly.

**Why:** A shell build without the workflow environment can look like a code failure even though the running preview is healthy.

**How to apply:** When validating a direct frontend production build, use the workflow port and the artifact preview base path; do not weaken the fail-fast configuration just to make an ad-hoc shell command pass.