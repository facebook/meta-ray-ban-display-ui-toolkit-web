/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  memo,
  useMemo,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { Container } from '@wearables-ui-toolkit/foundation/components/Container';
import { VisualState } from '@wearables-ui-toolkit/foundation/base/Interactions';
import { IconImage, type IconSource } from '@wearables-ui-toolkit/foundation/components/IconImage';
import type { ContainerMaterial } from '@wearables-ui-toolkit/foundation';
import {
  CornerRadius,
  RoundedRectangleShapeProvider,
  type ShapeProvider,
} from '@wearables-ui-toolkit/foundation/material/ShapeProvider';
import {
  Avatar,
  AvatarSize,
  type AvatarShape,
  type PlaceholderStyle,
  type StatusIndicatorType,
} from '../Avatar';
import {
  APP_CONTROL_TILE_IMAGE_CONTAINER_SIZE,
  APP_CONTROL_TILE_IMAGE_SIZE,
} from './AppControlTileMetrics';
import styles from '../AppControlTile.module.css';

export interface AppControlTileMediaProps {
  avatarSrc?: string;
  avatarPrimaryContent?: ReactNode;
  avatarAlt?: string;
  avatarBadgeSrc?: string;
  avatarBadgeContent?: ReactNode;
  avatarStatusIndicator?: StatusIndicatorType;
  /** Glyph drawn on the avatar status dot. */
  avatarStatusIndicatorIcon?: IconSource;
  /** Shape of the avatar primary image. */
  avatarPrimaryImageShape?: AvatarShape;
  /** Placeholder style for the avatar. */
  avatarPlaceholderStyle?: PlaceholderStyle;
  iconSrc?: string;
  iconContent?: ReactNode;
  iconContainerMaterial?: ContainerMaterial;
  iconContainerShapeProvider?: ShapeProvider;
}

const preserveIconMaterialScale = () => 1;
const APP_IMAGE_CONTAINER_STYLE: CSSProperties = {
  width: APP_CONTROL_TILE_IMAGE_CONTAINER_SIZE,
  height: APP_CONTROL_TILE_IMAGE_CONTAINER_SIZE,
  minWidth: APP_CONTROL_TILE_IMAGE_CONTAINER_SIZE,
  minHeight: APP_CONTROL_TILE_IMAGE_CONTAINER_SIZE,
};
const APP_ICON_CONTAINER_STYLE: CSSProperties = {
  width: APP_CONTROL_TILE_IMAGE_SIZE,
  height: APP_CONTROL_TILE_IMAGE_SIZE,
};
const DEFAULT_APP_ICON_SHAPE_PROVIDER =
  new RoundedRectangleShapeProvider(CornerRadius.FULL);

export const AppControlTileMedia = memo(function AppControlTileMedia({
  avatarSrc,
  avatarPrimaryContent,
  avatarAlt,
  avatarBadgeSrc,
  avatarBadgeContent,
  avatarStatusIndicator,
  avatarStatusIndicatorIcon,
  avatarPrimaryImageShape,
  avatarPlaceholderStyle,
  iconSrc,
  iconContent,
  iconContainerMaterial,
  iconContainerShapeProvider = DEFAULT_APP_ICON_SHAPE_PROVIDER,
}: AppControlTileMediaProps) {
  const hasAvatar = avatarSrc != null || avatarPrimaryContent != null;
  const resolvedIconContent = iconContent ?? (
    iconSrc == null ? null : <IconImage source={{ uri: iconSrc, tinted: false }} />
  );

  // The inner-shadow effect is disabled on the icon-container material so the
  // icon backdrop never draws an inner shadow.
  const iconMaterial = useMemo(
    () => iconContainerMaterial?.withoutInnerShadow(),
    [iconContainerMaterial],
  );

  return (
    <div
      className={styles.appImageContainer}
      style={APP_IMAGE_CONTAINER_STYLE}
    >
      {hasAvatar ? (
        <Avatar
          src={avatarSrc}
          primaryContent={avatarPrimaryContent}
          alt={avatarAlt}
          size={AvatarSize.MEDIUM}
          statusIndicator={avatarStatusIndicator}
          statusIndicatorIcon={avatarStatusIndicatorIcon}
          primaryImageShape={avatarPrimaryImageShape}
          placeholderStyle={avatarPlaceholderStyle}
          badgeImageSrc={avatarBadgeSrc}
          badgeContent={avatarBadgeContent}
        />
      ) : resolvedIconContent != null && iconMaterial ? (
        <Container
          className={styles.appIconMaterial}
          width={APP_CONTROL_TILE_IMAGE_CONTAINER_SIZE}
          height={APP_CONTROL_TILE_IMAGE_CONTAINER_SIZE}
          material={iconMaterial}
          shapeProvider={iconContainerShapeProvider}
          visualStateOverride={VisualState.FOCUSED}
          contentScaleForStateFn={preserveIconMaterialScale}
          interactive={false}
          focusable={false}
          pressable={false}
          clickable={false}
          tabIndex={-1}
        >
          <div className={styles.appIconMaterialContent}>
            <div
              className={styles.appIconContainer}
              style={APP_ICON_CONTAINER_STYLE}
            >
              {resolvedIconContent}
            </div>
          </div>
        </Container>
      ) : resolvedIconContent != null ? (
        <div
          className={styles.appIconContainer}
          style={APP_ICON_CONTAINER_STYLE}
        >
          {resolvedIconContent}
        </div>
      ) : null}
    </div>
  );
});
