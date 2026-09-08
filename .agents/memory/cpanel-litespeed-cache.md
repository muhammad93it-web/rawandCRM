---
name: cPanel LiteSpeed cache
description: Host-cache behavior observed while deploying the Rawand CRM to shared cPanel.
---

The shared cPanel host can continue serving an older PHP/static response after Fileman reports a successful overwrite. Query-string cache busting, `Cache-Control` request headers, and a normal asset overwrite may not invalidate the served response.

**Why:** During a live login fix, cPanel's stored `index.html` and assets were newer than the response returned by the public subdomain; the public user-list request continued returning the old authentication behavior.

**How to apply:** Before declaring a cPanel static/API release live, use the host's actual LiteSpeed/PHP cache purge or restart mechanism, then verify the public response content and API behavior from outside the host. Do not assume a successful Fileman upload is sufficient.