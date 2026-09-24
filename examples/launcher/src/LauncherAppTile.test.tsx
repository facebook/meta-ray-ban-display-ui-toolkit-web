/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { CornerRadius } from '@wearables-ui-toolkit/mrbd';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getLauncherApp } from './launcherCatalog';
import { LauncherAppTile } from './LauncherAppTile';

afterEach(cleanup);

describe('LauncherAppTile', () => {
  it('masks its glyph with a data URL rather than raw markup', () => {
    const app = getLauncherApp('reader');
    const { container } = render(
      <LauncherAppTile
        app={app}
        isPinned={false}
        isPinningMode={false}
        onLaunch={vi.fn()}
        onTogglePinned={vi.fn()}
      />,
    );

    const glyph = container.querySelector<HTMLElement>('.launcherAssetIcon');
    const maskImage = glyph?.style.getPropertyValue(
      '--launcher-icon-mask-image',
    );

    // Raw SVG markup in url() is invalid, which drops the mask and leaves an
    // opaque square, so the mask source must stay an encoded data URL.
    expect(maskImage).toContain('url("data:image/svg+xml,');
    expect(maskImage).not.toContain('<svg');
  });

  it('exposes pin state as a pressed button while managing pins', () => {
    const app = getLauncherApp('reader');
    const { rerender } = render(
      <LauncherAppTile
        app={app}
        isPinned={false}
        isPinningMode
        onLaunch={vi.fn()}
        onTogglePinned={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Reader' }))
      .toHaveAttribute('aria-pressed', 'false');

    rerender(
      <LauncherAppTile
        app={app}
        isPinned
        isPinningMode
        onLaunch={vi.fn()}
        onTogglePinned={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: 'Reader' }))
      .toHaveAttribute('aria-pressed', 'true');
  });

  it('uses separate launch and pin actions', () => {
    const app = getLauncherApp('reader');
    const onLaunch = vi.fn();
    const onTogglePinned = vi.fn();
    const { rerender } = render(
      <LauncherAppTile
        app={app}
        isPinned={false}
        isPinningMode={false}
        onLaunch={onLaunch}
        onTogglePinned={onTogglePinned}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Reader' }));
    expect(onLaunch).toHaveBeenCalledWith('reader');
    expect(onTogglePinned).not.toHaveBeenCalled();

    rerender(
      <LauncherAppTile
        app={app}
        isPinned={false}
        isPinningMode
        onLaunch={onLaunch}
        onTogglePinned={onTogglePinned}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Reader' }));
    expect(onTogglePinned).toHaveBeenCalledWith('reader');
  });

  it('uses the launcher app tile corner shape', () => {
    const app = getLauncherApp('reader');
    render(
      <LauncherAppTile
        app={app}
        isPinned={false}
        isPinningMode={false}
        onLaunch={vi.fn()}
        onTogglePinned={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Reader' }))
      .toHaveStyle({ borderRadius: `${CornerRadius.MEDIUM}px` });
  });
});
