/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Toast tests
 *
 * Constants:
 * - TOAST_QUEUE_DELAY_MS = 700
 * - Display duration: 3500ms
 * - Chip style: ELEVATED
 * - Queue-based toast management
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { FloatingPortalRootProvider } from '@wearables-ui-toolkit/foundation/portal/FloatingPortalRoot';
import { Toast, ToastStyle, ToastContainer } from '../mrbd/ui/Toast';
import styles from '../mrbd/ui/Toast.module.css';

function getToastStatus(): HTMLElement | null {
  return document.body.querySelector('[role="status"]');
}

function getToastWrapper(): HTMLElement | null {
  return document.body.querySelector(`.${styles.toastWrapper}`);
}

function resetToasts(): void {
  // Full reset for test isolation. cancelAll() is queue-only, so clear the
  // singleton (active toast + timers + queue) directly between tests.
  vi.clearAllTimers();
  delete window.__uit_toast_state__;
}

beforeEach(() => {
  vi.useFakeTimers();
  resetToasts();
});

afterEach(() => {
  act(() => {
    resetToasts();
  });
  vi.useRealTimers();
});

describe('Toast API', () => {
  it('show returns a token', () => {
    const token = Toast.show('Hello');
    expect(typeof token).toBe('number');
    Toast.cancelAll();
  });

  it('show with all params returns token', () => {
    const token = Toast.show('Msg', 'Meta', undefined, ToastStyle.STANDARD);
    expect(typeof token).toBe('number');
    Toast.cancelAll();
  });

  it('cancel removes the visible toast from the DOM', () => {
    render(<ToastContainer />);

    let token = 0;
    act(() => {
      token = Toast.show('Test');
    });
    act(() => {
      vi.advanceTimersByTime(20);
    });
    expect(getToastStatus()?.textContent).toContain('Test');

    act(() => {
      Toast.cancel(token);
    });
    // Cancel runs the exit fade (300ms) before fully unmounting.
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(getToastStatus()).toBeNull();
  });

  it('cancelAll clears the queued backlog but leaves the visible toast', () => {
    render(<ToastContainer />);

    act(() => {
      Toast.show('One');
      Toast.show('Two');
      Toast.show('Three');
    });
    act(() => {
      vi.advanceTimersByTime(20);
    });
    expect(getToastStatus()?.textContent).toContain('One');

    // cancelAll empties the pending queue but leaves the active toast showing.
    act(() => {
      Toast.cancelAll();
    });
    expect(getToastStatus()?.textContent).toContain('One');

    // After the active toast completes (display 3500 + exit 300 + handoff 700),
    // the cleared 'Two'/'Three' must not surface.
    act(() => {
      vi.advanceTimersByTime(3500 + 300 + 700);
    });
    expect(getToastStatus()).toBeNull();
  });
});

describe('ToastStyle enum', () => {
  it('STANDARD = "standard"', () => {
    expect(ToastStyle.STANDARD).toBe('standard');
  });
});

describe('ToastContainer', () => {
  it('renders without crashing', () => {
    const { container } = render(<ToastContainer />);
    // Initially no toast visible
    expect(container.innerHTML).toBe('');
  });

  it('shows toast when Toast.show is called', () => {
    render(<ToastContainer />);
    act(() => {
      Toast.show('Hello World');
    });
    // The toast should appear after event dispatch
    expect(getToastStatus()).not.toBeNull();
  });

  it('toast has aria-live=polite', () => {
    render(<ToastContainer />);
    act(() => {
      Toast.show('Test');
    });
    const status = screen.getByRole('status');
    expect(status.getAttribute('aria-live')).toBe('polite');
  });

  it('toast content includes message text', () => {
    render(<ToastContainer />);
    act(() => {
      Toast.show('Important Message');
    });
    expect(getToastStatus()?.textContent).toContain('Important Message');
  });

  it('toast content includes metadata', () => {
    render(<ToastContainer />);
    act(() => {
      Toast.show('Title', 'Subtitle');
    });
    expect(getToastStatus()?.textContent).toContain('Subtitle');
  });

  it('renders through the scoped app floating portal when one is provided', () => {
    const portalRoot = document.createElement('div');
    portalRoot.setAttribute('data-app-floating-portal-root', '');
    document.body.appendChild(portalRoot);

    render(
      <FloatingPortalRootProvider root={portalRoot}>
        <ToastContainer />
      </FloatingPortalRootProvider>,
    );

    act(() => {
      Toast.show('Scoped toast');
    });

    const status = screen.getByRole('status');
    expect(status.parentElement).toBe(portalRoot);
    expect(status).toHaveStyle({ position: 'absolute' });

    portalRoot.remove();
  });

  it('fades the toast wrapper in place instead of moving it', () => {
    render(<ToastContainer />);

    act(() => {
      Toast.show('Anchored toast');
    });

    const wrapper = getToastWrapper();
    expect(wrapper).not.toBeNull();
    expect(wrapper).toHaveClass(styles.toastHidden);
    expect(wrapper).not.toHaveStyle({ transform: expect.any(String) });

    act(() => {
      vi.advanceTimersByTime(20);
    });

    expect(wrapper).toHaveClass(styles.toastVisible);
    expect(wrapper).not.toHaveStyle({ transform: expect.any(String) });
  });

  it('keeps the toast in the DOM while the exit fade runs', () => {
    render(<ToastContainer />);

    act(() => {
      Toast.show('Dismiss me');
    });
    act(() => {
      vi.advanceTimersByTime(20);
    });

    act(() => {
      vi.advanceTimersByTime(3500);
    });

    const wrapper = getToastWrapper();
    expect(wrapper).not.toBeNull();
    expect(wrapper).toHaveClass(styles.toastHidden);
    expect(getToastStatus()?.textContent).toContain('Dismiss me');

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(getToastStatus()).toBeNull();
  });

  it('waits for exit animation and queue delay before showing the next queued toast', () => {
    render(<ToastContainer />);

    act(() => {
      Toast.show('First toast');
      Toast.show('Second toast', 'Success');
      Toast.show('Third toast', 'Error');
    });
    act(() => {
      vi.advanceTimersByTime(20);
    });

    expect(getToastStatus()?.textContent).toContain('First toast');
    expect(getToastStatus()?.textContent).not.toContain('Success');

    act(() => {
      vi.advanceTimersByTime(3480);
    });

    const wrapper = getToastWrapper();
    expect(wrapper).toHaveClass(styles.toastHidden);
    expect(getToastStatus()?.textContent).toContain('First toast');

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(getToastStatus()).toBeNull();

    act(() => {
      vi.advanceTimersByTime(699);
    });
    expect(getToastStatus()).toBeNull();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(getToastStatus()?.textContent).toContain('Second toast');
    expect(getToastStatus()?.textContent).toContain('Success');
    expect(getToastStatus()?.textContent).not.toContain('Error');
  });

  it('queues new toasts posted during the handoff delay', () => {
    render(<ToastContainer />);

    act(() => {
      Toast.show('First toast');
    });
    act(() => {
      vi.advanceTimersByTime(20);
    });
    act(() => {
      vi.advanceTimersByTime(3480 + 300);
    });

    expect(getToastStatus()).toBeNull();

    act(() => {
      Toast.show('Queued during handoff');
    });

    expect(getToastStatus()).toBeNull();

    act(() => {
      vi.advanceTimersByTime(699);
    });
    expect(getToastStatus()).toBeNull();

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(getToastStatus()?.textContent).toContain('Queued during handoff');
  });

  it('canceling the current toast uses the same exit and queue handoff lifecycle', () => {
    render(<ToastContainer />);
    let token = 0;

    act(() => {
      token = Toast.show('Cancel me');
      Toast.show('After cancel');
    });
    act(() => {
      vi.advanceTimersByTime(20);
    });

    act(() => {
      Toast.cancel(token);
    });

    expect(getToastWrapper()).toHaveClass(styles.toastHidden);
    expect(getToastStatus()?.textContent).toContain('Cancel me');

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(getToastStatus()).toBeNull();

    act(() => {
      vi.advanceTimersByTime(700);
    });

    expect(getToastStatus()?.textContent).toContain('After cancel');
  });
});

describe('ToastContainer custom props', () => {
  it('accepts className', () => {
    render(<ToastContainer className="my-toast" />);
    act(() => {
      Toast.show('Test');
    });
    const status = screen.getByRole('status');
    expect(status.className).toContain('my-toast');
  });
});
