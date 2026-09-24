---
name: uit-timed-session-app-web
description: Build a production UI Toolkit for Meta Ray-Ban Display countdown or timed-session application with synchronized running, paused, complete, and restart behavior in one Page, one informational Panel, and one persistent bottom action.
---

# UI Toolkit for Meta Ray-Ban Display timed session application

Before writing application source, read
[references/production-pattern.md](references/production-pattern.md). It is the
complete low-freedom contract for this architecture; do not load broader toolkit
references unless the user explicitly requests an unsupported capability.

After construction, keep the application workspace as the current directory
and run this skill's `scripts/verify-app.mjs`. Fix all reported issues in one
batch per file and rerun until it succeeds. Do not read the verification script.

Successful verification is the terminal condition. Do not discover browser
runners, start servers, repeat individual gates, or author substitute checks.
Device/runtime acceptance is a separate caller-owned stage.
