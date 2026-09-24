---
name: uit-operational-pager-app-web
description: Build a production UI Toolkit for Meta Ray-Ban Display operational workspace with exactly three peer one-word areas in a SubNavigationPager: one compact overview with bottom actions, one actionable record list, and one read-only notes or handoff surface. Use for trip, route, inspection, event, shift, or field-operation briefs that explicitly need three peer areas such as Overview/Stops/Notes, Summary/Tasks/Log, or Status/Checks/Notes without routed record details.
---

# UI Toolkit for Meta Ray-Ban Display operational pager application

Before writing application source, read
[references/production-pattern.md](references/production-pattern.md). It is the
complete low-freedom contract. Do not load broader toolkit references unless the
request adds a capability outside this three-area architecture.

After construction, run only this focused verifier from the application
workspace:

```sh
node <absolute-path-to-this-skill>/scripts/verify-app.mjs src
```

It performs the pattern contract, typecheck, toolkit structure validation, and
production build. Fix every reported source issue in one coherent pass and
rerun the same command. Do not read the verifier or run its gates separately.

Successful verification is the terminal condition. After the verifier exits
successfully, invoke no more tools or commands; the next action must be the
final answer. Do not start a development, preview, browser-automation, or HTTP
server. Device acceptance belongs to the caller.
