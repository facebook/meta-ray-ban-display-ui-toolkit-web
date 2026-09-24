/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { useSubNavigationAutoHide } from '../mrbd/ui/private/useSubNavigationAutoHide';

function AutoHideProbe({
  autoHide,
  isFocused,
}: {
  autoHide: boolean;
  isFocused: boolean;
}) {
  const {
    animated,
    visible,
    setVisible,
  } = useSubNavigationAutoHide(autoHide, isFocused);
  return (
    <div
      data-testid="probe"
      data-visible={visible ? 'true' : 'false'}
      data-animated={animated ? 'true' : 'false'}
    >
      <button onClick={() => setVisible(false, false)}>Hide</button>
      <button onClick={() => setVisible(true, false)}>Show</button>
    </div>
  );
}

describe('useSubNavigationAutoHide', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('hides after the timeout when enabled and unfocused', () => {
    vi.useFakeTimers();
    render(<AutoHideProbe autoHide isFocused={false} />);

    expect(screen.getByTestId('probe')).toHaveAttribute('data-visible', 'true');

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.getByTestId('probe')).toHaveAttribute('data-visible', 'false');
  });

  it('stays visible while focused', () => {
    vi.useFakeTimers();
    render(<AutoHideProbe autoHide isFocused />);

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.getByTestId('probe')).toHaveAttribute('data-visible', 'true');
  });

  it('shows again when auto-hide is disabled', () => {
    vi.useFakeTimers();
    const { rerender } = render(<AutoHideProbe autoHide isFocused={false} />);

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    rerender(<AutoHideProbe autoHide={false} isFocused={false} />);

    expect(screen.getByTestId('probe')).toHaveAttribute('data-visible', 'true');
  });

  it('lets focus reveal a manually hidden header', () => {
    vi.useFakeTimers();
    const { rerender } = render(<AutoHideProbe autoHide isFocused={false} />);

    fireEvent.click(screen.getByRole('button', { name: 'Hide' }));
    expect(screen.getByTestId('probe')).toHaveAttribute('data-visible', 'false');

    rerender(<AutoHideProbe autoHide isFocused />);
    expect(screen.getByTestId('probe')).toHaveAttribute('data-visible', 'true');
    expect(screen.getByTestId('probe')).toHaveAttribute('data-animated', 'true');
  });

  it('restarts auto-hide after a manual show', () => {
    vi.useFakeTimers();
    render(<AutoHideProbe autoHide isFocused={false} />);

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    fireEvent.click(screen.getByRole('button', { name: 'Show' }));
    expect(screen.getByTestId('probe')).toHaveAttribute('data-visible', 'true');
    expect(screen.getByTestId('probe')).toHaveAttribute('data-animated', 'false');

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.getByTestId('probe')).toHaveAttribute('data-visible', 'false');
    expect(screen.getByTestId('probe')).toHaveAttribute('data-animated', 'true');
  });

  it('keeps a manual non-animated hide after the old timeout', () => {
    vi.useFakeTimers();
    render(<AutoHideProbe autoHide isFocused={false} />);

    fireEvent.click(screen.getByRole('button', { name: 'Hide' }));
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.getByTestId('probe')).toHaveAttribute('data-visible', 'false');
    expect(screen.getByTestId('probe')).toHaveAttribute('data-animated', 'false');
  });

  it('preserves a manual non-animated show when focus arrives', () => {
    vi.useFakeTimers();
    const { rerender } = render(
      <AutoHideProbe autoHide={false} isFocused={false} />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Show' }));
    rerender(<AutoHideProbe autoHide={false} isFocused />);

    expect(screen.getByTestId('probe')).toHaveAttribute('data-visible', 'true');
    expect(screen.getByTestId('probe')).toHaveAttribute('data-animated', 'false');
  });
});
