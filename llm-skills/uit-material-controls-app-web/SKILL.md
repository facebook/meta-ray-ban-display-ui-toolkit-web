---
name: uit-material-controls-app-web
description: Build a restrained production UI Toolkit for Meta Ray-Ban Display control dashboard from a small vertical set of interactive Containers with custom materials. Use when several peer operational values each have one direct reversible mode action and custom surface color is an explicit product requirement.
---

# UI Toolkit for Meta Ray-Ban Display material controls application

Before writing application source, read
[references/production-pattern.md](references/production-pattern.md). It is the
complete low-freedom contract. Do not load broader toolkit references unless the
request adds a genuinely different component domain.

After construction, run an unmasked typecheck, production build, and
`../uit-screen-architecture-web/scripts/validate-app-structure.mjs src` from
the application workspace. Fix every finding and repeat until all commands
succeed. Do not read the validator source.

Successful verification is the terminal condition. Device/runtime acceptance
belongs to the caller.
