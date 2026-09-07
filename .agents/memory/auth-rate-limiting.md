---
name: Authentication rate limiting
description: Login throttling must isolate per-account lockout from broader IP abuse protection.
---

Per-account failed-login lockout and IP-level abuse throttling use different thresholds. A low account threshold protects a username without allowing one bad username to deny service to every user behind the same NAT address.

**Why:** Testing showed that counting username and IP failures together at the same low threshold blocked the real administrator after harmless invalid-username tests from the same address.

**How to apply:** Keep the account threshold small and the IP threshold substantially higher; ensure successful login still works after another username reaches its account threshold.