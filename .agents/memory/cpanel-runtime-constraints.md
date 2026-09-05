---
name: cPanel runtime constraints
description: Namecheap cPanel environment constraints discovered while preparing the Rawand Decoration CRM release.
---

The target cPanel account exposes MariaDB databases but does not expose the NodeJSSelector or MultiPHP cPanel API modules. Treat it as a Node-free PHP/PDO hosting target unless a later cPanel inspection proves otherwise.

**Why:** The current Express/PostgreSQL runtime cannot be uploaded and started unchanged on this account, so the external release needs a PHP/MariaDB implementation while the Replit development runtime remains unchanged.

**How to apply:** Keep the React build same-origin with a PHP `/api` front controller, keep deployment files separate from the Replit artifact, and do not upload or change DNS without explicit approval.