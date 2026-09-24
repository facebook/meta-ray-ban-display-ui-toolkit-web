# Production material controls application

Use this pattern for two or three peer operational controls where each surface
shows one current value and activation cycles one meaningful mode. Do not use
it for a read-only dashboard, a list of records, tab navigation, or a dense
telemetry console.

## Fixed feature budget

Use one `Page`, one root `ScrollView`, two or three `Container` controls,
`TextView`, React local state, `MaterialLibrary.themedPrimary`, and `Toast`.
Do not add routes, Panel, Surface, StaticContainer, Card, ListItem,
SubNavigationPager, buttons, rails, chips, tags, badges, fake pills, HTML
controls, automatic timers, random updates, or decorative status widgets.
Icons are optional; omission is preferable to a weak icon.

Mount `App` directly around the Page so it loads the toolkit stylesheet. Use a
one- or two-word Page header and omit header metadata unless it changes the
meaning of the complete screen.

## Control content

ScrollView is edge-to-edge and receives `insetForHeader` plus a concise
`ariaLabel`. Inside it, one ordinary stack applies only horizontal and trailing
large-token padding; do not add leading top clearance beyond the header inset.
The stack has a token gap and contains the Containers vertically. Never place
them in a multi-column grid.

The stack contains only the two or three Containers. Do not add a summary row,
introductory sentence, status strip, telemetry section, footer, instructions,
or any TextView outside those Containers. The Page header supplies route
identity; the controls supply all operational content.

Each Container:

- is one focus target with one `onClick` outcome and matching accessible label;
- uses `width="100%"` through its public root API;
- receives one custom material;
- contains one ordinary child named `content-inset` with
  `var(--uit-spacing-large)` padding on every edge;
- shows exactly an all-caps secondary label, a `BODY2_EMPHASIZED` current value,
  and one short secondary metadata line;
- separates those three mixed text roles with the prescribed text-stack rhythm,
  expressed only as the sum of the large and xsmall spacing tokens;
- keeps all copy readable without collision or ambiguous wrapping;
- changes one controlled mode and then shows concise Toast feedback.

Do not use BODY1, heading, display, or numeral styles. Do not put a rounded
span, colored badge, pseudo-chip, icon circle, or another material-owning
component inside Container. Do not display D-pad, focus, mock-data, component,
or implementation instructions.

Each current value and metadata line contains at most two compact fact groups.
For example, choose `82% · Reserve` and `10.4 kWh available`; do not serialize
percentage, capacity, mode, time, source, and an action hint into one line.
Accessible labels may explain activation, but visible copy never says “press,”
“tap,” “D-pad,” “focus,” “control,” “mock,” or “confirms.”

## Custom materials

Define each six-role palette once in a dedicated `materials.ts` and pass it to
`MaterialLibrary.themedPrimary` through `useMemo`. The roles are `idleFill`,
`gradientStep1` through `gradientStep4`, and `glowTint`. Each palette needs a
quiet idle fill, clearly distinct focused core, orderly falloff, and compatible
glow. Do not scatter palette values through components or CSS and do not alter
the toolkit's internals.

Do not import or invent a palette TypeScript type. Export each plain object
`as const`; `MaterialLibrary.themedPrimary` validates its shape at the call
site.

Custom palette source values are allowed only in this named theme-definition
file. All layout CSS still uses the toolkit semantic tokens. Test idle, focus-origin
movement, press, mode changes, first/last focus, and secondary text blending on
every material.

## Complete authored CSS shape

Use only this structural shape, adapting class names if needed:

```css
html,
body,
#root {
  inline-size: 100%;
  block-size: 100%;
  margin: 0;
  background: var(--uit-color-background-window);
}

* {
  box-sizing: border-box;
}

.control-stack {
  display: flex;
  flex-direction: column;
  gap: var(--uit-spacing-medium);
  min-inline-size: 0;
  padding-inline: var(--uit-spacing-large);
  padding-block-end: var(--uit-spacing-large);
}

.content-inset {
  display: flex;
  flex-direction: column;
  gap: calc(var(--uit-spacing-large) + var(--uit-spacing-xsmall));
  min-inline-size: 0;
  padding: var(--uit-spacing-large);
}
```

Do not add raw lengths, colors, gradients, corners, opacity, font metrics, fixed
viewport dimensions, internal selectors, or root styling that changes
component anatomy. A Container `className` may style only the Container root;
ordinary content classes style only application-owned descendants.

## Verification

Confirm a stable initial state, one operation per Container, two or three
vertical controls, no fake compact component, no Unicode/emoji stand-in icon,
no timer/random update, routine typography only, and no leaked engineering
copy. Confirm there are no visible elements before, after, or between the
Containers except their own three-role content. Then run typecheck, build, and
the opaque structure validator. Zero findings are required.
