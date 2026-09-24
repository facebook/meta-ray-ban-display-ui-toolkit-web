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
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { StaticContainer } from '@wearables-ui-toolkit/foundation/components/StaticContainer';
import {
  createWebAppIconMaterial,
  isWebAppIconMaterialFallback,
  normalizeWebAppIconSource,
} from './WebAppIconMaterial';
import {
  cachePreloadedWebAppIconArtwork,
  getPreloadedWebAppIconArtwork,
  isRenderableWebAppIconArtwork,
} from './private/WebAppIconArtworkContainerMaterialLayer';
import type { WebAppIconProps } from './WebAppIcon.types';
import {
  WEB_APP_ICON_CONTAINER_SIZE,
} from './private/WebAppIconMetrics';
import styles from './WebAppIcon.module.css';

export type { WebAppIconProps } from './WebAppIcon.types';
export {
  createWebAppIconMaterial,
  type WebAppIconMaterialOptions,
  type WebAppIconMaterialRendering,
} from './WebAppIconMaterial';

interface IconResolution {
  requestKey: string;
  succeeded: boolean;
}

function boundedDimension(value: number | undefined): number {
  return Math.max(0, value ?? WEB_APP_ICON_CONTAINER_SIZE);
}

/**
 * Renders manifest-themed web-app artwork over its complete app-container material.
 */
export const WebAppIcon = memo(forwardRef<HTMLDivElement, WebAppIconProps>(
  function WebAppIcon(
    {
      iconSrc,
      themeColor,
      radialColors,
      radialStops,
      innerGlowColor,
      partialFocusLighting = true,
      visualState,
      width,
      height,
      onIconReady,
      className = '',
      style,
      role,
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledBy,
      'aria-describedby': ariaDescribedBy,
      'aria-hidden': ariaHidden,
      ...htmlProps
    },
    ref,
  ) {
    const normalizedIconSrc = useMemo(
      () => normalizeWebAppIconSource(iconSrc),
      [iconSrc],
    );
    const requestedIsFallback = useMemo(
      () => isWebAppIconMaterialFallback({
        iconSrc: normalizedIconSrc,
        themeColor,
        radialColors,
      }),
      [normalizedIconSrc, radialColors, themeColor],
    );
    const requestKey = useMemo(() => requestedIsFallback
      ? JSON.stringify(['fallback', partialFocusLighting])
      : JSON.stringify([
          normalizedIconSrc,
          themeColor,
          radialColors,
          radialStops,
          partialFocusLighting,
          innerGlowColor,
        ]), [
      innerGlowColor,
      normalizedIconSrc,
      partialFocusLighting,
      radialColors,
      radialStops,
      requestedIsFallback,
      themeColor,
    ]);
    const [resolution, setResolution] = useState<IconResolution | null>(null);
    const deliveredResolutionRef = useRef<IconResolution | null>(null);
    const onIconReadyRef = useRef(onIconReady);
    onIconReadyRef.current = onIconReady;

    useEffect(() => {
      if (requestedIsFallback || normalizedIconSrc == null) {
        return;
      }
      const preloadedImage = getPreloadedWebAppIconArtwork(normalizedIconSrc);
      if (preloadedImage != null) {
        // A cache hit still has to clear the bar the fresh-load path applies,
        // so undrawable artwork is never reported as resolved.
        setResolution({
          requestKey,
          succeeded: isRenderableWebAppIconArtwork(preloadedImage),
        });
        return;
      }
      if (typeof Image === 'undefined') {
        return;
      }
      let active = true;
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.onload = () => {
        if (!active) {
          return;
        }
        const succeeded = image.naturalWidth > 0 && image.naturalHeight > 0;
        if (succeeded) {
          cachePreloadedWebAppIconArtwork(normalizedIconSrc, image);
        }
        setResolution({ requestKey, succeeded });
      };
      image.onerror = () => {
        if (!active) {
          return;
        }
        setResolution({ requestKey, succeeded: false });
      };
      image.src = normalizedIconSrc;
      return () => {
        active = false;
        image.onload = null;
        image.onerror = null;
      };
    }, [normalizedIconSrc, requestKey, requestedIsFallback]);

    const resolvedIconSrc =
      resolution?.requestKey === requestKey && resolution.succeeded
        ? normalizedIconSrc
        : null;
    const rendering = useMemo(
      () => createWebAppIconMaterial({
        iconSrc: resolvedIconSrc,
        themeColor,
        radialColors,
        radialStops,
        innerGlowColor,
        partialFocusLighting,
      }),
      [
        innerGlowColor,
        partialFocusLighting,
        radialColors,
        radialStops,
        resolvedIconSrc,
        themeColor,
      ],
    );

    useEffect(() => {
      if (!requestedIsFallback && resolution?.requestKey !== requestKey) {
        return;
      }
      const succeeded =
        !requestedIsFallback &&
        resolution?.succeeded === true &&
        !rendering.isFallback;
      const delivered = deliveredResolutionRef.current;
      if (delivered?.requestKey === requestKey && delivered.succeeded === succeeded) {
        return;
      }
      deliveredResolutionRef.current = { requestKey, succeeded };
      onIconReadyRef.current?.(succeeded);
    }, [rendering.isFallback, requestKey, requestedIsFallback, resolution]);
    const targetWidth = boundedDimension(width);
    const targetHeight = boundedDimension(height);
    const presentationScale = Math.min(
      targetWidth / WEB_APP_ICON_CONTAINER_SIZE,
      targetHeight / WEB_APP_ICON_CONTAINER_SIZE,
    );
    const rootStyle = useMemo<CSSProperties>(() => ({
      ...style,
      width: targetWidth,
      height: targetHeight,
    }), [style, targetHeight, targetWidth]);
    const containerStyle = useMemo<CSSProperties>(() => ({
      left: (targetWidth - WEB_APP_ICON_CONTAINER_SIZE * presentationScale) / 2,
      top: (targetHeight - WEB_APP_ICON_CONTAINER_SIZE * presentationScale) / 2,
      transform: `scale(${presentationScale})`,
    }), [presentationScale, targetHeight, targetWidth]);
    const effectiveRole = role ?? (
      ariaLabel != null || ariaLabelledBy != null ? 'img' : undefined
    );
    const effectiveAriaHidden = ariaHidden ?? (
      effectiveRole == null &&
      ariaLabel == null &&
      ariaLabelledBy == null &&
      ariaDescribedBy == null
        ? true
        : undefined
    );

    return (
      <div
        {...htmlProps}
        ref={ref}
        className={`${styles.root} ${className}`}
        style={rootStyle}
        role={effectiveRole}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        aria-hidden={effectiveAriaHidden}
        data-web-app-icon-fallback={rendering.isFallback ? 'true' : 'false'}
      >
        <StaticContainer
          className={styles.container}
          style={containerStyle}
          width={WEB_APP_ICON_CONTAINER_SIZE}
          height={WEB_APP_ICON_CONTAINER_SIZE}
          material={rendering.material}
          shapeProvider={rendering.shapeProvider}
          visualState={visualState}
          clipContent={false}
        />
      </div>
    );
  },
));
