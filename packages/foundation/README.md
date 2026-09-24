# @wearables-ui-toolkit/foundation

Foundation provides the lower-level React systems behind UI Toolkit for Meta Ray-Ban Display: semantic tokens, materials, shape geometry, motion, focus navigation, scrolling, paging, overlays, and reusable layout primitives.

Most applications should install `@wearables-ui-toolkit/mrbd`. Its root entry point re-exports Foundation, and its `App` configures the full experience for Meta Ray-Ban Display glasses. Install Foundation directly when building a lower-level integration, reusable library, or custom composition that does not need the device component catalog.

## Documentation

Read the [Foundation documentation](https://wearables.developer.meta.com/docs/develop/webapps/design/foundations/overview/) on the Wearables Developer Center. The [application guides](https://wearables.developer.meta.com/docs/develop/webapps/design/guides/application-structure/) show how Foundation systems work with the device component catalog.

## Install

```bash
npm install @wearables-ui-toolkit/foundation react@^19.2.7 react-dom@^19.2.7
```

Foundation requires Node.js 18 or later and ships ECMAScript modules with TypeScript declarations. Its `@wearables-ui-toolkit/androidx-shapes` dependency installs transitively.

Install React Router only when using the optional router integration:

```bash
npm install react-router-dom@^7.17.0
```

## Use Foundation

Import the complete public API from the package root:

```ts
import {
  App,
  Container,
  MaterialLibrary,
  TextAppearance,
  TextView,
  useFocusNavigation,
} from '@wearables-ui-toolkit/foundation';
```

Render Foundation content inside `App`. It loads the component and token styles and provides focus navigation and the floating portal root used by overlays.

## What Foundation provides

- **Semantic styling:** role-based colors, typography, spacing, corner radii, and CSS custom properties.
- **Materials and shapes:** smooth geometry, material layers, gradients, glows, strokes, shadows, and Canvas drawing primitives.
- **Interaction primitives:** focusable containers, surfaces, visual states, pressed behavior, and partial-focus behavior.
- **Directional focus:** traversal, focus sections, focus retention, Back navigation, and handoff between containers.
- **Scrolling and paging:** scroll views, vertical lists, pagers, carousels, and focus-aware visibility behavior.
- **Motion:** durations, interpolators, spring configurations, transitions, and reduced-motion support.
- **Application infrastructure:** page transitions, route preloading, floating portals, and optional React Router helpers.

Use the public props, composition points, semantic tokens, materials, and motion APIs to customize an interface. Generated class names and component internals are not compatibility surfaces.

## Entry points

| Entry point | Use for |
| --- | --- |
| `@wearables-ui-toolkit/foundation` | The complete Foundation API. |
| `@wearables-ui-toolkit/foundation/<path>` | Fine-grained modules such as `components/Container`. |
| `@wearables-ui-toolkit/foundation/react-router` | Optional React Router integration. |
| `@wearables-ui-toolkit/foundation/styles.css` | Compatibility stylesheet; `App` loads it automatically. |

Only paths declared by the package are public. Do not import files from `dist`. For TypeScript, use a module-resolution mode that understands package `exports`, such as `"bundler"`, `"node16"`, or `"nodenext"`.

## License

Licensed under the [Apache License 2.0](../../LICENSE). See the project [`NOTICE`](../../NOTICE) for additional terms.
