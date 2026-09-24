# UI Toolkit for Meta Ray-Ban Display

UI Toolkit brings the Meta Ray-Ban Display design system to React. Use its components, semantic tokens, materials, motion, accessibility behavior, and directional focus navigation to build interfaces that stay consistent across applications.

## Documentation

Start with the [UI Toolkit overview](https://wearables.developer.meta.com/docs/develop/webapps/design/overview/) on the Wearables Developer Center. Continue with the guide for the task:

- [Install UI Toolkit](https://wearables.developer.meta.com/docs/develop/webapps/design/getting-started/installation/)
- [Choose a component](https://wearables.developer.meta.com/docs/develop/webapps/design/components/overview/)
- [Structure an application](https://wearables.developer.meta.com/docs/develop/webapps/design/guides/application-structure/)
- [Apply foundations and design tokens](https://wearables.developer.meta.com/docs/develop/webapps/design/foundations/overview/)
- [Use icons](https://wearables.developer.meta.com/docs/develop/webapps/design/foundations/utilities/icons/)

[View the npm package](https://www.npmjs.com/package/@wearables-ui-toolkit/mrbd) or [report an issue](https://github.com/facebook/meta-ray-ban-display-ui-toolkit-web/issues).

## Quick start

For applications that consume the package, use Node.js 18 or later and a build tool or runtime that supports ECMAScript modules.

### 1. Install the package

Add the main package and its React peer dependencies to an existing React application:

```bash
npm install @wearables-ui-toolkit/mrbd react@^19.2.7 react-dom@^19.2.7
```

The main package installs Foundation and its shape dependency transitively. It also includes TypeScript declarations. No separate stylesheet, font package, or `@types` package is needed.

### 2. Size the application root

`App` fills its parent. Give the document and mount element a height, and use the window-background semantic token for areas outside the app root:

```css
html,
body,
#root {
  height: 100%;
  margin: 0;
  background-color: var(--uit-color-background-window);
}
```

### 3. Render the interface inside `App`

`App` loads the packaged styles and fonts and provides focus navigation, overlays, toast presentation, and the other runtime services used by toolkit components:

```tsx
import { createRoot } from 'react-dom/client';
import { App, Button, Page } from '@wearables-ui-toolkit/mrbd';

function Root() {
  return (
    <App>
      <Page headerText="Welcome">
        <Button title="Continue" onClick={() => {}} />
      </Page>
    </App>
  );
}

createRoot(document.getElementById('root')!).render(<Root />);
```

Every toolkit surface must render inside one `App` at the application root. Because `App` loads the toolkit stylesheet, applications should not import `@wearables-ui-toolkit/mrbd/styles.css` manually.

### Optional packages and integrations

Install the icon catalog when the application uses toolkit icons:

```bash
npm install @wearables-ui-toolkit/icons
```

Use named imports so bundlers can remove unused icons:

```ts
import { airplaneFilled } from '@wearables-ui-toolkit/icons';
```

Install React Router only when the application uses the router integration:

```bash
npm install react-router-dom@^7.17.0
```

```tsx
import {
  ReactRouterNavigationProvider,
  ReactRouterPageTransition,
  ReactRouterPreloadLink,
} from '@wearables-ui-toolkit/mrbd/react-router';
```

Import components from the package root or a supported component subpath:

```ts
import { Button } from '@wearables-ui-toolkit/mrbd';
import { ListItem } from '@wearables-ui-toolkit/mrbd/ListItem';
```

Only entry points declared by the package are public; do not import files from `dist`. For TypeScript, use a module-resolution mode that understands package `exports`, such as `"bundler"`, `"node16"`, or `"nodenext"`.

After completing these steps, the application can render its first toolkit screen. The package's exported TypeScript declarations are the authoritative prop-level reference.

## What the toolkit provides

- **Display-aware components:** controls, lists, navigation, overlays, status, media, and content surfaces designed for the additive-light display.
- **Directional focus navigation:** coordinated focus movement, focus retention, scrolling handoff, and overlay behavior.
- **Semantic styling:** role-based colors, typography, spacing, corner radii, materials, and motion that applications can theme through public tokens.
- **Accessible interaction:** component semantics, state communication, reduced-motion support, and labeling APIs.
- **Application infrastructure:** the `App` shell, page transitions, route preloading, portals, toasts, and optional React Router integration.

## Samples and utilities

Explore the hosted [samples and utilities](https://facebook.github.io/meta-ray-ban-display-ui-toolkit-web/) for the component gallery, launcher examples, messaging example, icon browser, and app icon generator. Each sample card includes a QR code for adding the app to your own glasses.

## Preview in Chrome

Use the [Meta Ray-Ban Display Simulator](https://wearables.developer.meta.com/docs/develop/webapps/test/#preview-with-the-meta-ray-ban-display-simulator) to preview a Web App in a 600 × 600 additive-display frame in desktop Chrome. The extension provides directional controls, display and background tuning, multiple surroundings, viewport recording, and a QR code for adding the Web App to your own glasses during development.

[Install the simulator from the Chrome Web Store](https://chromewebstore.google.com/detail/meta-ray-ban-display-simu/jpjlmmodokemlepklkdbimceggpbjcll). Use it to iterate on layout, readability, focus, and application flows before device testing. The simulator is a development preview and does not replace validation on Meta Ray-Ban Display glasses.

## Packages

| Package | Purpose |
| --- | --- |
| [`@wearables-ui-toolkit/mrbd`](https://www.npmjs.com/package/@wearables-ui-toolkit/mrbd) | Primary application package: app shell, component catalog for Meta Ray-Ban Display glasses, and re-exported Foundation API. |
| [`@wearables-ui-toolkit/icons`](https://www.npmjs.com/package/@wearables-ui-toolkit/icons) | Optional SVG icon catalog with tree-shakeable exports, individual assets, and searchable metadata. |
| [`@wearables-ui-toolkit/foundation`](https://www.npmjs.com/package/@wearables-ui-toolkit/foundation) | Lower-level primitives, materials, motion, focus navigation, and utilities. Most applications consume it through `mrbd`. |
| [`@wearables-ui-toolkit/androidx-shapes`](https://www.npmjs.com/package/@wearables-ui-toolkit/androidx-shapes) | Attributed smooth-shape geometry installed transitively by Foundation. |

## Develop this repository

To develop the repository's Vite-based samples, use Node.js 20.19.x or Node.js 22.12 or later. Install workspace dependencies once:

```bash
yarn install
```

Open a hosted sample or run it from the repository root:

Use the [samples and utilities page](https://facebook.github.io/meta-ray-ban-display-ui-toolkit-web/) to browse all hosted samples and find QR codes for opening them on your Meta Ray-Ban Display glasses.

| Sample | Hosted | Local command |
| --- | --- | --- |
| Component gallery | [Open](https://facebook.github.io/meta-ray-ban-display-ui-toolkit-web/component-gallery/) | `yarn workspace @meta/wearables-ui-toolkit-mrbd-gallery dev` |
| Launcher | [Open](https://facebook.github.io/meta-ray-ban-display-ui-toolkit-web/launcher/) | `yarn workspace @meta/wearables-ui-toolkit-mrbd-example-launcher dev` |
| Alpha launcher | [Open](https://facebook.github.io/meta-ray-ban-display-ui-toolkit-web/alpha-launcher/) | `yarn workspace @meta/wearables-ui-toolkit-mrbd-alpha-launcher dev` |
| Messaging | [Open](https://facebook.github.io/meta-ray-ban-display-ui-toolkit-web/messaging/) | `yarn workspace @meta/wearables-ui-toolkit-mrbd-messaging-demo dev` |

Pushes to `main` publish the hosted samples and utility index to GitHub Pages.

## AI coding support

The optional [`llm-skills`](llm-skills/) collection provides toolkit-specific component, theming, navigation, and validation guidance to compatible coding agents. Follow the [coding-agent skills guide](https://wearables.developer.meta.com/docs/develop/webapps/design/getting-started/coding-agent-skills/) to install the complete set for Muse Code, Codex, or Claude Code.

## Contributing and support

You can contribute focused bug fixes, documentation corrections, example repairs, and accessibility fixes. New components, visual-design changes, and public API changes follow Meta's design-system process. Read [`CONTRIBUTING.md`](CONTRIBUTING.md) before opening a pull request.

Use [GitHub issues](https://github.com/facebook/meta-ray-ban-display-ui-toolkit-web/issues) for public bugs and feature requests. Report security vulnerabilities through Meta's [Bug Bounty program](https://www.facebook.com/whitehat/) instead of a public issue.

## License

The project's software source code is licensed under the [Apache License 2.0](LICENSE), except where a package identifies separate terms. The [`@wearables-ui-toolkit/icons`](packages/icons/README.md) package is licensed under the [Meta Wearables Developer Terms](https://wearables.developer.meta.com/terms/). See the icon package [`LICENSE`](packages/icons/LICENSE) and the project [`NOTICE`](NOTICE). Font files and font software are excluded from the Apache license grant.
