/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Toast public and manager data types.
 */

import type { CSSProperties } from 'react';
import type { IconSource } from '@wearables-ui-toolkit/foundation/components/IconImage';

/** Token returned from show() to cancel a specific toast */
export type ToastIdentifier = number;

/**
 * Toast visual style.
 * Only STANDARD is exposed and uses the elevated chip treatment.
 */
export const ToastStyle = {
  /** Standard style with an elevated background. */
  STANDARD: 'standard',
} as const;
export type ToastStyle = (typeof ToastStyle)[keyof typeof ToastStyle];

/** Data for a queued toast */
export interface ToastData {
  message: string;
  metadata?: string;
  icon?: IconSource;
  style: ToastStyle;
  token: ToastIdentifier;
}

export interface ToastPresentation {
  toast: ToastData | null;
  visible: boolean;
}

export interface ToastContainerProps {
  /** Additional CSS class for the container */
  className?: string;
  /** Additional inline styles */
  style?: CSSProperties;
}
