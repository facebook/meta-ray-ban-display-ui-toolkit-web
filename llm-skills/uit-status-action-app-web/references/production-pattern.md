# Production status action application

Use this pattern for one focused status, monitoring, or session product with a
single primary state and one reversible action. The Page presents one coherent
information backdrop; the action changes that state. Do not introduce routes,
collections, tabs, or secondary features to make the product appear deeper.
This pattern has one boolean state only. Do not add timers, countdowns,
counters, `useEffect`, automatic transitions, or terminal completion; use the
timed-session pattern when the product requires them.

This is a source-construction task only. Never start or probe a development,
preview, browser-automation, or HTTP server; never inspect ports or search for a
browser binary. The focused verifier is the only execution step and successful
verification ends the task immediately.

## Fixed feature and file budget

Use only the toolkit `App`, `Page`, `ScrollView`, `Panel`, `TextView`, `TextStyle`,
`TextColor`, `Button`, `ButtonRail`, and `Toast`, plus React local state. Do not
add routing, SubNavigationPager, VerticalList, ListItem, ButtonGroup, Container,
Surface, StaticContainer, cards, chips, tags, badges, icons, menus, overlays,
forms, custom materials, HTML controls, or authored scrolling.

Use this fixed source partition:

- `main.tsx`: imports, the toolkit's `App` composition, and mount only;
- `StatusPage.tsx`: the complete Page and its local domain state;
- `app.css`: only the selectors and declarations shown below.

Do not inspect the toolkit source, package declarations, examples/gallery, tests,
validator source, built CSS, or icon directories. The public APIs below are
complete for this pattern.

## Root and page

Import styles once and mount exactly one page:

```tsx
import {App as UITApp} from '@wearables-ui-toolkit/mrbd';
import {createRoot} from 'react-dom/client';
import {StatusPage} from './StatusPage';
import './app.css';

function Root() {
  return (
    <UITApp>
      <StatusPage />
    </UITApp>
  );
}

createRoot(document.getElementById('root')!).render(<Root />);
```

Use a concise one- or two-word Page header that names the product or monitored
subject. Omit header metadata/status; the Panel owns the current state. Do not
repeat the Page header as the first line inside the Panel.

## Information and action structure

Use one full-height action shell. Its first track owns the only vertical scroll
owner. The one `Panel` is an edge-to-edge direct child of `ScrollView`; set
`width="100%"` rather than relying on its default width, and never place
horizontal padding around it. One authored `content-inset` inside the Panel
applies the large spacing token to all non-full-bleed content.

Keep the Panel to exactly four text roles:

1. one concise current-condition summary in `BODY2_EMPHASIZED`;
2. one short supporting sentence in `BODY2` that adds operational context;
3. the all-caps `STATUS` eyebrow in `LABEL` and `TextColor.SECONDARY`;
4. one compact current-state value in `META1`.

Use ordinary application language. Do not repeat the header, serialize mock
data, add instructional action prose, create field tiles, or place a second
Panel behind any subset of the content. Keep routine text at body, label, and
metadata styles; do not use heading, display, numeral, or BODY1 styles.

```tsx
import {useState} from 'react';
import {
  Button,
  ButtonRail,
  Page,
  Panel,
  ScrollView,
  TextColor,
  TextStyle,
  TextView,
  Toast,
} from '@wearables-ui-toolkit/mrbd';

export function StatusPage() {
  const [active, setActive] = useState(true);

  const handleToggle = () => {
    setActive(current => !current);
    Toast.show(active ? 'Light turned off' : 'Light turned on');
  };

  return (
    <Page headerText="Desk light" enableSystemBarInset={false}>
      <div className="action-page-shell">
        <ScrollView insetForHeader tabIndex={0} ariaLabel="Desk light status">
          <Panel width="100%">
            <div className="content-inset">
              <TextView as="p" textStyle={TextStyle.BODY2_EMPHASIZED}>
                {active ? 'Light is on' : 'Light is off'}
              </TextView>
              <TextView as="p" textStyle={TextStyle.BODY2}>
                The reading lamp illuminates the work area.
              </TextView>
              <TextView
                as="p"
                textStyle={TextStyle.LABEL}
                textColor={TextColor.SECONDARY}>
                STATUS
              </TextView>
              <TextView as="p" textStyle={TextStyle.META1}>
                {active ? 'Enabled' : 'Disabled'}
              </TextView>
            </div>
          </Panel>
        </ScrollView>
        <div className="action-dock">
          <ButtonRail>
            <Button
              title={active ? 'Turn off' : 'Turn on'}
              onClick={handleToggle}
            />
          </ButtonRail>
        </div>
      </div>
    </Page>
  );
}
```

The Button stays mounted and retains focus while its title and state value
change. It performs the named state operation before Toast feedback. Use a
short reversible verb pair appropriate to the product, such as Start/Stop,
Pause/Resume, Arm/Disarm, or Enable/Disable. Do not add Back, Home, Close,
Cancel, Settings, Edit, Share, or placeholder actions.

The operation must be safe and mean the same thing in the Button, state value,
summary, support copy, and Toast. Never pause, stop, disable, or mute core
measurement for food safety, health, environmental, security, or other
safety-critical monitoring. In those products, the boolean represents a
workflow state while monitoring continues: for example, `Needs review` /
`Acknowledged` with `Acknowledge` / `Reopen`. Both branches must explicitly
remain consistent with continuous monitoring. Do not conflate pausing
monitoring with muting alerts or encourage disabling protection during the
condition being monitored.

Acknowledgement also requires a concrete event worth reviewing. State the
actual alert, door event, threshold crossing, or excursion in the summary and
give its current operational context in supporting copy. Do not label a steady,
in-range reading `Needs review` merely to manufacture an action. For cold
storage, a legitimate pattern is a recorded door-open event while temperature
monitoring continues; acknowledgement records that workflow decision without
changing measurement.

## Layout

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

.action-page-shell {
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  block-size: 100%;
  min-block-size: 0;
  min-inline-size: 0;
}

.action-dock {
  min-inline-size: 0;
  padding-block-end: var(--uit-spacing-xsmall);
}

.content-inset {
  display: flex;
  flex-direction: column;
  gap: calc(var(--uit-spacing-large) + var(--uit-spacing-xsmall));
  min-inline-size: 0;
  padding: var(--uit-spacing-large);
}
```

Do not add selectors or declarations. Never style the toolkit internals: no component
descendants, rendered tags, generated classes, roles, ARIA/data attributes,
pseudo-elements, or DOM queries. Only the documented public props above
control component appearance and behavior. Do not author literal dimensions,
spacing, colors, corners, opacity, or motion.

## Pre-verification audit

Check once before verification:

- one App and one Page; no routes, pager, list, or extra component category;
- Page header is one or two words and is not repeated in Panel copy;
- one ScrollView with `insetForHeader`, `tabIndex={0}`, and a concise ariaLabel;
- exactly one Panel, directly inside ScrollView, containing one content-inset;
- exactly the four documented TextView roles, including secondary all-caps
  `STATUS`;
- one bottom ButtonRail and one persistent reversible Button;
- state value, button title, and Toast feedback update from the same operation;
- only the fixed tokenized stylesheet; no toolkit-internal styling.

Then run the absolute path to this skill's `scripts/verify-app.mjs` from the
application workspace. When it prints `UI Toolkit for Meta Ray-Ban Display status action verification passed.`,
return immediately. Do not start or probe a server or suggest a local run
command.
