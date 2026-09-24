/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  memo,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { getCachedSmoothRoundedRectPath } from '@wearables-ui-toolkit/foundation/utils/SmoothCorners';
import { MODAL_BANNER_CORNER_RADIUS } from './ModalMetrics';
import styles from '../Modal.module.css';

export interface ModalBannerImageProps {
  src: string;
  alt: string;
}

export interface ModalBannerImageDimensions {
  width: number;
  height: number;
}

export const ModalBannerImage = memo(function ModalBannerImage({ src, alt }: ModalBannerImageProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const reactId = useId();
  const clipPathId = useMemo(
    () => `modal-banner-clip-${reactId.replace(/:/g, '')}`,
    [reactId],
  );
  const [dimensions, setDimensions] = useState<ModalBannerImageDimensions | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return;
    }

    const updateDimensions = () => {
      const rect = root.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setDimensions((previous) =>
          previous?.width === rect.width && previous?.height === rect.height
            ? previous
            : { width: rect.width, height: rect.height },
        );
      }
    };

    const observer = new ResizeObserver(updateDimensions);
    observer.observe(root);
    updateDimensions();

    return () => observer.disconnect();
  }, []);

  const clipPath = useMemo(
    () =>
      dimensions != null
        ? getCachedSmoothRoundedRectPath({
            width: dimensions.width,
            height: dimensions.height,
            cornerRadius: MODAL_BANNER_CORNER_RADIUS,
          })
        : null,
    [dimensions],
  );

  return (
    <div ref={rootRef} className={styles.bannerImageFrame}>
      {dimensions != null && clipPath != null ? (
        <svg
          className={styles.bannerImageSvg}
          viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <clipPath id={clipPathId} clipPathUnits="userSpaceOnUse">
              <path d={clipPath} />
            </clipPath>
          </defs>
          <image
            href={src}
            x="0"
            y="0"
            width={dimensions.width}
            height={dimensions.height}
            preserveAspectRatio="xMidYMid slice"
            clipPath={`url(#${clipPathId})`}
          />
        </svg>
      ) : (
        <img src={src} alt={alt} className={styles.bannerImageFallback} />
      )}
    </div>
  );
});
