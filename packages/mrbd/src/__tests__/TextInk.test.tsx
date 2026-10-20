/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {render, screen} from '@testing-library/react';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {ContainerHeader} from '../mrbd/ui/ContainerHeader';
import {NotificationBadge} from '../mrbd/ui/NotificationBadge';

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('Intrinsic header and count text', () => {
  it('updates content and equivalent caller styles without measuring text ink or observing leaves', () => {
    const computedStyle = vi.spyOn(window, 'getComputedStyle');
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    const observed: Element[] = [];
    vi.stubGlobal('ResizeObserver', class {
      observe(node: Element) { observed.push(node); }
      unobserve() {}
      disconnect() {}
    });
    const style = {fontSize: 30};
    const {rerender} = render(<><ContainerHeader title="Group" subtitle="Updates" style={style} /><NotificationBadge text="9" /></>);
    const heading = screen.getByRole('heading');
    const title = screen.getByText('Group');
    const subtitle = screen.getByText('Updates');
    const count = screen.getByText('9');
    expect(observed).not.toContain(title);
    expect(observed).not.toContain(subtitle);
    expect(observed).not.toContain(count);
    rerender(<><ContainerHeader title="Équipe 東京 — long trailing text" subtitle="Updated" style={{fontSize: 30}} /><NotificationBadge text="99" /></>);
    expect(screen.getByRole('heading')).toBe(heading);
    expect(heading).toHaveAccessibleName('Équipe 東京 — long trailing text, Updated');
    expect(screen.getByText('99')).toBeInTheDocument();
    expect(title.style.getPropertyValue('--uit-text-ink-height')).toBe('');
    expect(subtitle.style.getPropertyValue('--uit-text-ink-height')).toBe('');
    expect(count.style.getPropertyValue('--uit-text-ink-height')).toBe('');
    for (const leaf of [title, subtitle, count]) {
      expect(computedStyle.mock.calls.some(([node]) => node === leaf)).toBe(false);
    }
  });

  it('handles title and subtitle removal and restoration without stale text reserves', () => {
    const {rerender} = render(<ContainerHeader title="Group" subtitle="Updates" />);
    rerender(<ContainerHeader subtitle="Updates" />);
    expect(screen.queryByText('Group')).not.toBeInTheDocument();
    expect(screen.getByRole('heading')).toHaveAccessibleName('Updates');
    rerender(<ContainerHeader title="Restored" />);
    expect(screen.queryByText('Updates')).not.toBeInTheDocument();
    expect(screen.getByRole('heading')).toHaveAccessibleName('Restored');
    expect(screen.getByText('Restored').style.getPropertyValue('--uit-text-ink-height')).toBe('');
  });
});
