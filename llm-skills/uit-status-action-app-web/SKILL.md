---
name: uit-status-action-app-web
description: Build a focused production UI Toolkit for Meta Ray-Ban Display status, monitor, singular incident-acknowledgement, or session application with one Page, one edge-to-edge informational Panel, and one reversible bottom action. Use for one recorded alert, event, threshold crossing, or excursion, or another product with one primary state that does not need routes, collections, history, or peer tabs.
---

# UI Toolkit for Meta Ray-Ban Display status action application

Before writing application source, read
[references/production-pattern.md](references/production-pattern.md). It is the
complete low-freedom contract for this architecture; do not load broader toolkit
references unless the user explicitly requests an unsupported capability.

After construction, keep the application workspace as the current directory
and run this skill's `scripts/verify-app.mjs`. Fix all reported issues in one
batch per file and rerun until it succeeds. Do not read the verification script.

Successful verification is the terminal condition. Return immediately. Do not
discover browser runners, start or probe any development/preview/HTTP server,
suggest a local run command, repeat individual gates, or author substitute
checks. Device/runtime acceptance is a separate caller-owned stage.
