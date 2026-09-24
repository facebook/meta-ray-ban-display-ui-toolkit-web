# @wearables-ui-toolkit/icons

The Icons package provides the optional SVG icon catalog for UI Toolkit for Meta Ray-Ban Display. It includes tree-shakeable named exports, individual SVG files, and searchable metadata for icon browsers and build tools.

## Documentation and browser

Use the hosted [icon browser](https://facebook.github.io/meta-ray-ban-display-ui-toolkit-web/utilities/icons/) to search by name or keyword, compare filled and outline styles, and copy the icon you need. Use the [app icon generator](https://facebook.github.io/meta-ray-ban-display-ui-toolkit-web/utilities/app-icons/) to preview how artwork and colors appear in different app icon contexts and download the generated assets. Read the [icon documentation](https://wearables.developer.meta.com/docs/develop/webapps/design/foundations/utilities/icons/) for icon-slot behavior, tinting, accessibility, and custom assets.

## Install

```bash
npm install @wearables-ui-toolkit/icons
```

The icon catalog is separate from `@wearables-ui-toolkit/mrbd`, so applications that do not use toolkit icons do not install it.

## Import an icon

Use named imports so bundlers can remove icons the application does not use:

```ts
import {
  airplaneFilled,
  airplaneOutline,
} from '@wearables-ui-toolkit/icons';
```

Pass the imported `IconSource` to a toolkit component's icon prop. The component owns icon size, layout, and tint as part of its anatomy.

Prefer a filled icon for an emphasized or selected state and an outline icon for a lower-emphasis state when both variants exist. Use one style consistently within an action group unless state is the reason for changing it.

## Use individual SVG files

Every published icon is also available as an SVG asset:

```text
@wearables-ui-toolkit/icons/svg/<name>.svg
```

Use individual files when a build system or asset pipeline consumes URLs rather than JavaScript exports. Avoid depending on the package's source directory or other unpublished paths.

## Build an icon browser

The package exports `manifest.json` and `keyword-index.json`. The browser helper resolves manifest entries without exposing the package's internal layout:

```ts
import { loadUITIconAssetUrl } from '@wearables-ui-toolkit/icons/browser';

const iconUrl = await loadUITIconAssetUrl('./svg/airplane__filled.svg');
```

Keyword fields are normalized to lowercase strings for stable search behavior. Avoid namespace imports or application-wide icon registry objects when bundle size matters because they can retain unused assets.

## Accessibility

Icons do not supply application meaning on their own. Provide the accessible name through the component or surrounding control. Decorative icons should not repeat a label that assistive technology already receives from the control.

## License

The package is licensed under the [Meta Wearables Developer Terms](https://wearables.developer.meta.com/terms/). See the package [`LICENSE`](./LICENSE) and project [`NOTICE`](../../NOTICE).
