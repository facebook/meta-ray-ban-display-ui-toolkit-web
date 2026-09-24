/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Avatar component for Meta Ray-Ban Display
 *
 * Renders a profile picture or similar item with optional status indicator,
 * badge overlay, stroke, and duo layout. Supports CIRCLE and ROUNDED_RECTANGLE
 * shapes, with smooth rounded rect clipping for the latter.
 * Dimensions, badge placement, and status-indicator metrics are resolved from
 * the public `AvatarSize` value through the component's metric helpers.
 */

import {
  forwardRef,
  memo,
  useId,
  useMemo,
  type CSSProperties,
} from 'react';
import {
  AvatarShape,
  AvatarSize,
  AvatarStyle,
  PlaceholderStyle,
} from './Avatar.types';
import type { AvatarProps } from './Avatar.types';
import {
  getAvatarAriaLabel,
  getAvatarBadgeMetrics,
  getAvatarClipPath,
  getAvatarDimension,
  getAvatarDuoMetrics,
  hasAvatarBadge,
  hasAvatarDuoLayout,
} from './private/AvatarLayout';
import {
  DUO_PLACEHOLDER_ICON_SIZE,
  PLACEHOLDER_ICON_SIZE,
} from './private/AvatarMetrics';
import { AvatarClipDefs } from './private/AvatarClipDefs';
import { AvatarBadge } from './private/AvatarBadge';
import { IconImage } from '@wearables-ui-toolkit/foundation/components/IconImage';
import styles from './Avatar.module.css';
export {
  AvatarShape,
  AvatarSize,
  AvatarStyle,
  PlaceholderStyle,
  StatusIndicatorType,
} from './Avatar.types';
export type { AvatarProps } from './Avatar.types';

const DEFAULT_STYLE: CSSProperties = {};

// ============================================================================
// Component
// ============================================================================

/**
 * Avatar component.
 * Displays a user profile picture or placeholder with optional badge/status
 * indicator overlay and stroke effect.
 *
 * Avatar behavior:
 * - Circular clip by default (radius = size/2)
 * - Smooth rounded rect clip when shape=ROUNDED_RECTANGLE
 * - Badge/status indicator in bottom-right with circular cutout from avatar
 * - Stroke overlay via RadialGradientGlowStroke
 */
export const Avatar = memo(forwardRef<HTMLDivElement, AvatarProps>(
  function Avatar(
    {
      src,
      secondarySrc,
      primaryContent,
      secondaryContent,
      alt = 'Profile Picture',
      placeholderStyle = PlaceholderStyle.AVATAR,
      placeholderIcon,
      secondaryPlaceholderIcon,
      size = AvatarSize.SMALL,
      primaryImageShape = AvatarShape.CIRCLE,
      avatarStyle = AvatarStyle.STANDARD,
      statusIndicator,
      statusIndicatorLabels,
      statusIndicatorIcon,
      badgeContent,
      badgeImageSrc,
      showStroke = false,
      className = '',
      style: styleProp = DEFAULT_STYLE,
      ...rest
    },
    ref
  ) {
    const dimension = useMemo(
      () => getAvatarDimension(size),
      [size],
    );
    const isDuo = useMemo(
      () => hasAvatarDuoLayout(secondarySrc, secondaryPlaceholderIcon, secondaryContent),
      [secondaryContent, secondaryPlaceholderIcon, secondarySrc],
    );
    const showBadge = useMemo(
      () => hasAvatarBadge(statusIndicator, badgeImageSrc, badgeContent),
      [badgeContent, badgeImageSrc, statusIndicator],
    );
    const idPrefix = useId().replace(/:/g, '');

    const {
      badgeSize,
      badgeInset,
      cutoutCx: badgeCutoutCx,
      cutoutCy: badgeCutoutCy,
      cutoutR: badgeCutoutR,
    } = useMemo(
      () => getAvatarBadgeMetrics(size, dimension, statusIndicator),
      [dimension, size, statusIndicator],
    );

    const {
      duoSize,
      duoMargin,
      duoR,
      primaryCx: priCx,
      primaryCy: priCy,
      secondaryCx: secCx,
      secondaryCy: secCy,
      secondaryCutoutR: duoSecondaryCutoutR,
    } = useMemo(
      () => getAvatarDuoMetrics(size, dimension),
      [dimension, size],
    );
    const duoPrimaryMaskId = `${idPrefix}-avatar-duo-primary-mask`;
    const duoSecondaryMaskId = `${idPrefix}-avatar-duo-secondary-mask`;
    const avatarClipPath = useMemo(
      () => getAvatarClipPath(dimension, primaryImageShape),
      [dimension, primaryImageShape],
    );

    const placeholderIconSize = PLACEHOLDER_ICON_SIZE[size];
    const duoPlaceholderIconSize = DUO_PLACEHOLDER_ICON_SIZE[size];
    const placeholderStyleVars = useMemo(
      () => ({
        '--uit-avatar-placeholder-icon-size': `${placeholderIconSize}px`,
      }) as CSSProperties,
      [placeholderIconSize],
    );
    const duoPlaceholderStyleVars = useMemo(
      () => ({
        '--uit-avatar-placeholder-icon-size': `${duoPlaceholderIconSize}px`,
      }) as CSSProperties,
      [duoPlaceholderIconSize],
    );

    const containerStyle: CSSProperties = useMemo(
      () => ({
        width: dimension,
        height: dimension,
        ...styleProp,
      }),
      [dimension, styleProp],
    );
    const avatarClipStyle: CSSProperties = useMemo(() => {
      const style: CSSProperties = primaryImageShape === AvatarShape.CIRCLE
        ? { borderRadius: '50%' }
        : {
            clipPath: `path("${avatarClipPath}")`,
            WebkitClipPath: `path("${avatarClipPath}")`,
          };

      if (!showBadge) {
        return style;
      }

      const featherPx = 0.5;
      const cutoutStart = Math.max(0, badgeCutoutR - featherPx);
      const cutoutEnd = badgeCutoutR + featherPx;
      const badgeCutoutMask = [
        `radial-gradient(circle at ${badgeCutoutCx}px ${badgeCutoutCy}px,`,
        `transparent 0 ${cutoutStart}px,`,
        `black ${cutoutEnd}px)`,
      ].join(' ');

      return {
        ...style,
        maskImage: badgeCutoutMask,
        maskRepeat: 'no-repeat',
        maskSize: '100% 100%',
        WebkitMaskImage: badgeCutoutMask,
        WebkitMaskRepeat: 'no-repeat',
        WebkitMaskSize: '100% 100%',
      };
    }, [
      avatarClipPath,
      badgeCutoutCx,
      badgeCutoutCy,
      badgeCutoutR,
      primaryImageShape,
      showBadge,
    ]);
    const duoPrimaryMaskStyle = useMemo(
      () => ({
        mask: `url(#${duoPrimaryMaskId})`,
        WebkitMask: `url(#${duoPrimaryMaskId})`,
      }),
      [duoPrimaryMaskId],
    );
    const duoSecondaryMaskStyle = useMemo(
      () => ({
        mask: `url(#${duoSecondaryMaskId})`,
        WebkitMask: `url(#${duoSecondaryMaskId})`,
      }),
      [duoSecondaryMaskId],
    );
    const duoPrimaryImageStyle = useMemo(
      () => ({
        width: duoSize,
        height: duoSize,
        left: duoMargin,
        bottom: duoMargin,
      }),
      [duoMargin, duoSize],
    );
    const duoSecondaryImageStyle = useMemo(
      () => ({
        width: duoSize,
        height: duoSize,
        right: duoMargin,
        top: duoMargin,
      }),
      [duoMargin, duoSize],
    );
    const ariaLabel = useMemo(
      () => getAvatarAriaLabel(alt, statusIndicator, statusIndicatorLabels),
      [alt, statusIndicator, statusIndicatorLabels],
    );
    const rootClassName = useMemo(
      () => `${styles.avatar} ${className}`,
      [className],
    );
    const clippedClassName = useMemo(
      () => `${styles.avatarClipped} ${styles[avatarStyle]}`,
      [avatarStyle],
    );
    const strokeClassName = useMemo(
      () => `${styles.strokeOverlay} ${
        primaryImageShape === AvatarShape.ROUNDED_RECTANGLE
          ? styles.strokeRoundedRect
          : styles.strokeCircle
      }`,
      [primaryImageShape],
    );

    return (
      <div
        ref={ref}
        {...rest}
        className={rootClassName}
        style={containerStyle}
        role="img"
        aria-label={ariaLabel}
      >
        <AvatarClipDefs
          duoPrimaryMaskId={duoPrimaryMaskId}
          duoSecondaryMaskId={duoSecondaryMaskId}
          dimension={dimension}
          showBadge={showBadge}
          badgeCutoutCx={badgeCutoutCx}
          badgeCutoutCy={badgeCutoutCy}
          badgeCutoutR={badgeCutoutR}
          isDuo={isDuo}
          primaryCx={priCx}
          primaryCy={priCy}
          secondaryCx={secCx}
          secondaryCy={secCy}
          duoR={duoR}
          duoSecondaryCutoutR={duoSecondaryCutoutR}
        />

        {/* Background avatar area — clipped by the layer so WebView preserves the badge cutout. */}
        <div
          className={clippedClassName}
          style={avatarClipStyle}
        >
          {isDuo ? (
            // Duo mode: background shows avatar background color only (no image)
            // avatar image background = avatarBackgroundColor
            null
          ) : primaryContent != null ? (
            <div className={styles.avatarContent}>
              {primaryContent}
            </div>
          ) : src ? (
            <img
              src={src}
              alt={alt}
              className={styles.avatarImage}
              draggable={false}
            />
          ) : (
            <div
              className={styles.avatarPlaceholder}
              style={placeholderStyleVars}
              data-placeholder-style={placeholderStyle}
            >
              {placeholderIcon != null && (
                <IconImage source={placeholderIcon} />
              )}
            </div>
          )}
        </div>

        {/* Duo layout: primary image (bottom-left) + secondary image (top-right)
          * Each uses a full-size overlay div clipped by CSS path (in container coords),
          * with the actual image positioned inside using the container margins.
          * The children are clipped at the parent level. */}
        {isDuo && (
          <>
            {/* Primary image layer — clipped to bottom-left circle */}
            <div
              className={styles.duoClipLayer}
              style={duoPrimaryMaskStyle}
            >
              <div
                className={styles.duoImage}
                style={duoPrimaryImageStyle}
              >
                {primaryContent != null ? (
                  <div className={styles.avatarContent}>
                    {primaryContent}
                  </div>
                ) : src ? (
                  <img
                    src={src}
                    alt={alt}
                    className={styles.avatarImage}
                    draggable={false}
                  />
                ) : (
                  <div
                    className={styles.avatarPlaceholder}
                    style={duoPlaceholderStyleVars}
                    data-placeholder-style={placeholderStyle}
                  >
                    {placeholderIcon != null && (
                      <IconImage source={placeholderIcon} />
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Secondary image layer — clipped to top-right circle with primary cutout */}
            <div
              className={styles.duoClipLayer}
              style={duoSecondaryMaskStyle}
            >
              <div
                className={styles.duoImage}
                style={duoSecondaryImageStyle}
              >
                {secondaryContent != null ? (
                  <div className={styles.avatarContent}>
                    {secondaryContent}
                  </div>
                ) : secondarySrc ? (
                  <img
                    src={secondarySrc}
                    alt={`${alt} secondary`}
                    className={styles.avatarImage}
                    draggable={false}
                  />
                ) : (
                  <div
                    className={styles.avatarPlaceholder}
                    style={duoPlaceholderStyleVars}
                  >
                    {secondaryPlaceholderIcon != null && (
                      <IconImage source={secondaryPlaceholderIcon} />
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Stroke overlay — radial gradient glow stroke layer */}
        {showStroke && (
          <div
            className={strokeClassName}
            aria-hidden="true"
          />
        )}

        <AvatarBadge
          showBadge={showBadge}
          badgeSize={badgeSize}
          badgeInset={badgeInset}
          statusIndicator={statusIndicator}
          statusIndicatorLabels={statusIndicatorLabels}
          statusIndicatorIcon={statusIndicatorIcon}
          badgeContent={badgeContent}
          badgeImageSrc={badgeImageSrc}
        />
      </div>
    );
  }
));
