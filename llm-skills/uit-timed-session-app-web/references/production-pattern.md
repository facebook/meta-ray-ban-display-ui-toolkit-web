# Production timed session application

## Acceptance boundary

Treat the supplied root scaffold (`package.json`, HTML, TypeScript config, Vite
config, and dependencies) as caller-owned and already valid. Do not list or
read it. Write only the three source files named below. Do not list this skill
directory or open either verifier. Run the timed-session verifier exactly once
after a coherent source write; if it succeeds, stop immediately. Do not inspect
artifacts, discover runtimes or browsers, start a server, or repeat its gates.

Use this pattern for one countdown or timed session that runs, pauses, reaches
terminal completion, and can restart. The displayed summary, status value, and
single persistent action must always derive from the same phase state.

## Fixed feature and file budget

Use only the toolkit `App`, `Page`, `ScrollView`, `Panel`, `TextView`, `TextStyle`,
`TextColor`, `Button`, `ButtonRail`, and `Toast`, plus React `useEffect` and
`useState`. Do not add routes, pagers, lists, extra actions, progress lookalikes,
HTML controls, custom materials, or authored scrolling.

Use exactly `main.tsx`, `TimedSessionPage.tsx`, and `app.css`. Use the root and
application CSS from the status-action pattern below; do not inspect package source,
examples, tests, validator source, built CSS, or icon directories.

## Root and layout

Mount exactly this root; do not add StrictMode, router infrastructure, or an
explicit `JSX.Element` return type:

```tsx
import {App as UITApp} from '@wearables-ui-toolkit/mrbd';
import {createRoot} from 'react-dom/client';
import {TimedSessionPage} from './TimedSessionPage';
import './app.css';

function Root() {
  return (
    <UITApp>
      <TimedSessionPage />
    </UITApp>
  );
}

createRoot(document.getElementById('root')!).render(<Root />);
```

Export the page as `export function TimedSessionPage()`. Use this complete
authored stylesheet:

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

Do not add selectors or declarations. Never style the toolkit internals. Use a one- or
two-word Page header. The only `ScrollView` has `insetForHeader`, `tabIndex={0}`,
and a concise ariaLabel. Its one edge-to-edge direct child `Panel` contains one
`content-inset`. A bottom `ButtonRail` contains one persistent Button.

## Session state machine

Use this exact phase model:

```ts
type SessionPhase = 'running' | 'paused' | 'complete';
```

Keep one `phase` state and one nonnegative `remainingSeconds` state. Use normal,
readable React destructuring: `const [remainingSeconds, setRemainingSeconds] =
useState(FULL_DURATION_SECONDS)`. Do not hide state in an indexed tuple, alias
it to satisfy validation, or otherwise optimize for the verifier. The effect
depends only on `phase`; it owns one interval only while running. A functional
remaining-time update transitions to `complete` at zero:

```tsx
useEffect(() => {
  if (phase !== 'running') {
    return;
  }

  const intervalId = window.setInterval(() => {
    setRemainingSeconds(previous => {
      if (previous <= 1) {
        setPhase('complete');
        return 0;
      }
      return previous - 1;
    });
  }, 1000);

  return () => window.clearInterval(intervalId);
}, [phase]);
```

Do not include remaining time in the effect dependency list and do not create
one interval per tick. Format the countdown as a compact `MM:SS` string with
two-digit minutes and seconds. The duration and interval are domain behavior,
not layout values; all CSS remains tokenized.

Derive every visible state from `phase`:

| Phase | Summary/supporting meaning | Status | Button | Select result |
|---|---|---|---|---|
| `running` | remaining time plus conditions to maintain while active | `Timing` | `Pause` | phase becomes `paused`; toast confirms pause |
| `paused` | same remaining time plus accurate paused-session context | `Paused` | `Resume` | phase becomes `running`; toast confirms resume |
| `complete` | completion outcome plus the truthful next step | `Complete` | `Restart` | reset full duration, phase becomes `running`; toast confirms restart |

The Button remains mounted in every phase. Never show `Timing` or `Pause` at
zero. Completion must not remove focus or leave an obsolete command.

## Information structure

Keep the Panel to exactly four TextViews:

1. phase-derived summary using `BODY2_EMPHASIZED`;
2. one short phase-derived task/context sentence using `BODY2`;
3. all-caps `STATUS` using `LABEL` and `TextColor.SECONDARY`;
4. phase-derived status value using `META1`.

Derive `supportingCopy` from all three phase branches just like summary, status,
and action. Running copy may state the conditions to maintain. Paused copy must
remain accurate while domain activity continues but timing is stopped.
Complete copy states the truthful next step and must not repeat an instruction
that ended with the session. Do not reuse one constant merely because it avoids
phase words.

Do not imitate a Progress component, add a second timer visualization, repeat
the Page header, or append instructional prose. Routine content stays within
body, label, and metadata styles.

## Pre-verification audit

Check once before verification:

- exact three-phase model with a nonnegative remaining-time state;
- one interval while running, effect depends only on phase, zero transitions to
  `complete`;
- summary, status, and persistent action all handle running, paused, complete,
  and restart;
- supporting copy handles running, paused, and complete without contradiction;
- one Page, one focusable inset ScrollView, one direct-child Panel, four
  TextViews, one bottom ButtonRail, and one Button;
- Panel content uses the prescribed large-plus-xsmall text-stack rhythm; rail
  uses the xsmall bottom token;
- no additional selectors, toolkit-internal styles, or non-token design values.

Then run the absolute path to this skill's `scripts/verify-app.mjs` from the
application workspace. When it prints `UI Toolkit for Meta Ray-Ban Display timed session verification passed.`,
stop and report; do not perform additional discovery or validation.
