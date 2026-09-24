/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Toast component for Meta Ray-Ban Display
 *
 * Singleton notification popup utility.
 * API: Toast.show(message, metadata?, icon?, style?), Toast.cancel(token)
 * Shows at top of screen, auto-dismisses after timeout.
 * Queues multiple toasts with delay between them.
 *
 * Structure:
 *   - Toast object is a singleton with a queue (toastQueue: list of ToastData)
 *   - Shows via a wrapper around a frame > Chip
 *   - Chip style is always `ChipStyle.ELEVATED`
 *   - frame has gradient background (colorBackgroundWindow -> colorBackgroundFlat)
 *   - frame padding: 24px (--uit-spacing-large) top+bottom
 *   - Aligned: top, fills horizontal width, Chip centered horizontally
 *   - Display duration: 3500ms
 *   - Queue delay: TOAST_QUEUE_DELAY_MS = 700ms
 *
 * Exported as static methods + a ToastContainer React component
 * that must be rendered once in your app tree.
 */

import {
  memo,
  type CSSProperties,
} from 'react';
import {
  cancelAllManagedToasts,
  cancelManagedToast,
  showManagedToast,
} from './private/ToastManager';
import { useToastPresentation } from './private/ToastHooks';
import { ToastContainerFrame } from './private/ToastContainerFrame';
import { ToastStyle } from './Toast.types';
import type {
  ToastContainerProps,
  ToastData,
  ToastIdentifier,
} from './Toast.types';
import type { IconSource } from '@wearables-ui-toolkit/foundation/components/IconImage';

export { ToastStyle } from './Toast.types';
export type { ToastContainerProps, ToastIdentifier } from './Toast.types';

// ============================================================================
// Public API
// ============================================================================

/**
 * Toast utility object.
 * A singleton that manages the toast queue and presentation.
 */
export const Toast = {
  /**
   * Shows a toast with the given message and style.
   * Toasts queue if multiple are presented back to back.
   *
   * @param message - The message to show in the toast
   * @param metadata - Optional secondary text
   * @param icon - Optional icon source
   * @param style - The visual style (default: STANDARD)
   * @returns A token that can be used to cancel the toast
   */
  show(
    message: string,
    metadata?: string,
    icon?: IconSource,
    style: ToastStyle = ToastStyle.STANDARD,
  ): ToastIdentifier {
    return showManagedToast(message, metadata, icon, style);
  },

  /**
   * Cancels a toast with the given token.
   * If currently showing, it is hidden immediately.
   * If queued, it is removed from the queue.
   *
   * @param token - The token of the toast to cancel
   */
  cancel(token: ToastIdentifier): void {
    cancelManagedToast(token);
  },

  /**
   * Cancels all queued toasts.
   */
  cancelAll(): void {
    cancelAllManagedToasts();
  },
};

export function useToast(): ToastData | null {
  return useToastPresentation().toast;
}

// ============================================================================
// ToastContainer component
// ============================================================================

const DEFAULT_STYLE: CSSProperties = {};

/**
 * ToastContainer renders the currently visible toast.
 * Place this component ONCE at the root of your app.
 *
 * Structure:
 *   wrapper around:
 *     frame (full width x fits content)
 *       background: top-to-bottom gradient [colorBackgroundWindow, colorBackgroundFlat]
 *       padding: 0, 24px, 0, 24px (--uit-spacing-large horizontal)
 *       -> Chip (fits content, centered horizontally)
 *            text = toastData.message
 *            metadata = toastData.metadata
 *            icon = toastData.icon
 *            style = ChipStyle.ELEVATED
 *            hidden from accessibility / not screen-reader focusable
 */
export const ToastContainer = memo(function ToastContainer({
  className = '',
  style: containerStyle = DEFAULT_STYLE,
}: ToastContainerProps) {
  const { toast, visible } = useToastPresentation();

  return (
    <ToastContainerFrame
      toast={toast}
      visible={visible}
      className={className}
      style={containerStyle}
    />
  );
});
