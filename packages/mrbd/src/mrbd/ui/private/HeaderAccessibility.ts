/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { STATUS_INDICATOR_LABELS } from './AvatarMetrics';
import type { StatusIndicatorType } from '../Avatar.types';

export interface HeaderContentDescriptionOptions {
  ariaLabel?: string;
  text?: string;
  metadata?: string;
  statusIndicator?: StatusIndicatorType;
}

/**
 * Builds the accessible label for the Header API. A caller-supplied
 * `ariaLabel` seeds the description in place of text + metadata; the avatar's
 * status-indicator description is always appended when one is shown, so the
 * caller label still announces the status (e.g. "Alex profile, Active Status").
 */
export function getHeaderContentDescription({
  ariaLabel,
  text,
  metadata,
  statusIndicator,
}: HeaderContentDescriptionOptions): string | undefined {
  const parts: string[] = [];
  if (ariaLabel) {
    parts.push(ariaLabel);
  } else {
    if (text) {
      parts.push(text);
    }
    if (metadata) {
      parts.push(metadata);
    }
  }
  if (statusIndicator != null) {
    parts.push(STATUS_INDICATOR_LABELS[statusIndicator]);
  }

  return parts.length > 0 ? parts.join(', ') : undefined;
}
