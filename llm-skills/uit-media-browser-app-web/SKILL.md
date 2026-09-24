---
name: uit-media-browser-app-web
description: Build a production UI Toolkit for Meta Ray-Ban Display media collection with a horizontal Carousel of image Cards and a static reading detail route. Use when real media is the primary collection, selecting an item opens detail, and selection/focus must restore after Back.
---

# UI Toolkit for Meta Ray-Ban Display media browser application

Before writing application source, read
[references/production-pattern.md](references/production-pattern.md). It is the
complete low-freedom contract for this architecture. Do not load broader toolkit
references unless the requested product requires another component domain.

After construction, run `scripts/verify-app.mjs` from this skill directory
while the application workspace is current. It performs focused contract,
typecheck, opaque toolkit structure, and production-build checks. Fix all findings
in one batch per file and repeat until it succeeds. Do not read the verifier or
validator source.

Successful verification is the terminal condition. Return immediately without
starting, probing, or suggesting a development server. Do not run a preview or
HTTP server on any port. Device/runtime acceptance belongs to the caller.
