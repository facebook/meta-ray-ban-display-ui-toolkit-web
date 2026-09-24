/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  launcherIcons,
  type LauncherIcon,
} from './appIcons';
import type { SampleAppTileThemeName } from './appTileMaterials';

export type AppId =
  | 'trail-guide'
  | 'forecast'
  | 'notes'
  | 'soundscape'
  | 'gallery'
  | 'wayfinder'
  | 'camera'
  | 'translate'
  | 'timer'
  | 'reader'
  | 'discover'
  | 'color-grid';

export interface LauncherApp {
  id: AppId;
  icon: LauncherIcon;
  materialTheme: SampleAppTileThemeName;
  title: string;
}

export type HomeCardAction =
  | { type: 'announce'; message: string }
  | { type: 'launchApp'; appId: AppId };

export interface HomeCard {
  id: string;
  icon: LauncherIcon;
  materialTheme: SampleAppTileThemeName;
  title: string;
  subtitle?: string;
  action: HomeCardAction;
}

export const SAMPLE_APPS: readonly LauncherApp[] = [
  { id: 'trail-guide', icon: launcherIcons.trailGuide, materialTheme: 'trail', title: 'Trail Guide' },
  { id: 'forecast', icon: launcherIcons.forecast, materialTheme: 'forecast', title: 'Forecast' },
  { id: 'notes', icon: launcherIcons.notes, materialTheme: 'notes', title: 'Notes' },
  { id: 'soundscape', icon: launcherIcons.soundscape, materialTheme: 'soundscape', title: 'Soundscape' },
  { id: 'gallery', icon: launcherIcons.gallery, materialTheme: 'gallery', title: 'Gallery' },
  { id: 'wayfinder', icon: launcherIcons.wayfinder, materialTheme: 'wayfinder', title: 'Wayfinder' },
  { id: 'camera', icon: launcherIcons.camera, materialTheme: 'camera', title: 'Camera' },
  { id: 'translate', icon: launcherIcons.translate, materialTheme: 'translate', title: 'Translate' },
  { id: 'timer', icon: launcherIcons.timer, materialTheme: 'timer', title: 'Timer' },
  { id: 'reader', icon: launcherIcons.reader, materialTheme: 'reader', title: 'Reader' },
  { id: 'discover', icon: launcherIcons.discover, materialTheme: 'discover', title: 'Discover' },
  { id: 'color-grid', icon: launcherIcons.colorGrid, materialTheme: 'colorGrid', title: 'Color Grid' },
];

export const HOME_CARDS: readonly HomeCard[] = [
  {
    id: 'navigation-tips',
    icon: launcherIcons.wayfinder,
    materialTheme: 'wayfinder',
    title: 'Learn the controls',
    subtitle: 'Try directional focus and selection.',
    action: { type: 'announce', message: 'Learn the controls' },
  },
  {
    id: 'plan-route',
    icon: launcherIcons.trailGuide,
    materialTheme: 'trail',
    title: 'Plan a walking route',
    subtitle: 'Open Trail Guide.',
    action: { type: 'launchApp', appId: 'trail-guide' },
  },
  {
    id: 'play-color-grid',
    icon: launcherIcons.colorGrid,
    materialTheme: 'colorGrid',
    title: 'Play Color Grid',
    subtitle: 'Continue your last puzzle.',
    action: { type: 'launchApp', appId: 'color-grid' },
  },
  {
    id: 'check-forecast',
    icon: launcherIcons.forecast,
    materialTheme: 'forecast',
    title: 'Check the forecast',
    action: { type: 'launchApp', appId: 'forecast' },
  },
];

export const DEFAULT_PINNED_APP_IDS: readonly AppId[] = [
  'trail-guide',
  'forecast',
];

const APPS_BY_ID = new Map(SAMPLE_APPS.map(app => [app.id, app]));

// Locale-independent on purpose: a locale-sensitive lowercase can map ASCII
// letters onto characters this then strips, so the same app name would
// normalize differently depending on where the sample runs.
function normalizeAppName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function findLauncherApp(value: string): LauncherApp | undefined {
  const normalizedValue = normalizeAppName(value);
  return SAMPLE_APPS.find(app =>
    normalizeAppName(app.id) === normalizedValue ||
    normalizeAppName(app.title) === normalizedValue);
}

export function getLauncherApp(id: AppId): LauncherApp {
  const app = APPS_BY_ID.get(id);
  if (app == null) {
    throw new Error(`Unknown sample app: ${id}`);
  }
  return app;
}

export function getAppsForGrid(
  pinnedAppIds: readonly AppId[],
): readonly LauncherApp[] {
  const usedAppIds = new Set<AppId>();
  const apps: LauncherApp[] = [];

  for (const appId of pinnedAppIds) {
    const app = APPS_BY_ID.get(appId);
    if (app != null && !usedAppIds.has(appId)) {
      apps.push(app);
      usedAppIds.add(appId);
    }
  }

  for (const app of SAMPLE_APPS) {
    if (!usedAppIds.has(app.id)) {
      apps.push(app);
    }
  }

  return apps;
}
