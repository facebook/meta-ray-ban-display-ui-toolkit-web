/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getLauncherApp } from './launcherCatalog';
import { LauncherIconGridTile } from './LauncherIconGridTile';

afterEach(cleanup);

describe('LauncherIconGridTile', () => {
  it('uses separate launch and pin actions', () => {
    const app = getLauncherApp('reader');
    const onLaunch = vi.fn();
    const onTogglePinned = vi.fn();
    const { container, rerender } = render(
      <LauncherIconGridTile
        app={app}
        isPinned={false}
        isPinningMode={false}
        itemCount={12}
        itemPosition={10}
        onLaunch={onLaunch}
        onTogglePinned={onTogglePinned}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Reader, 10 of 12' }));
    expect(onLaunch).toHaveBeenCalledWith('reader');
    expect(onTogglePinned).not.toHaveBeenCalled();
    expect(container.querySelector('.launcherIconGridPinBadge')).toBeNull();

    rerender(
      <LauncherIconGridTile
        app={app}
        isPinned={false}
        isPinningMode
        itemCount={12}
        itemPosition={10}
        onLaunch={onLaunch}
        onTogglePinned={onTogglePinned}
      />,
    );
    expect(container.querySelector('.launcherIconGridPinBadge')).toBeNull();

    rerender(
      <LauncherIconGridTile
        app={app}
        isPinned
        isPinningMode
        itemCount={12}
        itemPosition={10}
        onLaunch={onLaunch}
        onTogglePinned={onTogglePinned}
      />,
    );
    const pinTarget = screen.getByRole('button', {
      name: 'Reader, 10 of 12',
    });
    expect(pinTarget).toHaveAttribute('aria-pressed', 'true');
    expect(pinTarget).toHaveStyle({ overflow: 'visible' });
    expect(container.querySelector('.launcherAssetIconFrame')).toBeNull();
    expect(container.querySelector('.launcherIconGridMaterialSurface'))
      .toBeInTheDocument();
    expect(container.querySelector('.launcherIconGridPinBadge'))
      .toBeInTheDocument();
    fireEvent.click(pinTarget);
    expect(onTogglePinned).toHaveBeenCalledWith('reader');
  });

  it('toggles the pin when the click lands on the decorative badge', () => {
    const app = getLauncherApp('reader');
    const onTogglePinned = vi.fn();
    const { container } = render(
      <LauncherIconGridTile
        app={app}
        isPinned
        isPinningMode
        itemCount={12}
        itemPosition={10}
        onLaunch={vi.fn()}
        onTogglePinned={onTogglePinned}
      />,
    );

    const badge = container.querySelector<HTMLElement>(
      '.launcherIconGridPinBadge',
    );
    expect(badge).toBeInTheDocument();

    // The badge overlays the tile's own click target, so activation has to
    // reach the tile from a click that lands on the badge itself.
    fireEvent.click(badge as HTMLElement);
    expect(onTogglePinned).toHaveBeenCalledWith('reader');
  });
});
