# Next.js navigation sample

Next.js navigation is a small checklist app built with UI Toolkit and the Next.js App Router. It shows how to connect App Router navigation to toolkit Back handling, page transitions, and focus restoration with `@wearables-ui-toolkit/mrbd/next`.

Use this sample as a starting point when your application already uses Next.js, or when you want to see how toolkit navigation behaves across several levels of routes.

## Documentation

Read the [route navigation](https://wearables.developer.meta.com/docs/develop/webapps/design/guides/route-navigation/) and [navigation and focus](https://wearables.developer.meta.com/docs/develop/webapps/design/guides/navigation-and-focus/) guides on the Wearables Developer Center.

## What the sample demonstrates

- `NextNavigationProvider`, `App`, and `NextPageTransition` composed in the root layout, with one App Router route file for each URL.
- Screens rendered from the transition's `pathname`, so the page that is animating out keeps showing its own content.
- Three levels of routes (lists, a list, and an item) plus a settings screen, each navigated with `router.push`.
- System Back returning to the previous route and restoring focus to the row that opened it, including rows that were scrolled into view.
- Focus kept on the focused row while the browser applies each route change.
- Checklist state that lives above the page transition, so it survives navigation in both directions.
- A static export that runs on any static host, with a prerendered page for every route.

## Run locally

From the repository root, install workspace dependencies, build the toolkit packages, and start the sample:

```bash
yarn install
yarn build
yarn workspace @meta/wearables-ui-toolkit-mrbd-next-navigation dev
```

Build the static export into `examples/next-navigation/dist` with:

```bash
yarn workspace @meta/wearables-ui-toolkit-mrbd-next-navigation build
```

Serve `dist` from any static file server to preview the export. Each route is exported as a folder with an `index.html`, so deep links such as `/lists/groceries/` load directly.

Run its routing and checklist tests with:

```bash
yarn workspace @meta/wearables-ui-toolkit-mrbd-next-navigation test
```

## Preview with the Meta Ray-Ban Display Simulator

Follow the [Simulator guide](https://wearables.developer.meta.com/docs/develop/webapps/test/#preview-with-the-meta-ray-ban-display-simulator) to preview the local sample in a 600 × 600 additive-display frame in desktop Chrome. Use directional input to move through the lists and the Simulator's Back control to return. The Simulator is a development preview and does not replace validation on Meta Ray-Ban Display glasses.

## How the routes fit together

| Route | Screen |
| --- | --- |
| `/` | All lists, each with the number of items left, and a settings row. |
| `/lists/[listId]` | The items in one list. |
| `/lists/[listId]/items/[itemId]` | One item, with a switch that marks it done. |
| `/settings` | Whether completed items appear, and a reset action. |

The route files in `src/app` declare these URLs and return no content. `src/NavigationShell.tsx` maps each pathname to its screen with `resolveRoute` from `src/routes.ts`.
