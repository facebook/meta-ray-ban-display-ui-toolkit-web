# Tokens, materials, shapes, and motion

## Contents

- [Semantic tokens](#semantic-tokens)
- [Typography](#typography)
- [Spacing and layout](#spacing-and-layout)
- [Materials](#materials)
- [Shapes and clipping](#shapes-and-clipping)
- [Motion](#motion)

## Semantic tokens

The toolkit theme variables use the `--uit-` namespace. Read the current declarations in `packages/foundation/src/theme/theme.css` and dimension styles rather than guessing names.

Use role-based variables such as `--uit-color-text-primary`, component enums such as `TextColor`/`IconTintColor`, and semantic spacing/radius variables. Do not use old unprefixed aliases, raw palette values, or component-specific magic numbers in application CSS.

Paint `html`, `body`, the mount root, and `App` with
`var(--uit-color-background-window)`. Do not replace the window role with a raw
color, image, or decorative gradient, and do not override `App` to transparent.
Use Panel, StaticContainer, Card scrims, or the appropriate semantic material
locally when content needs an additional legibility or interaction surface.

Scope intentional theme overrides to `[data-app-root]` or a contained subtree:

```css
[data-app-root] {
  --uit-color-text-accent: var(--app-color-content-accent);
}
```

The right-hand side should come from the application's approved semantic theme or
generated palette. Override a semantic role, not internal component selectors,
material-layer CSS, or a copied color literal.

## Typography

Use `TextView`, `TextAppearance`, or `uit-text-*` classes. A text appearance owns family, size, weight, line height, and block metrics as one contract. Do not mix the toolkit class typography with custom font properties.

Available families of appearances include numeral, display, heading, body, emphasized body, label, emphasized label, and meta. Select semantic HTML (`h1`–`h6`, `p`, `label`, `span`) based on document meaning rather than appearance.

Do not add custom letter spacing. Do not size a layout around one English string; support localization and component line limits.

## Spacing and layout

Use `--uit-spacing-*` variables. Authored text/content inside a Panel uses
`--uit-spacing-large`, the toolkit token for the Panel content inset; do not copy
its currently resolved length or substitute a nearby spacing token.

Do not introduce arbitrary pixel gaps because they appear close in one screenshot. Component anatomy owns internal spacing; application CSS owns only arrangement between distinct regions.

Important rules:

- zero extra gap between consecutive ListItems;
- no horizontal page inset around edge-to-edge VerticalList/ButtonRail viewports;
- no doubled rounded-container padding;
- use component header/list insets rather than manual top padding;
- avoid fixed device width/height assumptions.

## Materials

`StaticContainer`, `Container`, and `Surface` are equal material hosts. Each can
accept a compatible `ContainerMaterial`, including a custom one, when a
deliberate custom look is required. Compatible higher-level components can do
the same through their public material props. The default material remains the
preferred choice.

Use supported `MaterialLibrary` factories before building layers. Create material instances with `useMemo`:

```tsx
const material = useMemo(
  () => MaterialLibrary.themedPrimary({
    idleFill: appTheme.materials.primary.idleFill,
    gradientStep1: appTheme.materials.primary.focusCore,
    gradientStep2: appTheme.materials.primary.focusMidpoint,
    gradientStep3: appTheme.materials.primary.focusFalloff,
    gradientStep4: appTheme.materials.primary.focusExtent,
    glowTint: appTheme.materials.primary.glowTint,
  }),
  [appTheme],
);

// The same material contract applies when the direct host is a
// StaticContainer, Container, or Surface. Choose the host for its semantics.
return <Container material={material}>{children}</Container>;
```

One mounted `StaticContainer`, `Container`, `Surface`, or compatible
higher-level host owns one long-lived material instance. Reuse it across that
host's rerenders, but do not share one mutable instance across concurrently
mounted hosts. Memoize shape providers too.

Do not reach into an existing component's layer internals for ordinary customization. If a reusable material behavior is missing, add a supported factory/configuration instead of application-level layer mutation.

Treat every design dimension as a token choice: colors, spacing, corners/shapes,
typography, icon/component sizes, elevation, opacity, and motion. Raw values are
appropriate only for domain data or an API-defined normalized quantity, not for
reproducing a resolved design token.

## Shapes and clipping

The toolkit uses smooth shape geometry. Let components own it. Use semantic `CornerRadius`, `SurfaceCornerRadius`, or a reused `ShapeProvider` when an exposed API calls for shape selection.

Do not use ordinary `border-radius` to imitate a component's smooth corners, tails, avatar cutouts, panel shape, or focus outline. Keep material fill, glow, stroke, scrim, and content clipping on the same shape path.

Avoid nested rounded rectangles. A child surface is appropriate only when it represents a distinct semantic component, not merely as another background behind the parent's content.

## Motion

Material, focus, press, scale, opacity, and shape changes are one coordinated interaction system. Use component props and state transitions rather than independent wrapper animations.

- Do not animate a wrapper's scale around an interactive toolkit component.
- Do not set React state every animation frame.
- Prefer CSS transforms/opacity and stable mounted layers.
- Use the toolkit spring/duration/interpolator utilities for advanced component work.
- Respect reduced motion.
- Keep press-in/out transient and return to focused state after activation.
- Avoid remounting layers/content merely to restart an animation.
- On initial render, do not animate all controls from a collapsed/default staging state. Render non-focused controls at their final idle state and animate only actual state changes.

When externally driving material/visual states for a legitimate preview or synchronized interaction, use the public `visualState`, `visualStateOverride`, or material-transition APIs rather than CSS class spoofing.
