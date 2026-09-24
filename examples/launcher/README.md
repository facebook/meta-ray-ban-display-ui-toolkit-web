# Launcher sample

Launcher is a sample application built with UI Toolkit. It demonstrates horizontal and vertical pages, animated launcher chrome, quick settings, an expandable slider mode, a home feed, two switchable app-grid layouts, and pin management with animated reordering. Optional WebMCP tools update the same visible layout and pin preferences when the browser supports WebMCP. The sample app tiles demonstrate interaction and do not launch applications.

## Documentation

Read the [application structure](https://wearables.developer.meta.com/docs/develop/webapps/design/guides/application-structure/), [navigation and focus](https://wearables.developer.meta.com/docs/develop/webapps/design/guides/navigation-and-focus/), and [theming and customization](https://wearables.developer.meta.com/docs/develop/webapps/design/guides/theming-and-customization/) guides on the Wearables Developer Center.

## Open the hosted sample

Open the hosted [launcher](https://facebook.github.io/meta-ray-ban-display-ui-toolkit-web/launcher/) in a browser. The sample card on the [samples and utilities page](https://facebook.github.io/meta-ray-ban-display-ui-toolkit-web/) includes a QR code for adding it to your own glasses.

## Preview with the Meta Ray-Ban Display Simulator

Follow the [Simulator guide](https://wearables.developer.meta.com/docs/develop/webapps/test/#preview-with-the-meta-ray-ban-display-simulator) to preview the hosted or local sample in a 600 × 600 additive-display frame in desktop Chrome. The extension provides directional controls, display and background tuning, multiple surroundings, viewport recording, and a QR code for adding the sample to your own glasses during development.

[Install the Simulator from the Chrome Web Store](https://chromewebstore.google.com/detail/meta-ray-ban-display-simu/jpjlmmodokemlepklkdbimceggpbjcll). Use it while iterating on layout, readability, focus, and application flows. The Simulator is a development preview and does not replace validation on Meta Ray-Ban Display glasses.

## Try the interaction model

The home feed uses a loading shimmer in place of widget content. Open Quick Settings, choose Settings, then App grid style to switch between the two-column tile layout and the three-column icon layout. The three-column icon layout is the default. On the first visit to All Apps, a brief toast points to Settings for trying the previous two-column layout. The reminder appears once in each app session.

## Run locally

From the repository root, install workspace dependencies and start Launcher:

```bash
yarn install
yarn workspace @meta/wearables-ui-toolkit-mrbd-example-launcher dev
```

Build and type-check the sample with:

```bash
yarn workspace @meta/wearables-ui-toolkit-mrbd-example-launcher build
```

Run its state and component tests with:

```bash
yarn workspace @meta/wearables-ui-toolkit-mrbd-example-launcher test
```

## Read the code

Start with these files:

1. `src/App.tsx` is the small composition root. It wires the two pagers to the three page components. `src/useLauncherNavigation.ts` keeps page, temporary mode, and browser Back behavior together.
2. `src/LauncherAgentTools.tsx` contains the optional WebMCP preference tools. `src/launcherCatalog.ts` defines immutable app and home-card data. `src/launcherState.ts` contains the pure reducer and React action wrappers. `src/appGridStyle.ts` owns the persisted layout preference.
3. `src/AllAppsPage.tsx`, `src/HomePage.tsx`, and `src/QuickSettingsPage.tsx` isolate each page's focus and interaction logic. `src/SettingsPage.tsx` and `src/AppGridStylePage.tsx` provide the nested settings flow.
4. `src/LauncherAppTile.tsx`, `src/LauncherIconGridTile.tsx`, `src/QuickSettingsAppTile.tsx`, `src/LauncherIcon.tsx`, and `src/LauncherChrome.tsx` contain reusable launcher-specific components. Low-level app-tile interpolation is isolated in `src/launcherAppTileAnimation.ts` so the component remains readable.
5. `src/appIcons.ts` selects filled app glyphs from the public icon package, records their optical adjustments, and prepares the transparent artwork used by `WebAppIcon` in the three-column grid.
6. `src/controlIcons.ts` imports control glyphs from that same package. Importing individual files keeps unused icons out of the bundle.
7. `src/appTileMaterials.ts` builds app-owned gradient materials from public toolkit material primitives.
8. `src/styles.css` defines the responsive page composition and the CSS variables driven by the focused, pinning, and slider modes.

## How the toolkit pieces fit together

- `<App>` installs the theme, Noto Sans, focus navigation, and floating UI host.
- The outer `<Pager>` owns the Quick Settings, Home, and All Apps pages. A nested vertical `<Pager>` moves between Home and the upper widget panel.
- `<ScrollView>` and `<VerticalList>` keep focused content visible as it moves.
- `<AppControlTile>` and `<ControlTile>` implement the quick-settings controls.
- `<Container>` is used for the launcher-specific app tile because pin mode adds coordinated icon, title, badge, and reorder animations beyond a standard tile's contract. The three-column grid gives each interactive container a `WebAppIcon` material derived from its app artwork and palette.
- `<PageTransition>`, `<Page>`, and `<VerticalList>` provide the Settings flow while preserving focus and scroll state across Back navigation.
- `<ListItem>`, `<Panel>`, `<PaginationIndicator>`, and `<Shimmer>` provide the remaining standard surfaces.

Directional focus and page changes remain owned by the toolkit. The few local keyboard handlers are limited to temporary modes: they close an expanded slider or pin mode and prevent those modes from passing directional input to a parent pager.

Quick Settings, All Apps, and the upper panel add same-document history entries, so browser Back returns to the center feed. Slider adjustment and pin management add another history entry above their page entry, so Back dismisses the temporary mode before leaving its page.

Before changing browser history, the sample calls `preserveFocusedInteractableDuringNavigation()`. This prevents an embedded browser that temporarily focuses its WebView root from clearing and then reapplying the current toolkit focus visual.

The page components receive only the state they render and are memoized, so a volume adjustment does not rerender the app grid or home feed.

The reducer keeps state transitions pure and atomic. Its tests demonstrate pin ordering, slider clamping, and temporary-state cleanup. Component tests cover both app-tile presentations, the style picker, launch-versus-pin behavior, and accessible selection state.

Pin management is intentionally shared by both grid styles so the sample keeps the layout comparison isolated from its app-ordering model.

## App-specific icons and materials

App and control glyphs come from `@wearables-ui-toolkit/icons`. The sample imports SVG files directly so that the chosen variant is obvious and unused glyphs stay out of the bundle. App icons and interactive control icons use filled variants. The battery status uses the regular eyeglasses outline because the public catalog does not provide a filled variant. `appIcons.ts` stores small optical scale and offset adjustments, along with an app-owned lighting color, beside each app glyph. This preserves the library artwork while accounting for the different perceived bounds of camera, compass, book, and other silhouettes.

Home-feed icons use the same `WebAppIcon` material and app-owned appearance palettes as the three-column app grid, scaled to the standard notification avatar slot with a local circular shape override. The surrounding notification material continues to own focus and activation.

The three app shortcuts in Quick Settings use the material factory through `AppControlTile`'s public icon-material slot and locally override the shape to a circle. Volume, brightness, toggles, and Settings remain control icons rather than app identities.

Each app palette in `appTileMaterials.ts` is ordered from its brightest stop to its darkest. Most stops move through neighboring hues to preserve a dominant color identity. Wider hue shifts should be rare and must remain smooth at both icon and full-tile scales. Relative luminance must continue decreasing; `appTileMaterials.test.ts` checks that invariant.

The three-column icon layout uses `createWebAppIconMaterial` to combine each transparent glyph with its app-owned palette, inner glow, artwork treatment, and partial-focus light. The launcher keeps focus, activation, labels, and pin badges on the surrounding `Container` while the `WebAppIcon` material owns the icon surface.

## Responsive layout

The example does not assume a fixed viewport. Tiles use a responsive shared height, the app grid adds columns only when they fit, quick settings falls back to one column, the icon-grid selector stacks on narrow displays, the icon grid scales its surfaces to retain three columns, material backgrounds measure their rendered content, and status chrome uses safe-area-aware fluid dimensions. On a square viewport, these rules produce the selected two- or three-column launcher layout.

Custom tile and reorder animations honor `prefers-reduced-motion`. Temporary `will-change` hints are applied only while the quick-settings overlay animates, which avoids retaining unnecessary compositing layers on constrained devices.
