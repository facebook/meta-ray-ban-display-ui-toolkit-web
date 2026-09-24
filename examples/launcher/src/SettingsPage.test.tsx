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
import { APP_GRID_STYLES } from './appGridStyle';
import { SettingsPage } from './SettingsPage';

afterEach(cleanup);

describe('SettingsPage', () => {
  it('shows the active app grid style and opens its picker', () => {
    const onOpenAppGridStyle = vi.fn();
    render(
      <SettingsPage
        appGridStyle={APP_GRID_STYLES.THREE_COLUMN_ICONS}
        onOpenAppGridStyle={onOpenAppGridStyle}
      />,
    );

    expect(screen.getByText('Three columns')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /App grid style/ }));
    expect(onOpenAppGridStyle).toHaveBeenCalledOnce();
  });
});
