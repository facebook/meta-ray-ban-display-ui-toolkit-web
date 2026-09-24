## Choose the text-entry pattern

`InputTextView` is the public free-form text-entry surface. It keeps a real textarea as the host focus and text-delivery target while the toolkit owns the text-input material, one-to-three-line growth, cursorless presentation, internal scrolling, fading edges, proportional scrollbar, and focus behavior.

Use controlled mode when validation, submission, route state, or async work owns the value. Use uncontrolled mode for a self-contained field that should clear itself after successful submission.

### Text entry without submission

Omit `onSend` when Enter must keep its normal multiline behavior:

```tsx
const [notes, setNotes] = useState('');

<InputTextView
  text={notes}
  hint="Add notes"
  onTextChange={setNotes}
  inputProps={{
    'aria-label': 'Notes',
    maxLength: 500,
  }}
/>
```

Do not attach an empty `onSend` callback. Its presence changes unmodified Enter into a submission key even when the action button is hidden.

### Text entry with the built-in action

Provide `onSend` and a localized `actionLabel`. `showActionButton` defaults to `true`; the component renders its own separate Button with the supported material, geometry, spacing, disabled-empty behavior, and focus traversal.

```tsx
const [message, setMessage] = useState('');

<InputTextView
  text={message}
  hint="Write a message"
  actionLabel="Send message"
  onTextChange={setMessage}
  onSend={submittedText => {
    sendMessage(submittedText);
    setMessage('');
  }}
/>
```

Do not place a separate Button beside `InputTextView`, and do not wrap its built-in action in ButtonGroup or ButtonRail. Use `actionIcon` or `actionButtonMaterial` only for a deliberate supported product treatment; otherwise keep the defaults. If submission must remain available through Enter without a visible action, set `showActionButton={false}` and keep `onSend`.

Unmodified, non-composing Enter submits when `onSend` exists. Shift+Enter inserts a line break. Modified Enter and input-method composition remain text-entry behavior. An empty Enter is consumed without calling `onSend`.

## Loading and progress

Use `showLoader` for active work whose completion cannot be estimated. Supply a localized `loadingLabel`. The loader occupies the field's accessory slot, animates the focused material, remains non-interactive, and becomes static when reduced motion is requested.

Known completion uses a separate labeled `ProgressIndicator` in the same content region:

```tsx
<div className="composer">
  <InputTextView
    text={message}
    hint="Write a message"
    onTextChange={setMessage}
    inputProps={{disabled: isSending}}
  />
  <TextView id="send-progress" textStyle={TextStyle.META1}>
    Sending message
  </TextView>
  <ProgressIndicator
    value={bytesSent}
    maximumValue={bytesTotal}
    animated={!prefersReducedMotion}
    aria-labelledby="send-progress"
  />
</div>
```

Use source units for `value`, `minimumValue`, and `maximumValue`; the component clamps and derives the percentage. Keep `animated` off when reduced motion is requested. Disable repeated announcements when a nearby status line already narrates the same progress or many indicators update together. Do not show `showLoader` and a `ProgressIndicator` for the same operation.

## Sizing, focus, and scrolling

- `InputTextViewSize.FULL` fills available width.
- `InputTextViewSize.SHRINK_WHEN_EMPTY` measures the rendered localized hint while empty, then expands to full width after text is entered.
- Text grows from one line to a three-line viewport, then scrolls internally.
- Up and Down restore a parent-clipped field before scrolling its text. At the internal edge, navigation yields to the surrounding focus or page scroller.
- When the action is visible, the inward horizontal direction moves from field to action; the outward direction or Up returns to the field.
- Keep the field outside another material-owning component and avoid another same-axis scroller around it.

The textarea is the input surface's only sequential focus target. The action is a separate target. The visible field intentionally exposes no insertion caret or pointer-based cursor movement because the embedding host owns text entry.

## Accessibility and state

- Pass localized `hint`, `actionLabel`, and `loadingLabel` values.
- Use `inputProps` for `disabled`, `readOnly`, `required`, `maxLength`, `autoComplete`, `inputMode`, and `aria-*` attributes.
- A visible action is disabled while text is empty; application code does not need to duplicate that rule.
- Controlled fields remain under application ownership after submission. Uncontrolled fields clear and emit `onTextChange('')`.
- Keep the field mounted across loading and submission state changes so focus does not jump.

## Validation matrix

Test empty and populated values, controlled and uncontrolled ownership, one-line growth through multiline overflow, localized empty hints, action shown and hidden, empty and non-empty submission, Enter and Shift+Enter, input-method composition, loading and reduced motion, disabled/read-only states, field-to-action traversal, internal-to-parent scroll handoff in both directions, focus restoration after host input closes, and text scale at every supported setting.
