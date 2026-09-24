# UI Toolkit component gallery

The component gallery is a runnable catalog of public UI Toolkit components. It groups components by purpose and gives each component a focused page for supported variants, interaction states, behavior, and design guidance.

Use the gallery when choosing a component, comparing related APIs, reviewing a state that is difficult to reproduce in an application, or checking how a component responds to directional focus.

## Documentation

Read the [component guidance](https://wearables.developer.meta.com/docs/develop/webapps/design/components/overview/) on the Wearables Developer Center before choosing an API. The [UI Toolkit overview](https://wearables.developer.meta.com/docs/develop/webapps/design/overview/) links to installation, foundations, application patterns, and validation material.

## Open the hosted sample

Open the hosted [component gallery](https://facebook.github.io/meta-ray-ban-display-ui-toolkit-web/component-gallery/) in a browser. The sample card on the [samples and utilities page](https://facebook.github.io/meta-ray-ban-display-ui-toolkit-web/) includes a QR code for adding the gallery to your own glasses.

## Preview with the Meta Ray-Ban Display Simulator

Follow the [Simulator guide](https://wearables.developer.meta.com/docs/develop/webapps/test/#preview-with-the-meta-ray-ban-display-simulator) to preview the hosted or local sample in a 600 × 600 additive-display frame in desktop Chrome. The extension provides directional controls, display and background tuning, multiple surroundings, viewport recording, and a QR code for adding the sample to your own glasses during development.

[Install the Simulator from the Chrome Web Store](https://chromewebstore.google.com/detail/meta-ray-ban-display-simu/jpjlmmodokemlepklkdbimceggpbjcll). Use it while iterating on layout, readability, focus, and application flows. The Simulator is a development preview and does not replace validation on Meta Ray-Ban Display glasses.

## What the gallery demonstrates

- Public components organized into actions, content, controls, feedback, lists, navigation, status and loading, and surfaces.
- Supported variants and visual states shown independently so they are easy to compare.
- Directional focus movement and focus-visible presentation.
- Responsive layouts that remain useful at different browser sizes.
- Guidance panels that keep component examples and usage advice together.
- Hash-based routes for opening a component page directly and preserving browser history.

The gallery is a component reference, not an application template. Use the launcher and messaging samples for complete screen composition and navigation flows.

## Run locally

From the repository root, install workspace dependencies and start the gallery:

```bash
yarn install
yarn workspace @meta/wearables-ui-toolkit-mrbd-gallery dev
```

Open the URL printed by Vite. Build and type-check the gallery with:

```bash
yarn workspace @meta/wearables-ui-toolkit-mrbd-gallery build
```

The build also verifies that the gallery references only assets included in its published output.

## Read the code

Start with these files:

1. `src/App.tsx` provides the application shell.
2. `src/GalleryRoutes.tsx` maps hash routes to categories and component pages.
3. `src/galleryCatalog.ts` defines the navigation catalog.
4. `src/components/GalleryPage.tsx` provides the shared component-page layout.
5. `src/components/DemoSection.tsx` separates examples into focused scenarios.
6. `src/components/GuidancePanel.tsx` presents usage guidance alongside demos.
7. `src/pages/` contains category pages; `src/pages/components/` contains one page for each component.

Keep a component's examples on its own page. This makes behavior, focus, accessibility, and visual states easier to evaluate without unrelated controls competing for attention.

## Optional WebMCP navigation

When the browser supports WebMCP, `GalleryAgentTools.tsx` registers an `open_component_demo` tool. An assistant can open a component or category by name, such as "Show me ButtonRail" or "Open the shimmer example."

The tool navigates to the same routes available in the visible gallery. The application remains fully usable through its normal controls when WebMCP is not available.

## Add or update a component page

- Put the page under `src/pages/components/` and register it in the catalog.
- Keep examples small enough that one state or behavior is obvious at a glance.
- Include labels that explain what changes between examples.
- Preserve directional access to every interactive example.
- Link deeper design or API guidance to the Wearables Developer Center rather than duplicating the full reference in the sample.
