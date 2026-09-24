/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Chip component for Meta Ray-Ban Display
 *
 * A text chip that extends StaticContainer. Used by Tooltip for presentation,
 * but can also be used for static labels with dynamic text updates.
 *
 * Features:
 * - Text display with optional icon, avatar, and metadata
 * - Loading state with IndeterminateLoader
 * - Three styles: EMPHASIZED, DEEMPHASIZED (default), ELEVATED
 * - mix-blend-mode: screen for DEEMPHASIZED style (additive blending)
 * - Avatar support through the public avatar props
 */

import {
  forwardRef,
  memo,
  useMemo,
  type CSSProperties,
} from 'react';
import {
  StaticContainer,
} from '@wearables-ui-toolkit/foundation';
import { IconImage } from '@wearables-ui-toolkit/foundation/components/IconImage';
import { RoundedRectangleShapeProvider } from '@wearables-ui-toolkit/foundation/material/ShapeProvider';
import { Avatar } from './Avatar';
import { IndeterminateLoader, IndeterminateLoaderSize } from './IndeterminateLoader';
import {
  chipAvatarSizeToAvatarSize,
  getChipContentState,
  getChipCornerRadius,
} from './private/ChipLayout';
import {
  CHIP_LOADING_SWAP_ENTER_DURATION_MS,
  CHIP_LOADING_SWAP_ENTER_TIMING_FUNCTION,
  CHIP_LOADING_SWAP_EXIT_TIMING_FUNCTION,
  CHIP_LOADING_SWAP_MIDPOINT_MS,
  createChipLeadingSnapshot,
  useChipLeadingTransition,
} from './private/ChipAnimation';
import { createChipMaterialForStyle } from './private/ChipMaterials';
import { ChipAvatarSize, ChipStyle } from './Chip.types';
import type { ChipProps } from './Chip.types';
import styles from './Chip.module.css';

export { ChipAvatarSize, ChipStyle } from './Chip.types';
export type { ChipProps } from './Chip.types';

const DEFAULT_STYLE: CSSProperties = {};

/**
 * Get CSS class for text style
 */
function getTextStyleClass(chipStyle: ChipStyle): string {
  switch (chipStyle) {
    case ChipStyle.EMPHASIZED:
      return styles.textEmphasized;
    case ChipStyle.ELEVATED:
      return styles.textElevated;
    case ChipStyle.DEEMPHASIZED:
    default:
      return styles.textDeemphasized;
  }
}

/**
 * Get CSS class for icon style
 */
function getIconStyleClass(chipStyle: ChipStyle): string {
  switch (chipStyle) {
    case ChipStyle.EMPHASIZED:
      return styles.iconEmphasized;
    case ChipStyle.ELEVATED:
      return styles.iconElevated;
    case ChipStyle.DEEMPHASIZED:
    default:
      return styles.iconDeemphasized;
  }
}

// ============================================================================
// Component
// ============================================================================

/**
 * Chip component
 * Text chip with optional icon, avatar, loading state, and metadata.
 *
 * Usage:
 * ```tsx
 * <Chip text="Label" />
 * <Chip text="Loading..." isLoading />
 * <Chip text="With Icon" icon={notificationIcon} />
 * <Chip text="With Avatar" showAvatar avatarSrc="/img.jpg" />
 * ```
 */
export const Chip = memo(forwardRef<HTMLDivElement, ChipProps>(
  function Chip(
    {
      text,
      maxLines = 2,
      metadata,
      icon,
      isLoading = false,
      showAvatar = false,
      avatarSrc,
      avatarPrimaryContent,
      avatarAlt,
      avatarSize = ChipAvatarSize.SMALL,
      statusIndicator,
      statusIndicatorIcon,
      primaryImageShape,
      placeholderStyle,
      avatarSecondarySrc,
      avatarSecondaryContent,
      avatarBadgeSrc,
      avatarBadgeContent,
      chipStyle = ChipStyle.DEEMPHASIZED,
      className = '',
      contentClassName: contentClassNameProp = '',
      clipContent = true,
      style = DEFAULT_STYLE,
      shapeProvider: shapeProviderProp,
      ...staticContainerProps
    },
    ref
  ) {
    const hasAvatarContent =
      avatarSrc != null ||
      avatarPrimaryContent != null ||
      avatarSecondarySrc != null ||
      avatarSecondaryContent != null ||
      avatarBadgeSrc != null ||
      avatarBadgeContent != null;

    const {
      hasIcon,
      hasAvatar,
      hasText,
      hasMetadata,
    } = useMemo(
      () => getChipContentState({
        text,
        metadata,
        icon,
        isLoading,
        showAvatar: showAvatar || hasAvatarContent,
      }),
      [
        icon,
        hasAvatarContent,
        isLoading,
        metadata,
        showAvatar,
        text,
      ],
    );

    const targetLeading = useMemo(
      () => createChipLeadingSnapshot({
        avatarAlt,
        avatarBadgeContent,
        avatarBadgeSrc,
        avatarPrimaryContent,
        avatarSecondaryContent,
        avatarSecondarySrc,
        avatarSize,
        avatarSrc,
        hasAvatar,
        hasIcon,
        icon,
        isLoading,
        placeholderStyle,
        primaryImageShape,
        statusIndicator,
        statusIndicatorIcon,
      }),
      [
        avatarAlt,
        avatarBadgeContent,
        avatarBadgeSrc,
        avatarPrimaryContent,
        avatarSecondaryContent,
        avatarSecondarySrc,
        avatarSize,
        avatarSrc,
        hasAvatar,
        hasIcon,
        icon,
        isLoading,
        placeholderStyle,
        primaryImageShape,
        statusIndicator,
        statusIndicatorIcon,
      ],
    );

    const {
      displayedLeading,
      phase: leadingPhase,
      transitionKind: leadingTransitionKind,
      isLayoutAnimating,
      layoutAnimationAnchor,
      layoutAnimationToken,
      onLayoutAnimationComplete,
    } =
      useChipLeadingTransition(targetLeading);
    const renderedHasAvatar = displayedLeading?.kind === 'avatar';
    const renderedHasLeading = displayedLeading != null;
    const usesDirectLoaderLayout =
      displayedLeading?.kind === 'loader' &&
      leadingTransitionKind === 'content';

    const cornerRadius = useMemo(
      () => getChipCornerRadius(renderedHasAvatar, avatarSize),
      [avatarSize, renderedHasAvatar],
    );

    const material = useMemo(
      () => createChipMaterialForStyle(chipStyle),
      [chipStyle],
    );
    const shapeProvider = useMemo(
      () => shapeProviderProp ?? new RoundedRectangleShapeProvider(cornerRadius),
      [cornerRadius, shapeProviderProp],
    );

    // Container margin class
    const containerMarginClass = useMemo(
      () => renderedHasAvatar
        ? styles.chipContainerWithAvatar
        : styles.chipContainerDefault,
      [renderedHasAvatar],
    );

    // Text alignment: centered when no leading element, start-aligned otherwise
    const textAlignClass = useMemo(
      () => renderedHasLeading ? styles.textStart : styles.textCentered,
      [renderedHasLeading],
    );
    const isLayoutTransition =
      leadingPhase === 'layout' ||
      isLayoutAnimating ||
      usesDirectLoaderLayout;
    const shouldClipLayoutContent =
      usesDirectLoaderLayout || !isLayoutTransition;
    const locksTrailingTextDuringLayout =
      isLayoutTransition &&
      (layoutAnimationAnchor === 'end' || usesDirectLoaderLayout);

    // Text style (max lines)
    // CSS -webkit-line-clamp requires display:-webkit-box which is block-level
    // and would expand to fill width. Keep single-line/animated text intrinsic
    // width so container material animations never make it wrap for a frame.
    const textStyle = useMemo<CSSProperties>(
      () => {
        if (isLayoutTransition || maxLines === 1) {
          return {
            overflow: 'visible',
            textOverflow: 'clip',
            whiteSpace: 'nowrap',
            width: 'max-content',
          };
        }

        return {
          ...(maxLines > 0 ? {
            display: '-webkit-box',
            WebkitLineClamp: maxLines,
            WebkitBoxOrient: 'vertical' as const,
            overflow: 'hidden',
            // Tighten word spacing a hair so the long Chip demo wraps at the
            // intended point.
            wordSpacing: '-0.05px',
            width: 'fit-content',
          } : {}),
        };
      },
      [isLayoutTransition, maxLines],
    );

    // Accessibility
    const ariaLabel = useMemo(
      () => [text, metadata].filter(Boolean).join(', ') || undefined,
      [metadata, text],
    );

    const chipClassName = useMemo(
      () => `${styles.chip} ${
        isLayoutTransition ? styles.chipLayoutTransition : ''
      } ${
        locksTrailingTextDuringLayout
          ? styles.chipTrailingAnchorTransition
          : ''
      } ${className}`,
      [className, isLayoutTransition, locksTrailingTextDuringLayout],
    );
    const contentClassName = useMemo(
      () => `${contentClassNameProp} ${
        locksTrailingTextDuringLayout
          ? styles.chipTrailingAnchorContent
          : ''
      }`,
      [contentClassNameProp, locksTrailingTextDuringLayout],
    );

    const avatarWrapperClassName = useMemo(
      () => {
        const renderedAvatarSize = displayedLeading?.kind === 'avatar'
          ? displayedLeading.avatarSize
          : avatarSize;
        return `${styles.avatarWrapper} ${
          renderedAvatarSize === ChipAvatarSize.LARGE ? styles.avatarLarge : styles.avatarSmall
        }`;
      },
      [avatarSize, displayedLeading],
    );

    const iconContainerClassName = useMemo(
      () => `${styles.iconContainer} ${
        (hasText || hasMetadata) ? styles.iconContainerWithText : styles.iconContainerNoText
      }`,
      [hasMetadata, hasText],
    );

    const iconClassName = useMemo(
      () => `${styles.icon} ${getIconStyleClass(chipStyle)}`,
      [chipStyle],
    );

    const textClassName = useMemo(
      () => `${styles.textView} ${getTextStyleClass(chipStyle)} ${textAlignClass}`,
      [chipStyle, textAlignClass],
    );

    const metadataClassName = useMemo(
      () => `${styles.metadataText} ${
        hasText ? styles.metadataWithText : styles.metadataNoText
      }`,
      [hasText],
    );
    const leadingTransitionClassName = useMemo(
      () => `${styles.swapTransition} ${
        leadingTransitionKind === 'loadingSwap'
          ? styles.loadingSwapTransition
          : styles.contentSwapTransition
      } ${
        leadingPhase === 'visible'
          ? styles.swapVisible
          : leadingPhase === 'entering'
            ? styles.swapEntering
            : styles.swapHidden
      }`,
      [leadingPhase, leadingTransitionKind],
    );
    const leadingTransitionStyle = useMemo<CSSProperties | undefined>(
      () => leadingTransitionKind === 'loadingSwap'
        ? {
            '--uit-chip-loading-swap-enter-duration':
              `${CHIP_LOADING_SWAP_ENTER_DURATION_MS}ms`,
            '--uit-chip-loading-swap-enter-easing':
              CHIP_LOADING_SWAP_ENTER_TIMING_FUNCTION,
            '--uit-chip-loading-swap-exit-duration':
              `${CHIP_LOADING_SWAP_MIDPOINT_MS}ms`,
            '--uit-chip-loading-swap-exit-easing':
              CHIP_LOADING_SWAP_EXIT_TIMING_FUNCTION,
          } as CSSProperties
        : undefined,
      [leadingTransitionKind],
    );
    const layoutSignature = useMemo(
      () => [
        text ?? '',
        metadata ?? '',
        maxLines,
        chipStyle,
      ],
      [
        chipStyle,
        maxLines,
        metadata,
        text,
      ],
    );

    return (
      <StaticContainer
        ref={ref}
        material={material}
        shapeProvider={shapeProvider}
        className={chipClassName}
        contentClassName={contentClassName}
        clipContent={shouldClipLayoutContent ? clipContent : false}
        layoutTransitionAnchor={layoutAnimationAnchor}
        layoutTransitionSignature={layoutSignature}
        layoutTransitionToken={layoutAnimationToken}
        onLayoutTransitionComplete={onLayoutAnimationComplete}
        style={style}
        {...staticContainerProps}
      >
        <div
          className={`${styles.chipContainer} ${containerMarginClass}`}
          role="text"
          aria-label={ariaLabel}
        >
          {displayedLeading?.kind === 'avatar' && (
            <div
              className={`${avatarWrapperClassName} ${leadingTransitionClassName}`}
              style={leadingTransitionStyle}
              data-chip-leading-kind="avatar"
              data-chip-leading-phase={leadingPhase}
            >
              <Avatar
                src={displayedLeading.avatarSrc}
                primaryContent={displayedLeading.avatarProps?.primaryContent}
                alt={displayedLeading.avatarAlt}
                size={chipAvatarSizeToAvatarSize(displayedLeading.avatarSize)}
                statusIndicator={displayedLeading.avatarProps?.statusIndicator}
                statusIndicatorIcon={displayedLeading.avatarProps?.statusIndicatorIcon}
                primaryImageShape={displayedLeading.avatarProps?.primaryImageShape}
                placeholderStyle={displayedLeading.avatarProps?.placeholderStyle}
                secondarySrc={displayedLeading.avatarProps?.secondarySrc}
                secondaryContent={displayedLeading.avatarProps?.secondaryContent}
                badgeImageSrc={displayedLeading.avatarProps?.badgeImageSrc}
                badgeContent={displayedLeading.avatarProps?.badgeContent}
              />
            </div>
          )}

          {(displayedLeading?.kind === 'icon' || displayedLeading?.kind === 'loader') && (
            <div
              className={`${iconContainerClassName} ${leadingTransitionClassName}`}
              style={leadingTransitionStyle}
              data-chip-leading-kind={displayedLeading.kind}
              data-chip-leading-phase={leadingPhase}
            >
              {displayedLeading.kind === 'loader' ? (
                <div className={styles.loaderWrapper}>
                  <IndeterminateLoader
                    size={IndeterminateLoaderSize.XSMALL}
                    isAnimating={true}
                  />
                </div>
              ) : (
                <div className={iconClassName}>
                  {displayedLeading.icon != null && (
                    <IconImage source={displayedLeading.icon} />
                  )}
                </div>
              )}
            </div>
          )}

          {/* Text */}
          {hasText && (
            <span
              className={textClassName}
              style={textStyle}
              data-uit-layout-transition-part="chip-text"
            >
              {text}
            </span>
          )}

          {/* Metadata */}
          {hasMetadata && (
            <span
              className={metadataClassName}
              data-uit-layout-transition-part="chip-metadata"
            >
              {metadata}
            </span>
          )}
        </div>
      </StaticContainer>
    );
  }
));
