/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * TooltipContainer component for Meta Ray-Ban Display
 * Extends StaticContainer — the visual rendering of a tooltip
 *
 * Non-interactive display component with:
 * - Material background with solid color layer
 * - Plus Lighter blend mode text + icon
 * - Optional metadata and trailing icon
 * - Max 2 lines of text
 * - Pill-shaped container
 */

import {
  type CSSProperties,
  forwardRef,
  memo,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { IconImage } from '@wearables-ui-toolkit/foundation/components/IconImage';
import { useComposedRef } from '@wearables-ui-toolkit/foundation/utils/useComposedRef';
import {
  getTooltipContainerAutoWidth,
  getTooltipContainerDropShadowPadding,
  getTooltipContainerEffectiveSize,
  getTooltipContainerPadding,
  getTooltipContainerStyle,
  getTooltipContainerTailDimensions,
  shouldShowTooltipContainerTail,
} from './private/TooltipContainerLayout';
import { tooltipContainerPath } from './private/TooltipContainerPath';
import type { TooltipContainerProps } from './TooltipContainer.types';
import styles from './TooltipContainer.module.css';

export type {
  TooltipContainerProps,
  TooltipContainerTailDirection,
} from './TooltipContainer.types';

const DEFAULT_STYLE: CSSProperties = {};

/**
 * TooltipContainer component
 * Renders tooltip content with material background and blend mode effects.
 * Managed by a parent Tooltip component for lifecycle/positioning.
 */
export const TooltipContainer = memo(forwardRef<HTMLDivElement, TooltipContainerProps>(
  function TooltipContainer(
    {
      text,
      metadata,
      icon,
      trailingIcon,
      showTooltipTail = true,
      tailDirection,
      tailCenterX,
      style = DEFAULT_STYLE,
      className = '',
      width,
      height,
    },
    ref
  ) {
    const localRef = useRef<HTMLDivElement | null>(null);
    const [measuredSize, setMeasuredSize] = useState({ width: 0, height: 0 });
    const hasText = Boolean(text);
    const hasMetadata = Boolean(metadata);
    const hasIcon = Boolean(icon);
    const hasTrailingIcon = Boolean(trailingIcon);
    const hasTextContent = hasText || hasMetadata;

    const { tailHeight, tailWidth, tailLayoutPadding } = useMemo(
      () => getTooltipContainerTailDimensions(),
      [],
    );
    const dropShadowPadding = getTooltipContainerDropShadowPadding();
    const showTail = useMemo(
      () => shouldShowTooltipContainerTail(showTooltipTail, tailDirection),
      [showTooltipTail, tailDirection],
    );
    const { paddingTop, paddingBottom } = useMemo(
      () => getTooltipContainerPadding({
        showTail,
        tailDirection,
        tailLayoutPadding,
        dropShadowPadding,
      }),
      [dropShadowPadding, showTail, tailDirection, tailLayoutPadding],
    );
    const autoWidth = useMemo(
      () => getTooltipContainerAutoWidth({
        width,
        measuredWidth: measuredSize.width,
      }),
      [measuredSize.width, width],
    );
    const containerStyle = useMemo<CSSProperties>(
      () => getTooltipContainerStyle({
        paddingTop,
        paddingBottom,
        dropShadowPadding,
        width,
        autoWidth,
        height,
        style,
      }),
      [
        autoWidth,
        dropShadowPadding,
        height,
        paddingBottom,
        paddingTop,
        style,
        width,
      ],
    );

    useLayoutEffect(() => {
      const el = localRef.current;
      if (!el) return;

      const updateSize = () => {
        const rect = el.getBoundingClientRect();
        const nextWidth = Math.round(rect.width * 100) / 100;
        const nextHeight = Math.round(rect.height * 100) / 100;
        setMeasuredSize(prev =>
          prev.width === nextWidth && prev.height === nextHeight
            ? prev
            : { width: nextWidth, height: nextHeight },
        );
      };

      updateSize();
      if (typeof ResizeObserver === 'undefined') {
        return undefined;
      }

      const observer = new ResizeObserver(updateSize);
      observer.observe(el);
      return () => observer.disconnect();
    }, [
      height,
      icon,
      metadata,
      paddingBottom,
      paddingTop,
      showTail,
      tailDirection,
      text,
      trailingIcon,
      width,
    ]);

    const setRefs = useComposedRef(ref, localRef);

    const { width: effectiveWidth, height: effectiveHeight } = useMemo(
      () => getTooltipContainerEffectiveSize({
        measuredWidth: measuredSize.width,
        measuredHeight: measuredSize.height,
        width,
        height,
      }),
      [height, measuredSize.height, measuredSize.width, width],
    );

    const pathD = useMemo(
      () => effectiveWidth > 0 && effectiveHeight > 0
        ? tooltipContainerPath({
            width: effectiveWidth,
            height: effectiveHeight,
            inset: dropShadowPadding,
            tailDirection: showTail ? tailDirection : undefined,
            tailCenterX: tailCenterX ?? effectiveWidth / 2,
            tailHeight,
            tailWidth,
          })
        : null,
      [
        dropShadowPadding,
        effectiveHeight,
        effectiveWidth,
        showTail,
        tailCenterX,
        tailDirection,
        tailHeight,
        tailWidth,
      ],
    );

    const rootClassName = useMemo(
      () => `${styles.tooltipContainer} ${className}`,
      [className],
    );

    const viewBox = useMemo(
      () => `0 0 ${effectiveWidth} ${effectiveHeight}`,
      [effectiveHeight, effectiveWidth],
    );

    const leadingIconClassName = useMemo(
      () => `${styles.icon} ${hasTextContent ? styles.iconWithText : ''}`,
      [hasTextContent],
    );

    const metadataClassName = useMemo(
      () => `${styles.metadata} ${hasText ? styles.metadataWithText : ''}`,
      [hasText],
    );

    const trailingIconClassName = useMemo(
      () => `${styles.trailingIcon} ${
        hasTextContent ? styles.trailingIconWithContent : ''
      }`,
      [hasTextContent],
    );

    return (
      <div
        ref={setRefs}
        className={rootClassName}
        style={containerStyle}
      >
        {pathD && (
          <svg
            className={styles.materialShape}
            viewBox={viewBox}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path d={pathD} fill="var(--uit-color-background-elevation3)" />
          </svg>
        )}

        {/* Content layout */}
        <div className={styles.contentContainer}>
          {/* Leading icon */}
          {hasIcon && (
            <div className={leadingIconClassName}>
              {icon != null && <IconImage source={icon} />}
            </div>
          )}

          {/* Text */}
          {hasText && (
            <span className={styles.text}>{text}</span>
          )}

          {/* Metadata */}
          {hasMetadata && (
            <span className={metadataClassName}>
              {metadata}
            </span>
          )}

          {/* Trailing icon */}
          {hasTrailingIcon && (
            <div className={trailingIconClassName}>
              {trailingIcon != null && (
                <IconImage source={trailingIcon} />
              )}
            </div>
          )}
        </div>

      </div>
    );
  }
));
