---
name: OpenAPI date responses
description: Preserve date-only wire values when generated Zod schemas coerce OpenAPI date fields into Date objects.
---

For response fields declared as `type: string, format: date`, validate through the generated schema but serialize the original date-only value, or normalize parsed `Date` values back to `YYYY-MM-DD` before sending JSON.

**Why:** Generated Zod schemas coerce valid date strings into `Date` objects. Passing the parsed value directly to `res.json` silently changes the wire format to a full ISO timestamp and breaks parity with other runtimes that honor the OpenAPI date-only contract.

**How to apply:** Check every new report or endpoint with date-only response fields, especially when Express and PHP implementations must return matching JSON.