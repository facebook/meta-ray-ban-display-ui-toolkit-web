/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  forwardRef,
  memo,
  useMemo,
  type CSSProperties,
  type ReactElement,
} from 'react';
import {
  MediaWrapperPosition,
  MediaWrapperSize,
  type MediaWrapperProps,
} from './MediaWrapper.types';
import {
  MEDIA_WRAPPER_LARGE_DARK_OVERLAY_STOP,
  MEDIA_WRAPPER_SCRIM_HEIGHT,
} from './private/MediaWrapperMetrics';
import styles from './MediaWrapper.module.css';

export {
  MediaWrapperPosition,
  MediaWrapperSize,
} from './MediaWrapper.types';
export type { MediaWrapperProps } from './MediaWrapper.types';

const DEFAULT_STYLE: CSSProperties = {};

function getScrimClassName(
  size: MediaWrapperSize,
  position: MediaWrapperPosition,
): string {
  const sizeClass = size === MediaWrapperSize.SMALL ? styles.small : styles.large;
  const gradientClass =
    position === MediaWrapperPosition.TOP
      ? (size === MediaWrapperSize.SMALL ? styles.topSmall : styles.topLarge)
      : (size === MediaWrapperSize.SMALL ? styles.bottomSmall : styles.bottomLarge);

  return [
    styles.scrim,
    sizeClass,
    gradientClass,
  ].filter(Boolean).join(' ');
}

export const MediaWrapper = memo(forwardRef<HTMLDivElement, MediaWrapperProps>(
  function MediaWrapper(
    {
      children,
      className = '',
      position = MediaWrapperPosition.BOTTOM,
      size = MediaWrapperSize.LARGE,
      style = DEFAULT_STYLE,
      ...rest
    },
    ref,
  ): ReactElement {
    const rootClassName = useMemo(
      () => [
        styles.root,
        className,
      ].filter(Boolean).join(' '),
      [className],
    );
    const scrimClassName = useMemo(
      () => getScrimClassName(size, position),
      [position, size],
    );
    // Drive the scrim height + large dark-overlay gradient stop from the metric
    // constants (CSS reads these vars) so the values live in one place instead of
    // being duplicated as CSS literals.
    const scrimStyle = useMemo<CSSProperties>(
      () => ({
        ['--media-wrapper-scrim-height' as string]: `${
          size === MediaWrapperSize.SMALL
            ? MEDIA_WRAPPER_SCRIM_HEIGHT.small
            : MEDIA_WRAPPER_SCRIM_HEIGHT.large
        }px`,
        ['--media-wrapper-dark-stop' as string]: `${MEDIA_WRAPPER_LARGE_DARK_OVERLAY_STOP}%`,
      }),
      [size],
    );
    const content = (
      <div className={styles.contentSlot}>
        {children}
      </div>
    );
    const scrim = (
      <div className={scrimClassName} style={scrimStyle} aria-hidden="true" />
    );

    return (
      <div
        ref={ref}
        className={rootClassName}
        style={style}
        {...rest}
      >
        {position === MediaWrapperPosition.TOP ? content : scrim}
        {position === MediaWrapperPosition.TOP ? scrim : content}
      </div>
    );
  },
));
