/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CSSProperties } from 'react';
import {
  TAG_HORIZONTAL_PADDING,
  TAG_VERTICAL_PADDING,
} from './TagMetrics';

export function getTagClassName(
  baseClassName: string,
  className: string,
): string {
  return [baseClassName, className].filter(Boolean).join(' ');
}

export function getTagStyle(style: CSSProperties): CSSProperties {
  return {
    padding: `${TAG_VERTICAL_PADDING}px ${TAG_HORIZONTAL_PADDING}px`,
    ...style,
  };
}

export function shouldRenderTagText(text: string | undefined): text is string {
  return text != null && text.length > 0;
}
