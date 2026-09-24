---
name: uit-contextual-inbox-app-web
description: Build a production UI Toolkit for Meta Ray-Ban Display inbox or work queue where each ListItem opens an anchored temporary VerticalMenu and menu actions update that record. Use when row-level Assign, Snooze, Archive, or similar secondary commands must dismiss with Back and return focus without reflow.
---

# UI Toolkit for Meta Ray-Ban Display contextual inbox application

Before writing application source, read
[references/production-pattern.md](references/production-pattern.md). It is the
complete low-freedom contract. Do not load broader toolkit references unless the
request adds another component domain.

For row triggers, use `ariaLabel="Open actions"`. ListItem appends its visible
record content when it builds the accessible name; repeating the record name in
this prefix produces redundant output.

After construction, run only this focused verifier from the application
workspace:

```sh
node <absolute-path-to-this-skill>/scripts/verify-app.mjs src
```

It performs the pattern contract, typecheck, toolkit structure validation, and
production build. Fix every reported source issue in one coherent pass and
rerun the same command. Do not read the verifier or its delegated validator.
Do not run their gates separately.

Successful verification is the terminal condition. Return immediately without
starting a development server. Device/runtime acceptance belongs to the caller.
