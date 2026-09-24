/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  act,
  render,
} from '@testing-library/react';
import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { TextSwitcher } from '@wearables-ui-toolkit/foundation/components/TextSwitcher';
import {
  TEXT_SWITCHER_DEFAULT_DURATION_MS,
  TEXT_SWITCHER_DEFAULT_TIMING_FUNCTION,
} from '@wearables-ui-toolkit/foundation/components/private/TextSwitcherMetrics';

describe('TextSwitcher rendering', () => {
  it('uses the default fade duration', () => {
    const { container } = render(<TextSwitcher text="First" />);
    const root = container.firstElementChild as HTMLElement;

    expect(root.getAttribute('style')).toContain(
      `transition: opacity ${TEXT_SWITCHER_DEFAULT_DURATION_MS}ms ${TEXT_SWITCHER_DEFAULT_TIMING_FUNCTION}`
    );
  });

  it('animates the first text in by default', () => {
    const requestAnimationFrameSpy = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation(() => 0);
    const { container } = render(<TextSwitcher text="First" />);
    const root = container.firstElementChild as HTMLElement;

    expect(container.textContent).toContain('First');
    expect(root.style.opacity).toBe('0');
    requestAnimationFrameSpy.mockRestore();
  });

  it('can skip the first-view animation and renders live-region semantics', () => {
    const { container } = render(
      <TextSwitcher text="First" noAnimationFirstView />
    );
    const root = container.firstElementChild as HTMLElement;

    expect(container.textContent).toContain('First');
    expect(root.style.opacity).toBe('1');
    expect(root.getAttribute('aria-live')).toBe('polite');
    expect(root.getAttribute('aria-atomic')).toBe('true');
  });

  it('omits the live region when a consumer aria-label is supplied', () => {
    const { container } = render(
      <TextSwitcher text="First" aria-label="Status" />
    );
    const root = container.firstElementChild as HTMLElement;

    // The consumer's accessible name wins, so the component does not also drive a
    // live-region announcement.
    expect(root.getAttribute('aria-label')).toBe('Status');
    expect(root.getAttribute('aria-live')).toBeNull();
    expect(root.getAttribute('aria-atomic')).toBeNull();
  });

  it('updates immediately when animation is disabled', () => {
    const { rerender, container } = render(
      <TextSwitcher text="First" animated={false} />
    );

    rerender(<TextSwitcher text="Second" animated={false} />);

    expect(container.textContent).toContain('Second');
    expect((container.firstElementChild as HTMLElement).style.transition).toBe(
      'none',
    );
  });

  it('queues animated text changes until the current fade completes', () => {
    vi.useFakeTimers();
    const requestAnimationFrameSpy = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((callback) => {
        callback(0);
        return 0;
      });

    const { rerender, container } = render(
      <TextSwitcher text="First" duration={20} noAnimationFirstView />
    );
    rerender(<TextSwitcher text="Second" duration={20} />);
    rerender(<TextSwitcher text="Third" duration={20} />);

    act(() => {
      vi.advanceTimersByTime(120);
    });

    expect(container.textContent).toContain('Third');
    requestAnimationFrameSpy.mockRestore();
    vi.useRealTimers();
  });

  it('queues an empty text update during an active animation', () => {
    vi.useFakeTimers();
    const requestAnimationFrameSpy = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((callback) => {
        callback(0);
        return 0;
      });

    const { rerender, container } = render(
      <TextSwitcher text="First" duration={20} noAnimationFirstView />
    );
    rerender(<TextSwitcher text="Second" duration={20} />);
    rerender(<TextSwitcher duration={20} />);

    act(() => {
      vi.advanceTimersByTime(120);
    });

    const root = container.firstElementChild as HTMLElement;
    expect(container.textContent).not.toContain('Second');
    expect(root.style.opacity).toBe('0');
    requestAnimationFrameSpy.mockRestore();
    vi.useRealTimers();
  });
});
