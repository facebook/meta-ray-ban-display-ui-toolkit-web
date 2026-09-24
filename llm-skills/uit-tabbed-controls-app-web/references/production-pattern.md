# Production tabbed controls application

Use this pattern for one focused product with two peer control categories:
independent boolean controls and one mutually exclusive mode collection. The
`SubNavigationPager` replaces `Page`; a ButtonRail/ButtonGroup never acts as
tabs.

## Fixed feature and file budget

Use only the toolkit `App`, `SubNavigationPager`, `VerticalList`, and `ListItem`, React
state/context, and two known filled tab icons. Do not add routes, Page, Header,
ScrollView, Button, ButtonRail, ButtonGroup, Panel, Container, Surface,
StaticContainer, custom materials, overlays, forms, HTML controls, or authored
scrolling.

Use this fixed source partition:

- `main.tsx`: imports, the toolkit's `App` composition, and mount;
- `ControlContext.tsx`: durable control/mode state and operations;
- `pages/ControlsPage.tsx`: one VerticalList of integrated switch rows;
- `pages/ModesPage.tsx`: one VerticalList of integrated radio rows;
- `TabbedControls.tsx`: controlled SubNavigationPager only;
- `app.css`: window root rules only.

Do not inspect the toolkit source, package declarations, examples/gallery, tests,
validator source, built CSS, or icon directories. The exact public APIs and icon
imports are below.

## Root and pager

Import styles once and mount the durable provider outside the pager:

```tsx
import {App as UITApp} from '@wearables-ui-toolkit/mrbd';
import {createRoot} from 'react-dom/client';
import {ControlProvider} from './ControlContext';
import {TabbedControls} from './TabbedControls';
import './app.css';

function Root() {
  return (
    <UITApp>
      <ControlProvider>
        <TabbedControls />
      </ControlProvider>
    </UITApp>
  );
}

createRoot(document.getElementById('root')!).render(<Root />);
```

Choose exactly one supported category preset from the product brief. Use its
semantically exact filled icon subpaths; do not mix presets or substitute a
generic status icon:

```tsx
// General controls and modes
import circleCheckFilled from '@wearables-ui-toolkit/icons/svg/circlecheck__filled.svg';
import sliders2HorizontalFilled from '@wearables-ui-toolkit/icons/svg/sliders2horizontal__filled.svg';

// Audio output and microphone
import microphoneFilled from '@wearables-ui-toolkit/icons/svg/microphone__filled.svg';
import speakerSliderFilled from '@wearables-ui-toolkit/icons/svg/speakerslider__filled.svg';
```

The pager is controlled so selection remains stable through state updates. Tab
labels are exactly one word. Each item has its required icon and exactly one
direct child page:

```tsx
export function TabbedControls() {
  const {pageIndex, setPageIndex} = useControls();

  return (
    <SubNavigationPager
      items={[
        {label: 'Controls', icon: sliders2HorizontalFilled},
        {label: 'Modes', icon: circleCheckFilled},
      ]}
      currentPageIndex={pageIndex}
      onPageChange={setPageIndex}
      homeIndex={0}
      ariaLabel="Device controls">
      <ControlsPage />
      <ModesPage />
    </SubNavigationPager>
  );
}
```

The example above is the general settings preset. For an audio brief, replace
only that `items` value with:

```tsx
items={[
  {label: 'Output', icon: speakerSliderFilled},
  {label: 'Mic', icon: microphoneFilled},
]}
```

Labels remain one word. An icon must name the category itself; a checkmark is
not a microphone and sliders are not audio output.

Do not wrap the pager in Page or another layout/scroll element. Do not render
SubNavigation directly.

## Controls page

Every pager child owns exactly one edge-to-edge `VerticalList` with
`insetForHeader`. It contains adjacent ListItems only—no section labels, Panels,
dividers, gaps, summaries, or footers. The integrated switch is part of its
owning row; never render a standalone Switch or HTML checkbox.

```tsx
export function ControlsPage() {
  const {controls, setControl} = useControls();

  return (
    <VerticalList insetForHeader ariaLabel="Controls">
      {controls.map(control => (
        <ListItem
          key={control.id}
          title={control.title}
          subtitle={control.subtitle}
          showSwitch
          checked={control.enabled}
          onCheckedChange={checked => setControl(control.id, checked)}
        />
      ))}
    </VerticalList>
  );
}
```

Create six realistic control records. Title is a compact one- or two-word
identity. Subtitle is one terse effect/context fact: use at most three short
words and never exceed 14 characters, so it remains fully visible beside the
integrated switch at compact layouts. Built-in subtitle
styling is secondary—never restyle component internals. Changing a row updates
durable state immediately; do not add Toast for routine switch changes.

Every switch must represent a genuinely binary feature with clear enabled and
disabled meanings. Do not model a scalar or directional value such as balance,
volume, intensity, level, pan, or position as a switch; use another real binary
feature such as Mono instead. Static supporting copy describes the feature's
purpose and remains true in both states. It must not claim `on`, `off`,
`enabled`, `disabled`, `centered`, or another mutable result. If a changing
state label is genuinely valuable, derive it from `control.enabled` rather than
storing contradictory static copy.

Compact copy must still sound natural. For an audio preset, good pairs include
`Immersive` / `Wider stage`, `Bass Boost` / `Low-end lift`, `Noise Cancel` /
`Reduce noise`, `Transparency` / `Ambient audio`, `Limiter` / `Protect peaks`,
and `Mono` / `Single channel`. Avoid compressed fragments such as `Deep low`,
`Quiet on`, or `Front voice`.

## Modes page

Use the integrated ListItem radio treatment for one controlled choice. The
radio is visual state owned by the interactive ListItem, not a standalone
control:

```tsx
export function ModesPage() {
  const {modes, activeModeId, setActiveMode} = useControls();

  return (
    <VerticalList insetForHeader ariaLabel="Modes">
      {modes.map(mode => (
        <ListItem
          key={mode.id}
          title={mode.title}
          subtitle={mode.subtitle}
          showRadioButton
          checked={activeModeId === mode.id}
          onCheckedChange={checked => {
            if (checked) setActiveMode(mode.id);
          }}
        />
      ))}
    </VerticalList>
  );
}
```

Create four compact modes. Apply the same 14-character subtitle limit because
the integrated radio also occupies row width. Exactly one mode is selected. A
false radio callback does not clear the selection; a true callback selects that
row. Do not use `aria-selected`, accessory icons, or a second click handler.

Responsive brevity must preserve grammar and domain accuracy. For the audio
preset, use capability copy that describes the pickup pattern: `Cardioid` /
`Front focus`, `Omni` / `All around`, `Figure-8` / `Front + back`, and
`Shotgun` / `Narrow focus`. Do not claim that Shotgun guarantees distant
clarity, and do not describe Figure-8 vaguely as dual capture.

## State and layout

Keep `pageIndex`, control records, and `activeModeId` in `ControlProvider`.
Operations must update immutable state. Do not remove or reorder the focused row
as a side effect.

The complete authored stylesheet is:

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
```

Do not add selectors. Never style the toolkit internals: no descendants, rendered tags,
generated classes, roles, ARIA/data attributes, pseudo-elements, or DOM queries.
Only the documented public props above control component appearance/behavior.

## Pre-verification audit

Check once before verification:

- no Page/routes/action rail; one controlled SubNavigationPager root;
- exactly two one-word items with the specified filled icons and two children;
- each child file owns one VerticalList with `insetForHeader`;
- ControlsPage uses only integrated switches; ModesPage uses only integrated
  radios and always retains one selection;
- adjacent ListItems, concise titles/subtitles, no toolkit-internal styling;
- state survives pager changes and handlers perform real state updates.

Then run the absolute path to this skill's `scripts/verify-app.mjs` from the
application workspace. When it prints `UI Toolkit for Meta Ray-Ban Display tabbed controls verification passed.`,
return immediately. Do not start or probe a server or suggest a local run
command.
