/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Tests for the Button imperative ref API (`ButtonHandle.animateActionTransition`):
 * shrink the icon, swap the icon/title, spring it back. The icon source is a
 * single `endingIcon`.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, render } from '@testing-library/react';
import { createRef } from 'react';
import { Button } from '../mrbd/ui/Button';
import type { ButtonHandle } from '../mrbd/ui/Button';

const START_ICON_SRC = '/icons/send.svg';
const END_ICON_SRC = '/icons/check.svg';

function getMaskUris(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll<HTMLElement>('span'))
    .map(el => el.style.maskImage || el.style.webkitMaskImage)
    .filter(Boolean);
}

describe('Button.animateActionTransition (imperative ref)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('getElement returns the rendered button root element', () => {
    const ref = createRef<ButtonHandle>();
    const { container } = render(
      <Button ref={ref} title="Send" icon={START_ICON_SRC} />,
    );

    // The handle hands back the live DOM node, not a detached element, so
    // callers can measure/position the button.
    expect(ref.current?.getElement()).toBe(container.firstElementChild);
  });

  it('swaps the icon to the ending icon after the shrink phase', () => {
    const ref = createRef<ButtonHandle>();
    const { container } = render(
      <Button ref={ref} title="Send" icon={START_ICON_SRC} />,
    );

    expect(getMaskUris(container).some(u => u.includes('send.svg'))).toBe(true);

    act(() => {
      ref.current?.animateActionTransition({ endingIcon: END_ICON_SRC });
    });

    // Swap happens after the shrink phase completes.
    act(() => {
      vi.advanceTimersByTime(250);
    });

    const uris = getMaskUris(container);
    expect(uris.some(u => u.includes('check.svg'))).toBe(true);
    expect(uris.some(u => u.includes('send.svg'))).toBe(false);
  });

  it('swaps the title to the ending title when provided', () => {
    const ref = createRef<ButtonHandle>();
    const { container } = render(
      <Button ref={ref} title="Send" icon={START_ICON_SRC} />,
    );

    expect(container.textContent).toContain('Send');

    act(() => {
      ref.current?.animateActionTransition({
        endingIcon: END_ICON_SRC,
        endingTitle: 'Sent',
      });
    });

    act(() => {
      vi.advanceTimersByTime(600);
    });

    expect(container.textContent).toContain('Sent');
    expect(container.textContent).not.toContain('Send');
  });

  it('is a no-op when no ending icon is provided', () => {
    const ref = createRef<ButtonHandle>();
    const { container } = render(
      <Button ref={ref} title="Send" icon={START_ICON_SRC} />,
    );

    act(() => {
      ref.current?.animateActionTransition({ endingTitle: 'Sent' });
    });

    act(() => {
      vi.advanceTimersByTime(600);
    });

    // Title unchanged because the icon source (required) was omitted.
    expect(container.textContent).toContain('Send');
    expect(container.textContent).not.toContain('Sent');
  });

  it('updating the icon prop overrides an in-flight transition end state', () => {
    const ref = createRef<ButtonHandle>();
    const { container, rerender } = render(
      <Button ref={ref} title="Send" icon={START_ICON_SRC} />,
    );

    act(() => {
      ref.current?.animateActionTransition({ endingIcon: END_ICON_SRC });
      vi.advanceTimersByTime(250);
    });
    expect(getMaskUris(container).some(u => u.includes('check.svg'))).toBe(true);

    // A new declarative icon prop wins over the transition override.
    rerender(<Button ref={ref} title="Send" icon="/icons/edit.svg" />);

    const uris = getMaskUris(container);
    expect(uris.some(u => u.includes('edit.svg'))).toBe(true);
    expect(uris.some(u => u.includes('check.svg'))).toBe(false);
  });
});
