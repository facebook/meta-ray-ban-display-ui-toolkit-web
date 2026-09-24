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
import {
  QUICK_SETTINGS_APP_ICON_TEST_ID,
  QuickSettingsAppTile,
} from './QuickSettingsAppTile';

afterEach(cleanup);

describe('QuickSettingsAppTile', () => {
  it('uses WebAppIcon material while preserving tile activation', () => {
    const app = getLauncherApp('notes');
    const onClick = vi.fn();
    render(
      <QuickSettingsAppTile
        ariaLabel="Notes"
        icon={app.icon}
        iconMaterialTheme={app.materialTheme}
        onClick={onClick}
      />,
    );

    const tile = screen.getByRole('button', { name: 'Notes' });
    // Queried through the tile's own test hook rather than a toolkit class
    // substring, which would match unrelated elements or break under hashing.
    expect(screen.getByTestId(QUICK_SETTINGS_APP_ICON_TEST_ID))
      .toBeInTheDocument();

    fireEvent.click(tile);
    expect(onClick).toHaveBeenCalledOnce();
  });
});
