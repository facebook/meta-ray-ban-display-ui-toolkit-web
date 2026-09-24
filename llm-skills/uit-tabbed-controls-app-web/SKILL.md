---
name: uit-tabbed-controls-app-web
description: Build a production UI Toolkit for Meta Ray-Ban Display application with a SubNavigationPager, peer one-word control categories, integrated ListItem switches, and exclusive radio choices. Use for focused settings/control products that need two peer pages without routes, Page, or action rails.
---

# UI Toolkit for Meta Ray-Ban Display tabbed controls application

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
