---
name: uit-routed-list-app-web
description: Build a production UI Toolkit for Meta Ray-Ban Display application around one data-driven collection, routed record details, durable state, and a real detail action. Use for conventional list/detail products and as the default architecture for ambiguous simple or medium-complexity application briefs.
---

# UI Toolkit for Meta Ray-Ban Display routed list application

Before writing application source, read
[references/production-pattern.md](references/production-pattern.md). It is the
complete low-freedom contract for this architecture; do not load broader toolkit
component references unless the product request explicitly requires a
capability outside the pattern.

After construction, keep the application workspace as the current directory and
run the `scripts/verify-app.mjs` file under this skill's own directory. Fix its
findings as one batch per file and rerun until it succeeds. Do not read the
verification script.

Successful verification is the generation terminal condition. Stop and report
the result immediately. Do not search for Chromium, Chrome, Playwright,
Puppeteer, browser MCPs, or other runners; do not start a preview server, curl
the build, rerun individual gates, or author substitute verification scripts.
Device/runtime acceptance is a separate caller-owned stage unless the task
explicitly requests it and provides the target environment.
