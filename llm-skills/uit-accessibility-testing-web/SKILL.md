---
name: uit-accessibility-testing-web
description: Audit, test, or validate production UI Toolkit for Meta Ray-Ban Display interfaces for accessibility, focus/D-pad navigation, responsive layout, WebView rendering, performance, component states, route restoration, scroll boundaries, popup behavior, additive-display contrast, package-export safety, formatting, lint, tests, and build readiness.
---

# UI Toolkit for Meta Ray-Ban Display accessibility and validation

Read [../building-uit-interfaces-web/references/quality-checklist.md](../building-uit-interfaces-web/references/quality-checklist.md) and apply it as a release gate, not optional advice.

Read [references/validation-playbook.md](references/validation-playbook.md) for
state matrices, input-path coverage, and defect triage.

## Audit sequence

1. Confirm App/styles and semantic route structure.
2. Inspect component selection and remove custom imitations/nested surfaces.
3. Audit semantic HTML, labels, alt text, roles, value semantics, and duplicate widgets.
4. Navigate exclusively by D-pad/keyboard: normal, rapid repeat, every boundary, disabled/hidden changes.
5. Verify Back dismissal precedence and route focus/scroll restoration.
6. Inspect the entire scroll extent and every applicable component state.
7. Resize to materially different width/height; find hardcoded assumptions and focus clipping.
8. Test target WebView rendering, animation, fonts, masks, blends, portals, and compositing.
9. Add behavior-focused regressions for every defect fixed.
10. Run format, lint, targeted/full tests, production build, and package-export checks.

## Accessibility invariants

- icon-only actions have outcome labels;
- meaningful images/Avatars have accurate alt text;
- decorative imagery is hidden and described by a parent if needed;
- visual-only controls are not duplicate focus/ARIA widgets;
- one interaction target owns one semantic action;
- status/timestamp/value meaning is exposed;
- heading hierarchy is semantic;
- menus/modals are dismissible and focus-restoring;
- localized/long content follows supported max-line behavior.

## Visual evidence

Compare component crops in matching states, not only full screens. Wait for assets/animations; record and inspect frames for transient glitches. Review default, focused, pressed, disabled, selected, loading, overflow, popup, transition, and restored states. Inspect every page section beyond the initial viewport.

Never hide a library defect with application CSS or a host-only workaround. Diagnose ownership and fix the correct layer.
