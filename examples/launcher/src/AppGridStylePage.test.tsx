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
import { AppGridStylePage } from './AppGridStylePage';

afterEach(cleanup);

describe('AppGridStylePage', () => {
  it('renders one selected option and applies a different style immediately', () => {
    const onChange = vi.fn();
    render(
      <AppGridStylePage
        appGridStyle={APP_GRID_STYLES.TWO_COLUMN_TILES}
        onChange={onChange}
      />,
    );

    const tileOption = screen.getByRole('radio', {
      name: 'Two columns, Wide tiles',
    });
    const iconOption = screen.getByRole('radio', {
      name: 'Three columns, Compact icons',
    });
    expect(tileOption).toHaveAttribute('aria-checked', 'true');
    expect(iconOption).toHaveAttribute('aria-checked', 'false');

    fireEvent.click(iconOption);
    expect(onChange).toHaveBeenCalledWith(
      APP_GRID_STYLES.THREE_COLUMN_ICONS,
    );

    onChange.mockClear();
    fireEvent.keyDown(tileOption, { key: 'Enter' });
    fireEvent.keyUp(tileOption, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith(
      APP_GRID_STYLES.TWO_COLUMN_TILES,
    );
  });
});
