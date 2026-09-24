/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useMemo } from 'react';
import {
  useWebMcpTools,
  type WebMcpTool,
} from '../../shared/webmcp';
import {
  APP_GRID_STYLES,
  APP_GRID_STYLE_LABELS,
  type AppGridStyle,
} from './appGridStyle';
import {
  SAMPLE_APPS,
  findLauncherApp,
  type AppId,
} from './launcherCatalog';

interface LauncherAgentToolsProps {
  onAppGridStyleChange: (style: AppGridStyle) => void;
  onSetAppPinned: (appId: AppId, pinned: boolean) => void;
}

function parseGridStyle(value: unknown): AppGridStyle | null {
  if (value === 'two_columns') {
    return APP_GRID_STYLES.TWO_COLUMN_TILES;
  }
  if (value === 'three_columns') {
    return APP_GRID_STYLES.THREE_COLUMN_ICONS;
  }
  return null;
}

export function LauncherAgentTools({
  onAppGridStyleChange,
  onSetAppPinned,
}: LauncherAgentToolsProps) {
  const tools = useMemo<readonly WebMcpTool[]>(() => {
    const layoutTool: WebMcpTool = {
      name: 'set_launcher_layout',
      description:
        'Sets the launcher sample to the two-column tile or three-column icon layout.',
      inputSchema: {
        type: 'object',
        properties: {
          layout: {
            type: 'string',
            description: 'Use two_columns or three_columns.',
          },
        },
        required: ['layout'],
      },
      execute: input => {
        const style = parseGridStyle(input.layout);
        if (style == null) {
          return {
            error: 'invalid_layout',
            message: 'Choose two_columns or three_columns.',
            next_action: 'Ask which launcher layout the user prefers.',
          };
        }

        onAppGridStyleChange(style);
        return {
          layout: style === APP_GRID_STYLES.TWO_COLUMN_TILES
            ? 'two_columns'
            : 'three_columns',
          label: APP_GRID_STYLE_LABELS[style],
          next_action: 'Confirm the launcher layout was updated.',
        };
      },
    };
    const pinTool: WebMcpTool = {
      name: 'set_app_pinned',
      description:
        'Pins or unpins an app tile in the launcher sample without opening it.',
      inputSchema: {
        type: 'object',
        properties: {
          app: {
            type: 'string',
            description: 'App name shown in the launcher sample.',
          },
          pinned: {
            type: 'boolean',
            description: 'Whether the app tile should be pinned.',
          },
        },
        required: ['app', 'pinned'],
      },
      execute: input => {
        if (typeof input.app !== 'string' || typeof input.pinned !== 'boolean') {
          return {
            error: 'invalid_pin_preference',
            message: 'Choose an app and whether it should be pinned.',
            next_action: 'Ask which app tile the user wants to pin or unpin.',
          };
        }

        const app = findLauncherApp(input.app);
        if (app == null) {
          return {
            error: 'unknown_app',
            message: `No launcher tile matches ${input.app.trim()}.`,
            availableApps: SAMPLE_APPS.map(candidate => candidate.title),
            next_action: 'Ask the user to choose an available app tile.',
          };
        }

        onSetAppPinned(app.id, input.pinned);
        return {
          app: app.title,
          pinned: input.pinned,
          next_action:
            `Confirm ${app.title} is ${input.pinned ? 'pinned' : 'unpinned'}.`,
        };
      },
    };
    return [layoutTool, pinTool];
  }, [
    onAppGridStyleChange,
    onSetAppPinned,
  ]);
  useWebMcpTools(tools);
  return null;
}
