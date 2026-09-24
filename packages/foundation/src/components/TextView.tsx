/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * TextView component
 */

import {
  forwardRef,
  memo,
  useMemo,
  type CSSProperties,
  type Ref,
} from 'react';
import {
  getTextColorValue,
  getTextStyleClass,
} from './private/TextViewStyles';
import {
  TextColor,
  TextStyle,
  type TextViewProps,
} from './TextView.types';
import styles from './TextView.module.css';

export {
  TextColor,
  TextStyle,
} from './TextView.types';
export type { TextViewProps } from './TextView.types';

const DEFAULT_STYLE: CSSProperties = {};
const SECONDARY_TEXT_CLASS_NAME = 'uit-color-text-secondary';

/**
 * TextView component
 * Theme-resolved text with consistent typography.
 */
export const TextView = memo(forwardRef<HTMLSpanElement, TextViewProps>(
  function TextView(
    {
      children,
      textStyle = TextStyle.BODY1,
      textColor = TextColor.PRIMARY,
      as: Component = 'span',
      className = '',
      style = DEFAULT_STYLE,
      ...htmlProps
    },
    ref,
  ) {
    const combinedStyle = useMemo<CSSProperties>(
      () => ({
        color: getTextColorValue(textColor),
        ...style,
      }),
      [textColor, style],
    );
    const textViewClassName = useMemo(
      () => `${styles.textView} ${
        textColor === TextColor.SECONDARY ? SECONDARY_TEXT_CLASS_NAME : ''
      } ${getTextStyleClass(textStyle)} ${className}`,
      [textColor, textStyle, className],
    );

    return (
      <Component
        ref={ref as Ref<never>}
        className={textViewClassName}
        style={combinedStyle}
        {...htmlProps}
      >
        {children}
      </Component>
    );
  },
));
