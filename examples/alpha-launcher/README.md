# Alpha launcher

Alpha Launcher is a visual exploration built with current UI Toolkit components and public customization APIs. Its neon treatment shows how an application can create a distinct identity while preserving toolkit geometry, interaction, focus, and accessibility behavior.

The visual direction is inspired by an [exploratory launcher shown by the Meta design team](https://www.instagram.com/reel/DRfHBlYDskF/), but the sample stands on its own and does not reproduce a product interface.

## Documentation

Read the [theming and customization](https://wearables.developer.meta.com/docs/develop/webapps/design/guides/theming-and-customization/), [navigation and focus](https://wearables.developer.meta.com/docs/develop/webapps/design/guides/navigation-and-focus/), and [application structure](https://wearables.developer.meta.com/docs/develop/webapps/design/guides/application-structure/) guides on the Wearables Developer Center.

## Open the hosted sample

Open the hosted [Alpha launcher](https://facebook.github.io/meta-ray-ban-display-ui-toolkit-web/alpha-launcher/) in a browser. The sample card on the [samples and utilities page](https://facebook.github.io/meta-ray-ban-display-ui-toolkit-web/) includes a QR code for adding it to your own glasses.

## Preview with the Meta Ray-Ban Display Simulator

Follow the [Simulator guide](https://wearables.developer.meta.com/docs/develop/webapps/test/#preview-with-the-meta-ray-ban-display-simulator) to preview the hosted or local sample in a 600 × 600 additive-display frame in desktop Chrome. The extension provides directional controls, display and background tuning, multiple surroundings, viewport recording, and a QR code for adding the sample to your own glasses during development.

[Install the Simulator from the Chrome Web Store](https://chromewebstore.google.com/detail/meta-ray-ban-display-simu/jpjlmmodokemlepklkdbimceggpbjcll). Use it while iterating on layout, readability, focus, and application flows. The Simulator is a development preview and does not replace validation on Meta Ray-Ban Display glasses.

## What the sample demonstrates

- optional WebMCP control of brightness, volume, and Do Not Disturb through the same state used by the visible controls;
- a bottom-aligned `ButtonRail` with a centered anchor;
- icon buttons that reveal text on focus;
- `Page`, `VerticalList`, `ListItem`, and `IsolatedControl`;
- URL-backed pages with fade transitions and predictable Back behavior;
- focus restoration when returning to a page or resuming the web app; and
- a custom neon-inspired Canvas container material applied consistently across controls.

## Run locally

From the repository root, install workspace dependencies and start Alpha launcher:

```bash
yarn install
yarn workspace @meta/wearables-ui-toolkit-mrbd-alpha-launcher dev
```

Build and type-check it with:

```bash
yarn workspace @meta/wearables-ui-toolkit-mrbd-alpha-launcher build
```

## Project structure

```text
src/
  App.tsx                    Shared app state and screen composition
  AppMaterialTheme.tsx       App material provider and themed adapters
  NeonMaterial.ts            Neon Canvas material definition
  LauncherRail.tsx           Explicit ButtonRail contents
  AdjustmentPage.tsx         Brightness and volume IsolatedControl
  NotificationsPage.tsx      Notification Page and VerticalList
  SettingsPage.tsx           Settings Page and VerticalList
  useLauncherNavigation.ts   URL, Back, and focus coordination
  useHostResumeFocus.ts      Host-menu focus preservation
  settingIcons.ts            Value-to-icon selection
  launcherTypes.ts           Shared page types
```

The rail and list rows are written explicitly instead of being generated from configuration arrays. This makes the sample longer, but lets a new developer see the exact component order and customize each control independently.

## Custom materials

`NeonMaterial.ts` contains only the material definition. It approximates the neon coloring used in early iterations of the visual language by composing public toolkit material layers. The file exports `createNeonMaterial`, a factory that creates an independent `ContainerMaterial`.

Container materials track animated interaction state, so each control must receive its own `ContainerMaterial` instance. Do not share one instance between multiple components.

You can create custom container materials that fit your app's visual identity. Components that accept a `ContainerMaterial` can use those materials to change their appearance while preserving the component's behavior and geometry.

`AppMaterialTheme.tsx` demonstrates a scalable app pattern:

1. `AppMaterialProvider` supplies one material factory at the app boundary.
2. `useAppMaterial` memoizes a fresh material for each calling control.
3. `ThemedButton` and `ThemedListItem` are small composition adapters around public toolkit components.
4. Components used only once, such as `IsolatedControl`, can call `useAppMaterial` directly instead of adding another named adapter.

To re-theme the whole sample, provide a different factory once:

```tsx
<AppMaterialProvider createMaterial={createMyMaterial}>
  <App>{children}</App>
</AppMaterialProvider>
```

The controls still own their preferred shapes and corner radii. The custom material changes how those shapes are painted; it does not replace component geometry.

## Navigation and focus

The screen components only demonstrate layout and controls. `useLauncherNavigation.ts` isolates URL navigation, Back behavior, initial focus, and returning focus. `useHostResumeFocus.ts` contains the narrower host-menu handoff behavior. Keeping those details in hooks prevents them from obscuring the toolkit examples in each screen.

`PageTransition` coordinates which page is mounted. Its built-in motion is disabled because this sample applies one short opacity transition in `styles.css`; enabling both would stack two animations.
