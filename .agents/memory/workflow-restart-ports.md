---
name: Workflow restart ports
description: Recovering the Rawand Decoration CRM workflows when managed restarts hit address-in-use errors.
---
The web and API workflows can fail to restart when an older Vite or Node process still owns the assigned port. The failure is environmental, not necessarily a source-code failure.

**Why:** Restarting the managed workflow repeatedly without clearing the stale process leaves the preview unavailable and obscures the actual application state.

**How to apply:** Check the assigned web and API ports, stop only the stale processes bound to those ports, then restart the existing managed workflows and inspect fresh logs.