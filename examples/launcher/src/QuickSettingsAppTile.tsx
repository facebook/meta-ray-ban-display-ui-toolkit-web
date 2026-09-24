/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { memo, useMemo, type Ref } from 'react';
import {
  AppControlTile,
  CornerRadius,
  RoundedRectangleShapeProvider,
} from '@wearables-ui-toolkit/mrbd';
import { createLauncherArtworkSource, type LauncherIcon } from './appIcons';
import {
  createLauncherWebAppIconMaterial,
  type SampleAppTileThemeName,
} from './appTileMaterials';
import { classNames } from './launcherUtils';

/** Stable hook for tests; the tile's icon slot is otherwise only reachable through toolkit class names. */
export const QUICK_SETTINGS_APP_ICON_TEST_ID = 'quick-settings-app-icon';

/** The app shortcuts render as circles, unlike the rounded control tiles. */
const QUICK_SETTINGS_APP_ICON_SHAPE_PROVIDER =
  new RoundedRectangleShapeProvider(CornerRadius.FULL);

export const QuickSettingsAppTile = memo(function QuickSettingsAppTile({
  ariaLabel,
  className,
  icon,
  iconMaterialTheme,
  initialFocusEligible = true,
  onClick,
  tileRef,
  title,
}: {
  ariaLabel?: string;
  className?: string;
  icon: LauncherIcon;
  iconMaterialTheme: SampleAppTileThemeName;
  initialFocusEligible?: boolean;
  onClick: () => void;
  tileRef?: Ref<HTMLDivElement>;
  title?: string;
}) {
  const iconRendering = useMemo(
    () => createLauncherWebAppIconMaterial(
      iconMaterialTheme,
      createLauncherArtworkSource(icon),
    ),
    [icon, iconMaterialTheme],
  );

  return (
    <AppControlTile
      ref={tileRef}
      className={classNames('quickAppTile', className)}
      height="var(--launcher-tile-height)"
      iconContent={(
        <span
          aria-hidden="true"
          data-testid={QUICK_SETTINGS_APP_ICON_TEST_ID}
        />
      )}
      iconContainerMaterial={iconRendering.material}
      iconContainerShapeProvider={QUICK_SETTINGS_APP_ICON_SHAPE_PROVIDER}
      initialFocusEligible={initialFocusEligible}
      onClick={onClick}
      title={title}
      aria-label={ariaLabel ?? title}
      width="100%"
    />
  );
});
