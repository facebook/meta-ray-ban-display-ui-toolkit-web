---
name: uit-materials-web
description: Design, customize, derive, implement, debug, or review UI Toolkit for Meta Ray-Ban Display `ContainerMaterial` rendering. Use for material factories, custom colors, layer composition, gradients, glow strokes, inner shadows, noise, press overlays, drop shadows, shape providers, canvas drawing, state transitions, partial focus, focus handoff, rubber-band feedback, or material performance. Covers public material APIs and correct production ownership.
---

# UI Toolkit for Meta Ray-Ban Display materials

`ContainerMaterial` is the rendering infrastructure shared by `StaticContainer`,
`Container`, `Surface`, and compatible higher-level components. Treat those
three primitives as equal material hosts; none is the default owner merely
because the API type is named `ContainerMaterial`. A material paints ordered
visual-effect layers around live DOM content and responds to `NONE`, `DEFAULT`,
`FOCUSED`, and `PRESSED` visual states as directed by its host.

Read:

- [references/material-architecture.md](references/material-architecture.md) for layers, placement, state, canvas, shapes, cloning, and custom implementation.
- [references/color-gradient-recipes.md](references/color-gradient-recipes.md) for color selection, themed materials, gradient steps, and review.
- [../building-uit-interfaces-web/references/tokens-materials-motion.md](../building-uit-interfaces-web/references/tokens-materials-motion.md) for application-level token and motion rules.

Inspect exact APIs in:

- `packages/foundation/src/material/ContainerMaterial.types.ts`
- `packages/foundation/src/material/MaterialLibrary.ts`
- `packages/foundation/src/material/DefaultContainerMaterialLayerFactories.ts`
- `packages/foundation/src/material/layers/`
- `packages/foundation/src/components/Container.types.ts`

## Choose the least custom approach

1. Use a component's default material.
2. Choose an existing `MaterialLibrary` factory.
3. Use `MaterialLibrary.themedPrimary(theme)` to recolor the standard interaction material while preserving its layer behavior.
4. Derive/replace a small number of layers when the existing architecture fits but one effect differs.
5. Build a new `ContainerMaterial` only when the visual behavior genuinely requires a different layer model.

Do not construct a new layer system merely to change color.

## Correct ownership

The ownership rules apply identically to `StaticContainer`, `Container`, and
`Surface`, including when a host renders a static or externally selected visual
state. Each mounted host owns its own long-lived material instance.

Memoize one material instance per mounted host:

```tsx
const routeMaterial = useMemo(
  () => MaterialLibrary.themedPrimary(routeTheme),
  [routeTheme],
);

return <Container material={routeMaterial}>{children}</Container>;
```

- Reuse that instance across its host's rerenders so transitions remain continuous.
- Do not share one material instance between simultaneously mounted hosts.
- A derived material must own cloned layers. Stateful custom layers must implement `clone()` and copy private mutable state/caches.
- Do not create a material factory inline every render.
- Memoize shape providers until their configuration changes.

## Default layer model

The standard interactive material composes these effects in increasing sort order:

1. optional drop shadow;
2. idle solid fill;
3. focused elliptical radial-gradient fill;
4. focused inner glow/shadow;
5. focused noise texture;
6. pressed overlay;
7. focus-aware glow stroke.

Each layer is exactly one effect. Per-state alpha turns effects on/off and the host drives all layers with one transition progress value. Preserve this coordinated state model when recoloring.

## Partial focus and handoff

Partial focus is a normalized material-origin offset in `[-0.5, 0.5]` per axis. Focus-aware gradient/stroke layers opt in through `supportsDiscretePartialFocus`; solid fills, inner glow, noise, and pressed overlays normally remain fixed.

- Invalid directional input rubber-bands toward the attempted direction only after focus and scroll cannot move.
- Container translation may accompany rubber-band feedback when enabled.
- During a focus handoff, the outgoing material origin moves toward the incoming component; the incoming origin begins toward the outgoing component and springs to center.
- Axis support (`XY`, `X`, `Y`, `None`) constrains both handoff and rubber-band behavior.
- Handoffs do not animate between unrelated route-transition pages.
- Do not manually dispatch handoff effects from application code; use normal toolkit focus ownership.

Custom focus-aware layers must calculate their origin from `partialFocusPosition`; do not translate the entire material bitmap. Glow strokes intentionally may track at a reduced magnitude relative to the focused fill.

Use `BlurredRadialGradientContainerMaterialLayer` for a soft foreground light
that travels over stationary material layers. Equivalent configurations share a
bounded pre-rendered bitmap cache, so focus movement changes only the draw
position rather than recomputing the blur.

## Validation

Verify every custom material at minimum in:

- default, focused, pressed, disabled host, and return-to-focused states;
- partial-focus incoming/outgoing and all supported invalid directions;
- small, wide, tall, and resized bounds;
- the component's actual smooth shape and any custom/tail shape;
- rapid focus/press interruption;
- target WebView at device pixel ratio;
- reduced motion and background-tab pause behavior;
- multiple concurrent hosts to catch accidental shared layer state.

Do not approve from a static focused screenshot alone.
