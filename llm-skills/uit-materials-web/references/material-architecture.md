# Material architecture and layer authoring

## Contents

- [Rendering model](#rendering-model)
- [Layer contract](#layer-contract)
- [Built-in layer roles](#built-in-layer-roles)
- [State transitions](#state-transitions)
- [Partial focus and handoff](#partial-focus-and-handoff)
- [Shapes, strokes, and insets](#shapes-strokes-and-insets)
- [Custom material procedure](#custom-material-procedure)
- [Performance and correctness](#performance-and-correctness)

## Rendering model

`ContainerMaterial` owns an ordered collection of independent `MaterialLayer` objects. Layers have:

- `placement`: `BACKGROUND` behind DOM content or `FOREGROUND` above it;
- `sortOrder`: 0–1000 within a placement, lower drawn first;
- one visual responsibility;
- per-state alpha/values;
- optional blend mode;
- optional partial-focus support;
- optional continuous animation and visibility gating;
- a required independent `clone()`.

Canvas layers in one placement normally share one canvas. Foreground/background blending with live content/backdrop is opt-in because it may split layers into extra compositing surfaces. Use these flags only when an effect actually requires pixels outside the material's own accumulated canvas.

The same rendering model applies when the direct host is `StaticContainer`,
`Container`, or `Surface`. Host choice determines interaction semantics and how
the visual state is selected; it does not change material layer roles or
ownership. Do not wrap one host in another to attach or display a material.

## Layer contract

Prefer typed subclasses exported from `foundation/material/layers`. Extend `ContainerMaterialLayer` for a new reusable effect. Its template method:

1. resolves layer alpha across the active state transition;
2. skips zero-alpha painting;
3. invokes `paint(ctx, params, alpha)`.

`CanvasLayerDrawParams` supplies:

- target state and optional from/to/progress transition;
- shared outer shape `Path2D`;
- logical width/height and DPR-scaled context;
- shape provider/material inset context;
- normalized partial-focus position;
- time and decoded assets;
- `lerpState()` for per-state numeric properties;
- `getInsetStrokePath()` for correct stroke geometry.

Do not retain draw params after the call. Do not allocate avoidable objects/bitmaps per frame.

Use `createLayer` only for a simple closure-based effect. Use a class when the layer owns mutable state, caches, continuous animation, or path-derived resources.

## Built-in layer roles

### Solid color

Fills the shared shape path. Use for idle background or pressed overlay. It does not move with partial focus.

### Radial gradient

Fills the shape with an elliptical gradient. `sizeMultiplier` expresses radii relative to bounds; `placementMultiplier` expresses origin relative to bounds. It can use inset-adjusted height and partial-focus origin shifts. Use for focus illumination.

### Blurred radial gradient

Pre-renders a soft elliptical gradient into a bounded shared bitmap cache, then
draws that bitmap at the configured origin. Use it as a foreground lighting
layer when the light should follow partial focus while fills, texture, and
strokes remain stationary. Cache identity depends on dimensions, stops, blur,
and device pixel ratio—not state, alpha, placement, or partial-focus position.

### Linear gradient

Fills between configured points. Use for directional scrims or intentionally directional materials.

### Inner shadow/glow

Creates edge depth/illumination with blur, spread, offsets, intensity, and usually `screen` blending. It is geometry-sensitive and cached; it normally fades by state rather than moving with partial focus.

### Noise

Tiles a small texture, normally with `overlay` blend, to prevent a perfectly synthetic gradient. Keep alpha subtle and stop painting when invisible.

### Press overlay

A state-gated solid translucent layer in `PRESSED`. It communicates activation without replacing the focused fill.

### Glow stroke

Uses the inset stroke path, never a stroke centered on the outer boundary. A radial glow stroke tracks partial focus at reduced magnitude and normally uses overlay-style blending. Stroke width and alpha can interpolate by state.

### Drop shadow

Paints outside/behind the shape to communicate elevation. Use only for materials/patterns that require it; do not add elevation to every container.

### Image content / image blur

Loads decoded assets through the material asset cache and clips/draws them against the shape. Provide a stable URL and let asset loading request redraw. Avoid repeated decode or per-frame filtering.

### No-op

Occupies a semantic layer role without drawing. Useful when deriving a standard material that should remain transparent in one role, such as an unbounded idle state.

## State transitions

`VisualState` values are `NONE`, `DEFAULT`, `FOCUSED`, and `PRESSED`. The Container owns interaction-to-visual-state mapping. A single synchronized 0–1 transition drives every layer; each layer interpolates its own alpha, stroke width, gradient scale, or other numeric targets via `lerpState`.

Rules:

- Define state targets, not independent timers.
- Preserve focused illumination during `PRESSED`; add press feedback rather than jumping to unrelated colors.
- Ensure rapid focus/press reversal is continuous and interruptible.
- Use material-level `alphaForState` only to fade the composed material without fading DOM content.
- Use `hidden`/`NONE` for truly invisible material, not zero-opacity DOM wrappers.

## Partial focus and handoff

The focus system computes a normalized point toward another component or invalid direction. A material receives it through `setPartialFocusPosition`.

### Invalid-direction rubber-band

When focus cannot move and no scroll distance remains:

1. axis support is checked;
2. the normalized origin animates from center toward the attempted edge;
3. optional host translation gives physical resistance;
4. the origin returns to center.

The feedback is bounded and directional. Do not trigger it while a scroller can still consume movement.

### Focus handoff

The coordinator measures both component rectangles. It projects the other component's center toward the current component boundary and clamps the normalized offset. Then:

- outgoing: center → toward incoming target;
- incoming: starts toward outgoing target → springs to center;
- reset: springs/snaps to center.

Only opted-in axes move. Partial-focus-enabled gradient layers use this offset; fixed layers do not. This produces a sense that illumination travels between controls without shifting the entire background treatment.

### Custom layer requirements

- Set `supportsDiscretePartialFocus: true` only if origin movement makes semantic visual sense.
- Use shared geometry helpers such as `shiftedX`, `shiftedY`, or the radial geometry resolver.
- Keep movement normalized to bounds so it behaves consistently across sizes.
- Consider reduced tracking for strokes and full tracking for broad focused fill.
- Never accumulate offsets; every frame derives from the supplied normalized position.

## Shapes, strokes, and insets

The host computes one shape path from the component's `ShapeProvider`. Fill layers draw that path. Stroke layers call `getInsetStrokePath(strokeWidth)` so the full stroke remains inside the desired geometry.

- Use `RoundedRectangleShapeProvider` and semantic `CornerRadius` when possible.
- Reuse immutable provider instances to benefit from geometry caching.
- A custom provider must return both outer fill and inset stroke paths.
- Use `clipsToShape: false` only for an intentional rectangular/out-of-shape effect such as a panel edge scrim.
- Material inset changes drawable bounds; use inset-aware gradient geometry where focus radii should remain visually consistent.
- Rounded content inset inside the host must remain concentric with the host
  shape. Choose the semantic child corner token equal to the outer corner token
  minus the spacing token. The common medium outer corner with large inset uses
  the xx-small child corner. If no exact token pairing exists, change the
  supported combination or make the content full bleed; never approximate with
  a literal or nest another material host to obtain a radius.

## Custom material procedure

1. Write the state table: which effects exist and their values in each state.
2. Choose background versus foreground placement for each effect.
3. Assign stable unique IDs and sort orders.
4. Use one typed layer per effect.
5. Reuse built-in layer factories where their behavior is correct.
6. Define per-state alpha/value functions and shared transition behavior.
7. Mark only origin-sensitive layers for partial focus.
8. Construct `ContainerMaterial({ layers, ...options })`.
9. Memoize it per mounted host.
10. Validate all states, shapes, sizes, interruptions, DPR, and multiple hosts.

When deriving a standard material, obtain its background/foreground layers, replace by stable layer ID, and construct a new material. Do not mutate layers owned by an attached material.

## Performance and correctness

- Implement `clone()` correctly. Sharing caches/mutable state across material instances violates ownership.
- Set `isVisibleForState` accurately for continuously animated layers so the RAF loop pauses when invisible.
- Use cached paths, decoded images, and blur results.
- Do not set React state from canvas draw callbacks.
- Avoid live backdrop/content blending unless necessary; it creates more compositing surfaces.
- Keep layer count and offscreen blur sizes modest for a low-power device.
- Invalidate path-derived caches when geometry changes.
- Test dynamic resize, font settlement, and content measurement; material and clipping paths must track the rendered border box.
