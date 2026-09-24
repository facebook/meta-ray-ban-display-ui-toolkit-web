/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * TextSwitcher component
 */

import {
  forwardRef,
  memo,
  useMemo,
  type CSSProperties,
} from 'react';
import { StaticContainerInternal } from './private/StaticContainerInternal';
import { PrivateBackgroundStyle } from './private/StaticContainerBackgroundStyle';
import {
  TEXT_SWITCHER_DEFAULT_DURATION_MS,
  TEXT_SWITCHER_DEFAULT_TIMING_FUNCTION,
} from './private/TextSwitcherMetrics';
import type { TextSwitcherProps } from './TextSwitcher.types';
import { useTextSwitcher } from './private/useTextSwitcher';
import { MaterialLibrary } from '../material/MaterialLibrary';
import {
  CornerRadius,
  RoundedRectangleShapeProvider,
} from '../material/ShapeProvider';
import { TextAppearance } from '../theme/TextAppearance';
import styles from './TextSwitcher.module.css';

export type { TextSwitcherProps } from './TextSwitcher.types';

const DEFAULT_STYLE: CSSProperties = {};
const DEFAULT_TEXT_SWITCHER_SHAPE_PROVIDER =
  new RoundedRectangleShapeProvider(CornerRadius.LARGE);

/**
 * TextSwitcher component
 * Provides crossfade text transitions within a StaticContainer.
 */
export const TextSwitcher = memo(forwardRef<HTMLDivElement, TextSwitcherProps>(
  function TextSwitcher(
    {
      text,
      duration = TEXT_SWITCHER_DEFAULT_DURATION_MS,
      noAnimationFirstView = false,
      animated = true,
      style = DEFAULT_STYLE,
      className = '',
      material: materialProp,
      ...staticContainerProps
    },
    ref,
  ) {
    const {
      displayedText,
      containerOpacity,
    } = useTextSwitcher({
      text,
      duration,
      noAnimationFirstView,
      animated,
    });

    const material = useMemo(
      () => materialProp ?? MaterialLibrary.defaultStatic(),
      [materialProp],
    );

    const containerStyle = useMemo<CSSProperties>(
      () => ({
        opacity: containerOpacity,
        transition: animated
          ? `opacity ${duration}ms ${TEXT_SWITCHER_DEFAULT_TIMING_FUNCTION}`
          : 'none',
        ...style,
      }),
      [animated, containerOpacity, duration, style],
    );
    const rootClassName = useMemo(
      () => `${styles.textSwitcher} ${className}`,
      [className],
    );
    const textClassName = useMemo(
      () => `${styles.textView} ${TextAppearance.BODY2}`,
      [],
    );

    // Only drive the polite live-region announcement when the consumer has not
    // supplied an accessible name — otherwise a caller-set aria-label and the live
    // region would compete for the announcement.
    const consumerAriaLabel = staticContainerProps['aria-label'];
    const liveRegionProps =
      consumerAriaLabel == null || consumerAriaLabel === ''
        ? ({ 'aria-live': 'polite', 'aria-atomic': 'true' } as const)
        : {};

    return (
      <StaticContainerInternal
        ref={ref}
        className={rootClassName}
        style={containerStyle}
        material={material}
        _privateBackgroundStyle={PrivateBackgroundStyle.ALWAYS_VISIBLE}
        {...liveRegionProps}
        {...staticContainerProps}
        shapeProvider={
          staticContainerProps.shapeProvider ?? DEFAULT_TEXT_SWITCHER_SHAPE_PROVIDER
        }
      >
        <span className={textClassName}>
          {displayedText}
        </span>
      </StaticContainerInternal>
    );
  },
));
