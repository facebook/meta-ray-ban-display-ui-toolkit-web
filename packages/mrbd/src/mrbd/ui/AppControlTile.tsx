/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * AppControlTile component for Meta Ray-Ban Display
 *
 * An app-branded control tile displaying an app image or avatar with an
 * optional title. When the title is absent, the image is centered.
 *
 * The app image and avatar are mutually exclusive -- only one is shown.
 * Setting avatarSrc or avatarPrimaryContent hides the app image, and vice versa.
 *
 * Extends Container, which provides focus/press state visual transitions
 * with material backgrounds.
 *
 * Features:
 * - App icon image OR Avatar (mutually exclusive)
 * - Optional title with multi-line support
 * - Optional status icon below title
 * - Marquee scrolling for long titles (enableTitleMarquee)
 * - Fade edge effect when title overflows
 * - Focus/press state handling via Container
 */

import {
  Children,
  forwardRef,
  memo,
  useMemo,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { Container } from '@wearables-ui-toolkit/foundation/components/Container';
import {
  CornerRadius,
  RoundedRectangleShapeProvider,
} from '@wearables-ui-toolkit/foundation/material/ShapeProvider';
import { IconImage } from '@wearables-ui-toolkit/foundation/components/IconImage';
import type { AppControlTileProps } from './AppControlTile.types';
import { APP_CONTROL_TILE_MIN_HEIGHT } from './private/AppControlTileMetrics';
import {
  getAppControlTileAccessibilityLabel,
  getAppControlTileClassNames,
  hasAppControlTileTitle,
} from './private/AppControlTileLayout';
import { createAppControlTileMaterial } from './private/AppControlTileMaterials';
import { AppControlTileMedia } from './private/AppControlTileMedia';
import { AppControlTileTitle } from './private/AppControlTileTitle';
import { useAppControlTileTitleOverflow } from './private/useAppControlTileTitleOverflow';
import styles from './AppControlTile.module.css';

export type { AppControlTileProps } from './AppControlTile.types';

const EMPTY_APP_CONTROL_TILE_STYLE: CSSProperties = {};
const DEFAULT_APP_CONTROL_TILE_SHAPE_PROVIDER =
  new RoundedRectangleShapeProvider(CornerRadius.MEDIUM);

function hasRenderableStatusMedia(statusMedia: ReactNode): boolean {
  return Children.toArray(statusMedia).some(
    child => typeof child !== 'string' || child.length > 0,
  );
}

// ---------- Component ----------

/**
 * AppControlTile
 *
 * An app-branded tile with icon/avatar and optional title.
 * Interactive (clickable, focusable) via Container.
 */
export const AppControlTile = memo(forwardRef<HTMLDivElement, AppControlTileProps>(
  function AppControlTile(
    {
      title,
      enableTitleMarquee = false,
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
      iconContainerShapeProvider,
      statusIcon,
      statusMedia,
      width,
      height,
      material: materialProp,
      shapeProvider = DEFAULT_APP_CONTROL_TILE_SHAPE_PROVIDER,
      disabled = false,
      onClick,
      className = '',
      style = EMPTY_APP_CONTROL_TILE_STYLE,
      ...containerProps
    },
    ref,
  ) {
    const titleText = title ?? '';
    const hasTitle = hasAppControlTileTitle(titleText);
    const resolvedStatusMedia = hasRenderableStatusMedia(statusMedia)
      ? statusMedia
      : statusIcon != null
        ? <IconImage source={statusIcon} />
        : undefined;
    const hasStatusIcon = resolvedStatusMedia != null;
    const material = useMemo(
      () => materialProp ?? createAppControlTileMaterial(),
      [materialProp],
    );
    const { titleRef, isTitleOverflowing } = useAppControlTileTitleOverflow({
      title: titleText,
      hasTitle,
      hasStatusIcon,
      enableTitleMarquee,
    });

    /**
     * Title CSS classes.
     * Single line when status icon is present.
     * Marquee when enabled and title overflows.
     * Fade edge when overflowing without marquee.
     */
    const {
      titleClassName,
      rootClassName,
      rootStyle,
    } = useMemo(
      () => getAppControlTileClassNames({
        styles,
        hasTitle,
        hasStatusIcon,
        enableTitleMarquee,
        isTitleOverflowing,
      }),
      [enableTitleMarquee, hasStatusIcon, hasTitle, isTitleOverflowing],
    );

    /**
     * Accessible label.
     */
    const accessibilityLabel = useMemo(() => {
      return getAppControlTileAccessibilityLabel({ title });
    }, [title]);
    const containerClassName = useMemo(
      () => `${styles.appControlTile} ${className}`,
      [className],
    );

    /**
     * When no explicit height is provided, apply a minimum height (so content
     * can grow) instead of a fixed height. When height is provided, the fixed
     * height is passed to Container directly.
     */
    const containerStyle = useMemo<CSSProperties>(
      () => (height == null ? { minHeight: APP_CONTROL_TILE_MIN_HEIGHT, ...style } : style),
      [height, style],
    );

    return (
      <Container
        ref={ref}
        className={containerClassName}
        style={containerStyle}
        width={width}
        height={height}
        material={material}
        shapeProvider={shapeProvider}
        disabled={disabled}
        onClick={onClick}
        role="button"
        tabIndex={0}
        aria-label={accessibilityLabel}
        {...containerProps}
      >
        {/* Layout is HORIZONTAL.
            Image container on left, title container on right. */}
        <div className={rootClassName} style={rootStyle}>
          <AppControlTileMedia
            avatarSrc={avatarSrc}
            avatarPrimaryContent={avatarPrimaryContent}
            avatarAlt={avatarAlt}
            avatarBadgeSrc={avatarBadgeSrc}
            avatarBadgeContent={avatarBadgeContent}
            avatarStatusIndicator={avatarStatusIndicator}
            avatarStatusIndicatorIcon={avatarStatusIndicatorIcon}
            avatarPrimaryImageShape={avatarPrimaryImageShape}
            avatarPlaceholderStyle={avatarPlaceholderStyle}
            iconSrc={iconSrc}
            iconContent={iconContent}
            iconContainerMaterial={iconContainerMaterial}
            iconContainerShapeProvider={iconContainerShapeProvider}
          />

          {/* Title + status icon area — fills remaining width */}
          {hasTitle && (
            <AppControlTileTitle
              title={titleText}
              titleClassName={titleClassName}
              titleRef={titleRef}
              statusIcon={resolvedStatusMedia}
            />
          )}
        </div>
      </Container>
    );
  },
));
