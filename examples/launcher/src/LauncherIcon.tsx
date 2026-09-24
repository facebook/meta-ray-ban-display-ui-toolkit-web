/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { memo, useMemo, type CSSProperties } from 'react';
import {
  Container,
  CornerRadius,
  RoundedRectangleShapeProvider,
  VisualState,
} from '@wearables-ui-toolkit/mrbd';
import {
  type SampleAppTileThemeName,
} from './appTileMaterials';
import { createLauncherTileMaterial } from './appTileMaterials';
import type { LauncherIcon as LauncherIconDefinition } from './appIcons';
import { createLauncherIconUrl } from './appIcons';
import { classNames } from './launcherUtils';

type LauncherIconStyle = CSSProperties & {
  '--launcher-icon-light-color': string;
  '--launcher-icon-mask-image': string;
};

const ICON_MATERIAL_STYLE: CSSProperties = {
  flex: '0 0 auto',
  height: 'var(--launcher-icon-size)',
  width: 'var(--launcher-icon-size)',
};
const ICON_MATERIAL_SURFACE_STYLE: CSSProperties = {
  opacity: 'var(--launcher-app-icon-material-opacity)',
};
const preserveContentScale = () => 1;

export const LauncherAssetIcon = memo(function LauncherAssetIcon({
  icon,
  className,
}: {
  icon: LauncherIconDefinition;
  className?: string;
}) {
  const style: LauncherIconStyle = {
    '--launcher-icon-light-color': `rgb(${icon.lightingRgb})`,
    '--launcher-icon-mask-image': `url("${createLauncherIconUrl(icon)}")`,
    transform: `translate(${icon.opticalOffsetX ?? '0'}, ${
      icon.opticalOffsetY ?? '0'
    }) scale(${icon.opticalScale})`,
  };

  return (
    <span aria-hidden="true" className="launcherAssetIconFrame">
      <span
        className={classNames('launcherAssetIcon', className)}
        style={style}
      />
    </span>
  );
});

export const LauncherIconMaterial = memo(function LauncherIconMaterial({
  className,
  cornerRadius = CornerRadius.LARGE,
  icon,
  iconClassName,
  materialTheme,
}: {
  className?: string;
  cornerRadius?: CornerRadius;
  icon: LauncherIconDefinition;
  iconClassName?: string;
  materialTheme: SampleAppTileThemeName;
}) {
  const material = useMemo(
    () => createLauncherTileMaterial(materialTheme, false),
    [materialTheme],
  );
  const shapeProvider = useMemo(
    () => new RoundedRectangleShapeProvider(cornerRadius),
    [cornerRadius],
  );

  return (
    <div
      className={classNames('launcherIconMaterial', className)}
      style={ICON_MATERIAL_STYLE}
    >
      <Container
        aria-hidden="true"
        className="launcherIconMaterialSurface"
        contentScaleForStateFn={preserveContentScale}
        focusable={false}
        height="100%"
        initialFocusEligible={false}
        interactive={false}
        material={material}
        shapeProvider={shapeProvider}
        pressable={false}
        style={ICON_MATERIAL_SURFACE_STYLE}
        tabIndex={-1}
        visualStateOverride={VisualState.FOCUSED}
        width="100%"
      />
      <LauncherAssetIcon className={iconClassName} icon={icon} />
    </div>
  );
});
