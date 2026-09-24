/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import {
  executeWebMcpTestTool,
  installWebMcpTestHost,
} from '../../shared/webmcpTestHost';
import {
  APP_GRID_STYLES,
  type AppGridStyle,
} from './appGridStyle';
import { LauncherAgentTools } from './LauncherAgentTools';
import type { AppId } from './launcherCatalog';

function TestLauncher() {
  const [style, setStyle] = useState<AppGridStyle>(
    APP_GRID_STYLES.THREE_COLUMN_ICONS,
  );
  const [pinnedAppIds, setPinnedAppIds] = useState<readonly AppId[]>([
    'trail-guide',
    'forecast',
  ]);
  const setAppPinned = (appId: AppId, pinned: boolean) => {
    setPinnedAppIds(current => pinned
      ? current.includes(appId) ? current : [...current, appId]
      : current.filter(id => id !== appId));
  };

  return (
    <>
      <LauncherAgentTools
        onAppGridStyleChange={setStyle}
        onSetAppPinned={setAppPinned}
      />
      <output data-layout={style} data-pinned={pinnedAppIds.join(',')} />
    </>
  );
}

afterEach(() => {
  cleanup();
  delete (document as Document & { modelContext?: unknown }).modelContext;
});

describe('LauncherAgentTools', () => {
  it('sets the grid layout explicitly', async () => {
    const host = installWebMcpTestHost();
    const view = render(<TestLauncher />);
    await waitFor(async () => {
      expect(await host.context.getTools()).toHaveLength(2);
    });

    let result: unknown;
    await act(async () => {
      result = await executeWebMcpTestTool(
        host.context,
        'set_launcher_layout',
        { layout: 'two_columns' },
      );
    });

    expect(result).toMatchObject({
      layout: 'two_columns',
      label: 'Two columns',
    });
    expect(view.container.querySelector('output')).toHaveAttribute(
      'data-layout',
      APP_GRID_STYLES.TWO_COLUMN_TILES,
    );
    host.remove();
  });

  it('pins consecutive named sample tiles without returning stale aggregate state', async () => {
    const host = installWebMcpTestHost();
    const view = render(<TestLauncher />);
    await waitFor(async () => {
      expect(await host.context.getTools()).toHaveLength(2);
    });

    let results: unknown[] = [];
    await act(async () => {
      results = await Promise.all([
        executeWebMcpTestTool(host.context, 'set_app_pinned', {
          app: 'Reader',
          pinned: true,
        }),
        executeWebMcpTestTool(host.context, 'set_app_pinned', {
          app: 'Camera',
          pinned: true,
        }),
      ]);
    });

    expect(results).toEqual([
      expect.objectContaining({app: 'Reader', pinned: true}),
      expect.objectContaining({app: 'Camera', pinned: true}),
    ]);
    expect(results.every(result =>
      typeof result === 'object' && result != null && !('pinnedApps' in result),
    )).toBe(true);
    expect(view.container.querySelector('output')).toHaveAttribute(
      'data-pinned',
      'trail-guide,forecast,reader,camera',
    );
    host.remove();
  });

  it('reports each invalid request instead of changing the launcher', async () => {
    const host = installWebMcpTestHost();
    const view = render(<TestLauncher />);
    await waitFor(async () => {
      expect(await host.context.getTools()).toHaveLength(2);
    });

    const invalidLayout = await executeWebMcpTestTool(
      host.context,
      'set_launcher_layout',
      { layout: 'four_columns' },
    );
    const invalidPin = await executeWebMcpTestTool(
      host.context,
      'set_app_pinned',
      { app: 'Reader', pinned: 'yes' },
    );
    const unknownApp = await executeWebMcpTestTool(
      host.context,
      'set_app_pinned',
      { app: 'Telescope', pinned: true },
    );

    expect(invalidLayout).toMatchObject({ error: 'invalid_layout' });
    expect(invalidPin).toMatchObject({ error: 'invalid_pin_preference' });
    expect(unknownApp).toMatchObject({ error: 'unknown_app' });
    expect(unknownApp).toHaveProperty('availableApps');
    const output = view.container.querySelector('output');
    expect(output).toHaveAttribute(
      'data-layout',
      APP_GRID_STYLES.THREE_COLUMN_ICONS,
    );
    expect(output).toHaveAttribute('data-pinned', 'trail-guide,forecast');
    host.remove();
  });
});
