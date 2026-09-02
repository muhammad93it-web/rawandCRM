---
name: OpenAPI JSON field codegen
description: A codegen edge case for required arbitrary JSON values in OpenAPI contracts.
---

When an OpenAPI schema uses an arbitrary JSON field declared as `{}`, Orval's generated TypeScript input can expose that field as optional even if the property appears in the schema's required list. The generated Zod validator may still require it at runtime.

**Why:** This mismatch caused a compile-time failure at a database insert boundary after the contract itself validated successfully.

**How to apply:** For required arbitrary JSON values, validate with the generated Zod schema and explicitly normalize the value before passing it to a typed database insert. Do not weaken the database requirement just to satisfy generated types.