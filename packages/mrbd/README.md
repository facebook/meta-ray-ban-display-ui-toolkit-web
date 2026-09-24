# UI Toolkit for Meta Ray-Ban Display

UI Toolkit brings the Meta Ray-Ban Display design system to React. `@wearables-ui-toolkit/mrbd` is the primary application package. It provides the `App` shell, components, semantic tokens, materials, motion, accessibility behavior, and directional focus navigation for Web Apps on Meta Ray-Ban Display glasses.

## Documentation

Start with the [UI Toolkit overview](https://wearables.developer.meta.com/docs/develop/webapps/design/overview/) on the Wearables Developer Center. Continue with the guide for the task:

- [Installation](https://wearables.developer.meta.com/docs/develop/webapps/design/getting-started/installation/)
- [Component guidance](https://wearables.developer.meta.com/docs/develop/webapps/design/components/overview/)
- [Application structure](https://wearables.developer.meta.com/docs/develop/webapps/design/guides/application-structure/)
- [Navigation and focus](https://wearables.developer.meta.com/docs/develop/webapps/design/guides/navigation-and-focus/)
- [Theming and customization](https://wearables.developer.meta.com/docs/develop/webapps/design/guides/theming-and-customization/)

Explore the hosted [samples and utilities](https://facebook.github.io/meta-ray-ban-display-ui-toolkit-web/) for complete app flows, the component gallery, and icon tools.

## Requirements

| Requirement | Value |
| --- | --- |
| `react` | `^19.2.7` peer dependency |
| `react-dom` | `^19.2.7` peer dependency |
| `react-router-dom` | `^7.17.0` — optional peer dependency, needed only for the `@wearables-ui-toolkit/mrbd/react-router` subpath |
| Node | `>=18` |
| Module format | **ESM only.** The package ships ECMAScript modules; there is no CommonJS build. |

The library is built with the React Compiler.

## Install

Install the main package and its React peer dependencies:

```bash
npm install @wearables-ui-toolkit/mrbd react@^19.2.7 react-dom@^19.2.7
```

The main package installs Foundation and its shape dependency transitively. Install `react-router-dom@^7.17.0` only when using the router integration subpath, and install `@wearables-ui-toolkit/icons` only when the application uses the optional icon catalog. Each component owns its CSS module, and `App` automatically loads the packaged component styles and semantic design tokens.

See the [installation guide](https://wearables.developer.meta.com/docs/develop/webapps/design/getting-started/installation/) for package and TypeScript setup.

## Quick start

`App` fills its parent. Size the document and mount element and use the semantic window-background token outside the app root:

```css
html,
body,
#root {
  height: 100%;
  margin: 0;
  background-color: var(--uit-color-background-window);
}
```

Render the interface inside `App`:

```tsx
import { createRoot } from 'react-dom/client';
import { App, Button, Page } from '@wearables-ui-toolkit/mrbd';

function Root() {
  return (
    <App>
      <Page>
        <Button title="Reply" onClick={() => console.log('clicked')} />
      </Page>
    </App>
  );
}

createRoot(document.getElementById('root')!).render(<Root />);
```

`App` loads the packaged styles and fonts and provides focus navigation, overlays, toasts, and other shared runtime services. Applications should not import `@wearables-ui-toolkit/mrbd/styles.css` manually.

## What the package provides

- **Application shell:** the `App` root, page structure, overlays, toasts, and shared runtime providers.
- **Display-aware components:** actions, lists, controls, navigation, feedback, status, media, and content surfaces.
- **Directional focus:** traversal, focus retention, scroll handoff, Back navigation, and focus-aware overlays.
- **Semantic styling:** role-based colors, typography, spacing, materials, shapes, and motion.
- **Application infrastructure:** page transitions, route preloading, portals, and optional React Router integration.
- **Foundation API:** lower-level primitives and utilities re-exported from the package root.

## Optional packages

Install the icon catalog when the application uses toolkit icons:

```bash
npm install @wearables-ui-toolkit/icons
```

Install React Router only when using the router integration:

```bash
npm install react-router-dom@^7.17.0
```

## AI coding skills

Optional coding-agent skills are distributed through the [GitHub repository](https://github.com/facebook/meta-ray-ban-display-ui-toolkit-web), not through the npm package. Follow the [coding-agent skills guide](https://wearables.developer.meta.com/docs/develop/webapps/design/getting-started/coding-agent-skills/) to install them for Muse Code, Codex, or Claude Code.

## App shell

Every toolkit surface must render inside `App`. It loads the packaged styles, establishes the themed root that the reset and base typography are scoped to, registers the Noto Sans font faces, and provides focus coordination, directional navigation, toasts, and the floating portal root used by overlays. Configurations that do not use `App` are unsupported and may break in future releases.

`App` prefers a locally installed copy of Noto Sans and falls back to loading it from the Google Fonts CDN at runtime, so there is no font package to install.

`Page` is the standard route-level container and owns the vertical system inset for page content. Pass `enableSystemBarInset={false}` when a screen must draw to the edges. Use `SubNavigationPager` instead of `Page` when a route is a small set of peer tabs; it is a route root in its own right and supplies its own top chrome, so the two are never nested.

## Import paths

| Entry point | Use for |
| --- | --- |
| `@wearables-ui-toolkit/mrbd` | Everything the package exports, from one import. |
| `@wearables-ui-toolkit/mrbd/styles.css` | Self-contained compatibility bundle of Foundation and MRBD component styles. |
| `@wearables-ui-toolkit/mrbd/<Component>` | Component subpaths for Meta Ray-Ban Display glasses, for example `@wearables-ui-toolkit/mrbd/Button`. |
| `@wearables-ui-toolkit/mrbd/react-router` | Optional React Router integration. |

```ts
import { Button } from '@wearables-ui-toolkit/mrbd/Button';
```

Per-component subpaths cover the Meta Ray-Ban Display components and their related exports. The root entry point also re-exports the lower-level foundation API. Most applications can import everything from the main package; advanced integrations can import foundation primitives directly from `@wearables-ui-toolkit/foundation` and its documented subpaths.

The router subpath adds back navigation, history-aware page transitions, and route preloading on top of React Router:

```tsx
import {
  ReactRouterNavigationProvider,
  ReactRouterPageTransition,
  ReactRouterPreloadLink,
} from '@wearables-ui-toolkit/mrbd/react-router';
```

It also exports `useReactRouterNavigation`, `useReactRouterPageTransition`, `getBrowserHistoryIndex`, and `getPageTransitionDirectionForHistory`.

## What the package exports

| Area | Exports |
| --- | --- |
| App shell and typography | `App`, `TextAppearance` |
| Text and media | `TextView`, `TextSwitcher`, `ReadMoreTextView`, `IconImage`, `IconWithContainerMaterial`, `WebAppIcon`, `MediaWrapper`, `Vignette`, `Shimmer`, `ShimmerItem` |
| Containers and surfaces | `Container`, `StaticContainer`, `Panel`, `Surface`, `Card`, `CardAboveScrim`, `CardBelowScrim`, `CardStack`, `ContainerHeader`, `Scrim` |
| Lists, scrolling, paging | `ScrollView`, `VerticalList`, `Pager`, `PagerPage`, `usePagerPageLifecycle`, `Carousel`, `ListItem`, `SwipeToReveal` |
| Actions and controls | `Button`, `ButtonGroup`, `ButtonRail`, `ButtonDivider`, `QuickReplyButton`, `Switch`, `RadioButton`, `SliderBar`, `Scrubber`, `ControlTile`, `AppControlTile`, `IsolatedControl`, `Chip`, `Tag`, `Divider` |
| Screens and navigation chrome | `Page`, `Header`, `SubNavigation`, `SubNavigationPager`, `ActionHint` |
| Overlays and feedback | `Modal`, `Toast`, `ToastContainer`, `useToast`, `Tooltip`, `useTooltip`, `TooltipContainer`, `ContextMenu`, `ContextMenuItemView`, `ButtonContextMenuItemView`, `EmojiContextMenuItemView`, `VerticalMenu`, `VerticalMenuButton`, `getVerticalMenuAnchorProps` |
| Status and progress | `ProgressRing`, `ProgressIndicator`, `CircularProgressBar`, `IndeterminateLoader`, `PaginationIndicator`, `SwipeIndicator`, `VolumeIndicator`, `ZoomIndicator`, `Avatar`, `AppBadge`, `NotificationBadge` |
| Focus and routing | `FocusNavigationProvider`, `useFocusNavigation`, `useBackNavigation`, `preserveFocusedInteractableDuringNavigation`, `PageTransition`, `DefaultPageTransitionConfig`, `InAppPageTransitionConfig`, `AppSwitchPageTransitionConfig`, `RoutePreloadProvider`, `RoutePreloadTarget`, `useRoutePreloader`, `useRoutePreloadTarget`, `createPreloadableLazyComponent` |
| Motion | `AnimationDurations`, `Interpolators`, `SpringConfigs`, `createTransition`, `reducedMotionDuration`, `useSpringAnimation`, `usePrefersReducedMotion` |
| Materials | `ContainerMaterial`, `MaterialLibrary`, `createDefaultContainerMaterial`, `createBackgroundImageBlurContainerMaterial`, `createClockPillContainerMaterial`, `createReducedOpacityStaticContainerMaterial`, `createStatusIndicatorPanelContainerMaterial`, `createLayer`, `CornerRadius`, `LayerPlacement`, the typed material layer classes, the default layer factories, shape providers, and Canvas drawing primitives |
| Interaction primitives | `InteractableBase`, `State`, `VisualState`, `ContentScaleInsets`, `getContentScaleForState`, `Platform`, `TooltipMode`, `PartialFocusSupportedAxis` |
| Utilities | `generateSmoothRoundedRectPath`, `getCachedSmoothRoundedRectPath`, `clearPathCache`, `FloatingPortalRootProvider`, `useFloatingPortalRoot` |

Enum-style value objects (`TextStyle`, `TextColor`, `AvatarSize`, `ChipStyle`, `ScrollViewOrientation`, and the rest) are exported alongside their components, as are the `*Props` types and the imperative handle types (`ButtonHandle`, `PagerHandle`, `CarouselHandle`, `ContextMenuHandle`, `PageHandle`, and others). Tint roles ship with resolver helpers next to their enums — `getIconTintCSSVariable`, `getIconTintBlendMode`, `getTimestampTextCSSVariable`, and `getTimestampTextBlendMode` — for markup the library does not render itself. The package's exported TypeScript declarations are the authoritative prop-level reference.

## License

Licensed under the [Apache License 2.0](../../LICENSE). Font files and font software are not included in this package; see the project [`NOTICE`](../../NOTICE).
