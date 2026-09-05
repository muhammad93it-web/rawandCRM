---
name: cPanel subdomain isolation
description: Deployment boundary between the legacy PHP site and the CRM on Namecheap cPanel
---

The legacy public site and the CRM must use separate cPanel document roots. The main site can contain PHP `index.php` routing, so an accidentally uploaded static `index.html` can take precedence and make the main domain appear to be the CRM. The CRM belongs under its own subdomain document root, with its API files inside that root and its PHP application/config outside the public directory.

**Why:** Shared hosting chooses document indexes before application routing, and cPanel can provision a new subdomain/vhost asynchronously. Uploading CRM files into the existing domain root caused the public site to be replaced until the stray static files were removed and the subdomain vhost finished provisioning.

**How to apply:** Before any CRM upload, confirm the target directory from cPanel's subdomain listing. Restore or verify the legacy root homepage separately, test both hostnames over HTTPS, and allow time for the subdomain certificate/vhost to become active before diagnosing a default-page response.