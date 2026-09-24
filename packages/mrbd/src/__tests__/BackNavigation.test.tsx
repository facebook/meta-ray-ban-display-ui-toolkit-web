/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { StrictMode, useRef, type ReactNode } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  useBackNavigation,
  useTransientBackNavigation,
} from '@wearables-ui-toolkit/foundation/navigation/BackNavigation';

const BACK_KEY_ALIASES = [
  'Escape',
  'Backspace',
  'BrowserBack',
  'GoBack',
] as const;

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function BackHandler({ handler }: { handler: () => boolean | void }) {
  useBackNavigation(handler);
  return null;
}

function TransientBackHandler({
  handler,
}: {
  handler: () => boolean | void;
}) {
  useTransientBackNavigation(handler);
  return null;
}

function ScopedTransientBackHandler({
  children,
  handler,
  label,
}: {
  children?: ReactNode;
  handler: () => boolean | void;
  label: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  useTransientBackNavigation(handler, null, { focusRootRef: rootRef });
  return (
    <div ref={rootRef}>
      <button type="button">{label}</button>
      {children}
    </div>
  );
}

describe('useBackNavigation', () => {
  it.each(BACK_KEY_ALIASES)(
    'claims one %s press when the host navigates',
    key => {
      const handler = vi.fn(() => true);
      render(<BackHandler handler={handler} />);

      const event = new KeyboardEvent('keydown', {
        bubbles: true,
        cancelable: true,
        key,
      });
      document.dispatchEvent(event);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(event.defaultPrevented).toBe(true);
    },
  );

  it.each(BACK_KEY_ALIASES)('ignores auto-repeated %s presses', key => {
    const handler = vi.fn(() => true);
    render(<BackHandler handler={handler} />);

    const event = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key,
      repeat: true,
    });
    document.dispatchEvent(event);

    expect(handler).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });

  it('leaves Escape unclaimed when the host cannot navigate', () => {
    const handler = vi.fn(() => false);
    render(<BackHandler handler={handler} />);

    const event = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Escape',
    });
    document.dispatchEvent(event);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(false);
  });

  it('does not duplicate browser-history Back', () => {
    const handler = vi.fn();
    render(<BackHandler handler={handler} />);

    window.dispatchEvent(new PopStateEvent('popstate', { state: null }));

    expect(handler).not.toHaveBeenCalled();
  });

  it('uses the latest handler without replacing the document listener', () => {
    const addEventListener = vi.spyOn(document, 'addEventListener');
    const firstHandler = vi.fn(() => true);
    const nextHandler = vi.fn(() => false);
    const view = render(<BackHandler handler={firstHandler} />);

    view.rerender(<BackHandler handler={nextHandler} />);

    const event = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Escape',
    });
    document.dispatchEvent(event);

    expect(firstHandler).not.toHaveBeenCalled();
    expect(nextHandler).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(false);
    expect(addEventListener.mock.calls.filter(([type]) => type === 'keydown'))
      .toHaveLength(1);
  });

  it('ignores key presses already claimed by a component', () => {
    const handler = vi.fn();
    render(<BackHandler handler={handler} />);

    const target = document.createElement('button');
    target.addEventListener('keydown', event => event.preventDefault());
    document.body.appendChild(target);
    fireEvent.keyDown(target, { key: 'Escape' });
    target.remove();

    expect(handler).not.toHaveBeenCalled();
  });

  it.each(['input', 'textarea'] as const)(
    'ignores Backspace typed in an editable %s',
    tag => {
      const handler = vi.fn(() => true);
      render(<BackHandler handler={handler} />);

      const editable = document.createElement(tag);
      document.body.appendChild(editable);
      const event = new KeyboardEvent('keydown', {
        bubbles: true,
        cancelable: true,
        key: 'Backspace',
      });
      editable.dispatchEvent(event);
      editable.remove();

      expect(handler).not.toHaveBeenCalled();
      expect(event.defaultPrevented).toBe(false);
    },
  );

  it('ignores Backspace typed in a contenteditable descendant', () => {
    const handler = vi.fn(() => true);
    render(<BackHandler handler={handler} />);

    const editor = document.createElement('div');
    editor.setAttribute('contenteditable', 'true');
    const nested = document.createElement('span');
    nested.textContent = 'text';
    editor.appendChild(nested);
    document.body.appendChild(editor);
    const event = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Backspace',
    });
    nested.dispatchEvent(event);
    editor.remove();

    expect(handler).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });

  it.each([
    ['checkbox'],
    ['radio'],
    ['range'],
    ['button'],
    ['submit'],
  ])('still claims Backspace pressed on a %s input', (type) => {
    const handler = vi.fn(() => true);
    render(<BackHandler handler={handler} />);

    const control = document.createElement('input');
    control.type = type;
    document.body.appendChild(control);
    const event = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Backspace',
    });
    control.dispatchEvent(event);
    control.remove();

    expect(handler).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);
  });

  it.each([
    ['text'],
    ['search'],
    ['email'],
    ['password'],
  ])('ignores Backspace typed in a %s input', (type) => {
    const handler = vi.fn(() => true);
    render(<BackHandler handler={handler} />);

    const field = document.createElement('input');
    field.type = type;
    document.body.appendChild(field);
    const event = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Backspace',
    });
    field.dispatchEvent(event);
    field.remove();

    expect(handler).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });

  it.each([
    ['an empty contenteditable value', ''],
    ['a bare contenteditable attribute', null],
    ['plaintext-only', 'plaintext-only'],
  ])('ignores Backspace typed in %s editor', (_label, value) => {
    const handler = vi.fn(() => true);
    render(<BackHandler handler={handler} />);

    const editor = document.createElement('div');
    editor.setAttribute('contenteditable', value ?? '');
    document.body.appendChild(editor);
    const event = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Backspace',
    });
    editor.dispatchEvent(event);
    editor.remove();

    expect(handler).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });

  it('still claims Backspace inside an explicitly non-editable subtree', () => {
    const handler = vi.fn(() => true);
    render(<BackHandler handler={handler} />);

    const editor = document.createElement('div');
    editor.setAttribute('contenteditable', 'false');
    const nested = document.createElement('span');
    editor.appendChild(nested);
    document.body.appendChild(editor);
    const event = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Backspace',
    });
    nested.dispatchEvent(event);
    editor.remove();

    expect(handler).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);
  });

  it('still claims Escape typed in an editable', () => {
    const handler = vi.fn(() => true);
    render(<BackHandler handler={handler} />);

    const editable = document.createElement('input');
    document.body.appendChild(editable);
    const event = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Escape',
    });
    editable.dispatchEvent(event);
    editable.remove();

    expect(handler).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);
  });
});

describe('useTransientBackNavigation', () => {
  it.each(BACK_KEY_ALIASES)(
    'claims one %s press for a transient owner',
    key => {
      const handler = vi.fn(() => true);
      const view = render(<TransientBackHandler handler={handler} />);
      const event = new KeyboardEvent('keydown', {
        bubbles: true,
        cancelable: true,
        key,
      });

      document.dispatchEvent(event);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(event.defaultPrevented).toBe(true);
      view.unmount();
    },
  );

  it('dismisses a mounted temporary layer when browser history moves back', () => {
    const handler = vi.fn();
    const initialState = { idx: 4 };
    window.history.replaceState(initialState, '', window.location.href);
    const view = render(<TransientBackHandler handler={handler} />);

    expect(window.history.state.idx).toBe(4);
    expect(window.history.state).not.toEqual(initialState);

    window.history.replaceState(initialState, '', window.location.href);
    window.dispatchEvent(new PopStateEvent('popstate', { state: initialState }));

    expect(handler).toHaveBeenCalledTimes(1);
    view.unmount();
  });

  it('detaches its keyboard listener when the last owner unmounts', () => {
    const removeEventListener = vi.spyOn(document, 'removeEventListener');
    const view = render(<TransientBackHandler handler={() => {}} />);

    view.unmount();

    expect(
      removeEventListener.mock.calls.filter(([type]) => type === 'keydown'),
    ).toHaveLength(1);
  });

  it('leaves Escape unclaimed when a transient owner declines it', () => {
    const handler = vi.fn(() => false);
    const view = render(<TransientBackHandler handler={handler} />);
    const event = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Escape',
    });

    document.dispatchEvent(event);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(false);
    view.unmount();
  });

  it('ignores transient Backspace typed in an editable', () => {
    const handler = vi.fn(() => true);
    const view = render(<TransientBackHandler handler={handler} />);

    const editable = document.createElement('input');
    document.body.appendChild(editable);
    const event = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Backspace',
    });
    editable.dispatchEvent(event);
    editable.remove();

    expect(handler).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
    view.unmount();
  });

  it.each(BACK_KEY_ALIASES)(
    'ignores auto-repeated %s presses for transient owners',
    key => {
      const handler = vi.fn(() => true);
      const view = render(<TransientBackHandler handler={handler} />);
      const event = new KeyboardEvent('keydown', {
        bubbles: true,
        cancelable: true,
        key,
        repeat: true,
      });

      document.dispatchEvent(event);

      expect(handler).not.toHaveBeenCalled();
      expect(event.defaultPrevented).toBe(false);
      view.unmount();
    },
  );

  it('re-arms its history entry when Back is handled without dismissal', () => {
    vi.useFakeTimers();
    const historyBack = vi.spyOn(window.history, 'back').mockImplementation(() => {});
    const pushState = vi.spyOn(History.prototype, 'pushState');
    const initialState = { idx: 4 };
    window.history.replaceState(initialState, '', window.location.href);
    const handler = vi.fn(() => false);
    const view = render(<TransientBackHandler handler={handler} />);
    pushState.mockClear();

    window.history.replaceState(initialState, '', window.location.href);
    window.dispatchEvent(new PopStateEvent('popstate', { state: initialState }));

    expect(handler).toHaveBeenCalledTimes(1);
    expect(pushState).toHaveBeenCalledTimes(1);
    expect(window.history.state.__uitTransientBackEntry).toEqual(
      expect.any(String),
    );

    view.unmount();
    vi.runOnlyPendingTimers();
    expect(historyBack).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('does not skip a foreign transient marker restored onto a real entry', () => {
    vi.useFakeTimers();
    const historyBack = vi.spyOn(window.history, 'back').mockImplementation(() => {});
    const originalHistoryState = window.history.state;
    const originalUrl = window.location.href;
    const foreignState = {
      idx: 7,
      __uitTransientBackEntry: 'foreign-marker',
    };
    const view = render(<TransientBackHandler handler={() => {}} />);

    try {
      // Registering then dismissing leaves no active entry behind.
      view.unmount();
      vi.runOnlyPendingTimers();
      historyBack.mockClear();

      window.history.replaceState(foreignState, '', window.location.href);
      window.dispatchEvent(new PopStateEvent('popstate', { state: foreignState }));

      expect(historyBack).not.toHaveBeenCalled();
    } finally {
      window.history.replaceState(originalHistoryState, '', originalUrl);
      vi.useRealTimers();
    }
  });

  it('does not reuse a transient marker restored with an older page entry', () => {
    const staleState = {
      idx: 2,
      __uitTransientBackEntry: 'stale-entry',
    };
    window.history.replaceState(staleState, '', window.location.href);
    const view = render(<TransientBackHandler handler={() => {}} />);

    expect(window.history.state.idx).toBe(2);
    expect(window.history.state.__uitTransientBackEntry)
      .not.toBe('stale-entry');

    view.unmount();
  });

  it('keeps retired transient entries inert across repeated Forward traversal', () => {
    vi.useFakeTimers();
    const historyBack = vi.spyOn(window.history, 'back').mockImplementation(() => {});
    const originalHistoryState = window.history.state;
    const originalUrl = window.location.href;
    const initialState = { idx: 4 };
    window.history.replaceState(initialState, '', window.location.href);
    const handler = vi.fn();
    const view = render(<TransientBackHandler handler={handler} />);
    const retiredState = window.history.state;

    try {
      window.history.replaceState(initialState, '', window.location.href);
      window.dispatchEvent(new PopStateEvent('popstate', { state: initialState }));
      expect(handler).toHaveBeenCalledTimes(1);

      window.history.replaceState(retiredState, '', window.location.href);
      window.dispatchEvent(new PopStateEvent('popstate', { state: retiredState }));
      window.dispatchEvent(new PopStateEvent('popstate', { state: retiredState }));

      expect(historyBack).toHaveBeenCalledTimes(2);
      expect(handler).toHaveBeenCalledTimes(1);
    } finally {
      view.unmount();
      vi.runOnlyPendingTimers();
      window.history.replaceState(originalHistoryState, '', originalUrl);
      vi.useRealTimers();
    }
  });

  it('re-arms instead of dismissing a new owner during retired-entry cleanup', () => {
    vi.useFakeTimers();
    const historyBack = vi.spyOn(window.history, 'back').mockImplementation(() => {});
    const originalHistoryState = window.history.state;
    const originalUrl = window.location.href;
    const initialState = { idx: 4 };
    window.history.replaceState(initialState, '', window.location.href);
    const firstView = render(<TransientBackHandler handler={() => {}} />);
    const retiredState = window.history.state;

    try {
      firstView.unmount();
      vi.runOnlyPendingTimers();
      expect(historyBack).toHaveBeenCalledTimes(1);

      const replacementHandler = vi.fn();
      const replacementView = render(
        <TransientBackHandler handler={replacementHandler} />,
      );
      const replacementEntryId = window.history.state.__uitTransientBackEntry;

      // The queued cleanup Back lands on the older transient entry after the
      // replacement owner has already armed a newer entry.
      window.history.replaceState(retiredState, '', window.location.href);
      window.dispatchEvent(new PopStateEvent('popstate', { state: retiredState }));
      expect(replacementHandler).not.toHaveBeenCalled();
      expect(historyBack).toHaveBeenCalledTimes(2);

      // Once the stale entry is skipped, the replacement owner re-arms rather
      // than receiving the old Back request.
      window.history.replaceState(initialState, '', window.location.href);
      window.dispatchEvent(new PopStateEvent('popstate', { state: initialState }));
      vi.runOnlyPendingTimers();
      expect(replacementHandler).not.toHaveBeenCalled();
      expect(window.history.state.__uitTransientBackEntry).not.toBe(
        replacementEntryId,
      );

      replacementView.unmount();
      vi.runOnlyPendingTimers();
    } finally {
      window.history.replaceState(originalHistoryState, '', originalUrl);
      vi.useRealTimers();
    }
  });

  it('re-arms after a retired-entry skip when history does not move', () => {
    vi.useFakeTimers();
    const historyBack = vi.spyOn(window.history, 'back').mockImplementation(() => {});
    const originalHistoryState = window.history.state;
    const originalUrl = window.location.href;
    const initialState = { idx: 4 };
    window.history.replaceState(initialState, '', window.location.href);
    const firstView = render(<TransientBackHandler handler={() => {}} />);
    const retiredState = window.history.state;

    try {
      firstView.unmount();
      vi.runOnlyPendingTimers();

      const replacementHandler = vi.fn();
      const replacementView = render(
        <TransientBackHandler handler={replacementHandler} />,
      );
      const replacementEntryId = window.history.state.__uitTransientBackEntry;
      window.history.replaceState(retiredState, '', window.location.href);
      window.dispatchEvent(new PopStateEvent('popstate', { state: retiredState }));

      // Simulate a host that suppresses the second history traversal.
      vi.runAllTimers();

      expect(replacementHandler).not.toHaveBeenCalled();
      expect(window.history.state.__uitTransientBackEntry).not.toBe(
        replacementEntryId,
      );
      expect(window.history.state.__uitTransientBackEntry).toEqual(
        expect.any(String),
      );
      replacementView.unmount();
      vi.runOnlyPendingTimers();
    } finally {
      window.history.replaceState(originalHistoryState, '', originalUrl);
      vi.useRealTimers();
    }
  });

  it('dismisses the layer when Back returns to the entry below a foreign push', () => {
    vi.useFakeTimers();
    const originalHistoryState = window.history.state;
    const originalUrl = window.location.href;
    const initialState = { idx: 4 };
    window.history.replaceState(initialState, '', window.location.href);
    const handler = vi.fn();
    const view = render(<TransientBackHandler handler={handler} />);
    const transientState = window.history.state;
    expect(transientState.__uitTransientBackEntry).toEqual(expect.any(String));

    try {
      // A router pushes its own entry above the live transient entry
      // without unregistering the owner.
      window.history.pushState({ idx: 5 }, '', window.location.href);

      // Back traverses onto the transient entry: the layer must dismiss
      // on this press rather than swallowing it.
      window.history.replaceState(transientState, '', window.location.href);
      window.dispatchEvent(new PopStateEvent('popstate', { state: transientState }));

      expect(handler).toHaveBeenCalledTimes(1);
    } finally {
      view.unmount();
      vi.runOnlyPendingTimers();
      window.history.replaceState(originalHistoryState, '', originalUrl);
      vi.useRealTimers();
    }
  });

  it('removes its temporary history entry after programmatic dismissal', () => {
    vi.useFakeTimers();
    const historyBack = vi.spyOn(window.history, 'back').mockImplementation(() => {});
    const view = render(<TransientBackHandler handler={() => {}} />);

    view.unmount();
    vi.runOnlyPendingTimers();

    expect(historyBack).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('preserves legitimate replacement focus after removing its history entry', () => {
    vi.useFakeTimers();
    const frameCallbacks: FrameRequestCallback[] = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => {
      frameCallbacks.push(callback);
      return frameCallbacks.length;
    });
    vi.spyOn(window.history, 'back').mockImplementation(() => {});
    const trigger = document.createElement('button');
    const replacement = document.createElement('button');
    document.body.appendChild(trigger);
    document.body.appendChild(replacement);
    trigger.focus();
    const view = render(<TransientBackHandler handler={() => {}} />);

    view.unmount();
    vi.runOnlyPendingTimers();
    replacement.focus();
    window.dispatchEvent(new PopStateEvent('popstate', { state: null }));
    frameCallbacks.shift()?.(0);

    expect(document.activeElement).toBe(replacement);
    trigger.remove();
    replacement.remove();
    vi.useRealTimers();
  });

  it('expires cleanup focus restoration when history does not move', () => {
    vi.useFakeTimers();
    vi.spyOn(window.history, 'back').mockImplementation(() => {});
    const removeEventListener = vi.spyOn(window, 'removeEventListener');
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();
    const view = render(<TransientBackHandler handler={() => {}} />);

    view.unmount();
    vi.runAllTimers();

    expect(
      removeEventListener.mock.calls.filter(([type]) => type === 'popstate'),
    ).toHaveLength(1);
    trigger.remove();
    vi.useRealTimers();
  });

  it('restores trigger focus from the application boundary', () => {
    vi.useFakeTimers();
    const frameCallbacks: FrameRequestCallback[] = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => {
      frameCallbacks.push(callback);
      return frameCallbacks.length;
    });
    vi.spyOn(window.history, 'back').mockImplementation(() => {});
    const boundary = document.createElement('div');
    const trigger = document.createElement('button');
    boundary.tabIndex = -1;
    boundary.appendChild(trigger);
    document.body.appendChild(boundary);
    trigger.focus();
    const view = render(<TransientBackHandler handler={() => {}} />);

    view.unmount();
    vi.runOnlyPendingTimers();
    boundary.focus();
    window.dispatchEvent(new PopStateEvent('popstate', { state: null }));
    frameCallbacks.shift()?.(0);

    expect(document.activeElement).toBe(trigger);
    boundary.remove();
    vi.useRealTimers();
  });

  it('routes Back to the same-priority owner containing focus', () => {
    const originalHistoryState = window.history.state;
    const originalUrl = window.location.href;
    const initialState = { idx: 9 };
    const firstHandler = vi.fn();
    const secondHandler = vi.fn();
    window.history.replaceState(initialState, '', window.location.href);
    const view = render(
      <>
        <ScopedTransientBackHandler handler={firstHandler} label="First owner" />
        <ScopedTransientBackHandler handler={secondHandler} label="Second owner" />
      </>,
    );

    try {
      screen.getByRole('button', { name: 'First owner' }).focus();
      window.history.replaceState(initialState, '', window.location.href);
      window.dispatchEvent(new PopStateEvent('popstate', { state: initialState }));

      expect(firstHandler).toHaveBeenCalledTimes(1);
      expect(secondHandler).not.toHaveBeenCalled();
    } finally {
      view.unmount();
      window.history.replaceState(originalHistoryState, '', originalUrl);
    }
  });

  it('routes Back to the innermost focused owner', () => {
    const originalHistoryState = window.history.state;
    const originalUrl = window.location.href;
    const initialState = { idx: 10 };
    const outerHandler = vi.fn();
    const innerHandler = vi.fn();
    window.history.replaceState(initialState, '', window.location.href);
    const view = render(
      <ScopedTransientBackHandler handler={outerHandler} label="Outer owner">
        <ScopedTransientBackHandler handler={innerHandler} label="Inner owner" />
      </ScopedTransientBackHandler>,
    );

    try {
      screen.getByRole('button', { name: 'Inner owner' }).focus();
      window.history.replaceState(initialState, '', window.location.href);
      window.dispatchEvent(new PopStateEvent('popstate', { state: initialState }));

      expect(innerHandler).toHaveBeenCalledTimes(1);
      expect(outerHandler).not.toHaveBeenCalled();
    } finally {
      view.unmount();
      window.history.replaceState(originalHistoryState, '', originalUrl);
    }
  });

  it('routes Back to the innermost owner while focus is at the application boundary', () => {
    const originalHistoryState = window.history.state;
    const originalUrl = window.location.href;
    const initialState = { idx: 10 };
    const outerHandler = vi.fn();
    const innerHandler = vi.fn();
    window.history.replaceState(initialState, '', window.location.href);
    const view = render(
      <ScopedTransientBackHandler handler={outerHandler} label="Outer owner">
        <ScopedTransientBackHandler handler={innerHandler} label="Inner owner" />
      </ScopedTransientBackHandler>,
    );

    try {
      document.documentElement.tabIndex = -1;
      document.documentElement.focus();
      window.history.replaceState(initialState, '', window.location.href);
      window.dispatchEvent(new PopStateEvent('popstate', { state: initialState }));

      expect(innerHandler).toHaveBeenCalledTimes(1);
      expect(outerHandler).not.toHaveBeenCalled();
    } finally {
      document.documentElement.removeAttribute('tabindex');
      view.unmount();
      window.history.replaceState(originalHistoryState, '', originalUrl);
    }
  });

  it('does not restore a stale trigger after owner replacement', () => {
    vi.useFakeTimers();
    const frameCallbacks: FrameRequestCallback[] = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => {
      frameCallbacks.push(callback);
      return frameCallbacks.length;
    });
    vi.spyOn(window.history, 'back').mockImplementation(() => {});
    const staleTrigger = document.createElement('button');
    document.body.appendChild(staleTrigger);
    staleTrigger.focus();
    const firstView = render(<TransientBackHandler handler={() => {}} />);
    firstView.unmount();
    vi.runOnlyPendingTimers();

    const replacementView = render(<TransientBackHandler handler={() => {}} />);
    const replacementTarget = document.createElement('button');
    document.body.appendChild(replacementTarget);
    replacementTarget.focus();
    window.dispatchEvent(new PopStateEvent('popstate', { state: null }));
    frameCallbacks.splice(0).forEach(callback => callback(0));

    expect(document.activeElement).toBe(replacementTarget);
    replacementView.unmount();
    vi.runOnlyPendingTimers();
    staleTrigger.remove();
    replacementTarget.remove();
    vi.useRealTimers();
  });

  it('does not duplicate its entry during StrictMode effect replay', () => {
    vi.useFakeTimers();
    const pushState = vi.spyOn(History.prototype, 'pushState');
    const view = render(
      <StrictMode>
        <TransientBackHandler handler={() => {}} />
      </StrictMode>,
    );

    expect(pushState).toHaveBeenCalledTimes(1);

    view.unmount();
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });
});
