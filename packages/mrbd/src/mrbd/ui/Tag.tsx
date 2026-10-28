/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Tag component for Meta Ray-Ban Display
 *
 * A lightweight text label component. Renders a StaticContainer with
 * mix-blend-mode: screen applied, containing a single text element.
 *
 * Extends StaticContainer (non-interactive, no focus/press states).
 */

import {
  forwardRef,
  memo,
  useMemo,
} from 'react';
import type { ContainerContentStyle } from '@wearables-ui-toolkit/foundation';
import { StaticContainer } from '@wearables-ui-toolkit/foundation';
import {
  getTagClassName,
  getTagStyle,
  shouldRenderTagText,
} from './private/TagLayout';
import type { TagProps } from './Tag.types';
import styles from './Tag.module.css';

export type { TagProps } from './Tag.types';

const EMPTY_TAG_STYLE: ContainerContentStyle = {};

// ============================================================================
// Component
// ============================================================================

/**
 * Tag component
 * Lightweight text label with material background and screen blend mode.
 *
 * Usage:
 * ```tsx
 * <Tag text="Label" />
 * ```
 */
export const Tag = memo(forwardRef<HTMLDivElement, TagProps>(
  function Tag(
    {
      text,
      material: materialProp,
      className = '',
      style,
      contentStyle = EMPTY_TAG_STYLE,
      ...staticContainerProps
    },
    ref
  ) {
    const tagStyle = useMemo(
      () => getTagStyle(contentStyle),
      [contentStyle],
    );
    const tagClassName = useMemo(
      () => getTagClassName(styles.tag, className),
      [className],
    );
    const hasText = shouldRenderTagText(text);

    return (
      <StaticContainer
        ref={ref}
        material={materialProp}
        className={tagClassName}
        style={style}
        contentStyle={tagStyle}
        {...staticContainerProps}
      >
        {hasText && (
          <span className={styles.tagText}>
            {text}
          </span>
        )}
      </StaticContainer>
    );
  }
));
