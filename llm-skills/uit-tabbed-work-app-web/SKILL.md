---
name: uit-tabbed-work-app-web
description: Build a production UI Toolkit for Meta Ray-Ban Display application with two peer SubNavigationPager work queues, routed record details, durable completion/defer state, and bottom detail actions. Use when a brief explicitly asks users to switch between one-word work collections such as Today/Done, Active/Done, Open/Closed, or Current/History and then inspect or act on one record.
---

# UI Toolkit for Meta Ray-Ban Display tabbed work application

Before writing application source, read
[references/production-pattern.md](references/production-pattern.md). It is the
complete low-freedom contract. Do not load broader toolkit references unless the
brief requests a genuinely different capability.

After construction, run `scripts/verify-app.mjs` from this skill directory
while the application workspace is current. Fix every finding and repeat until
it succeeds. Do not read the verifier source.

Successful verification is the terminal condition. Do not start a preview
server or search for browser tooling; runtime/device acceptance belongs to the
caller.
