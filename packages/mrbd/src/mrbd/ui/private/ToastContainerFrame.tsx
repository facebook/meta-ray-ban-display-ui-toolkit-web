/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  memo,
  useMemo,
  type CSSProperties,
} from 'react';
import { createPortal } from 'react-dom';
import { useFloatingPortalRoot } from '@wearables-ui-toolkit/foundation/portal/FloatingPortalRoot';
import { Chip, ChipStyle } from '../Chip';
import type { ToastContainerProps, ToastData } from '../Toast.types';
import styles from '../Toast.module.css';

interface ToastContainerFrameProps extends ToastContainerProps {
  toast: ToastData | null;
  visible: boolean;
}

const DEFAULT_STYLE: CSSProperties = {};

/**
 * Toast frame: a full-width top frame with an elevated Chip centered inside it.
 */
export const ToastContainerFrame = memo(function ToastContainerFrame({
  toast,
  visible,
  className = '',
  style: containerStyle = DEFAULT_STYLE,
}: ToastContainerFrameProps) {
  const portalRoot = useFloatingPortalRoot();
  const rootClassName = useMemo(
    () => `${styles.toastContainer} ${className}`,
    [className],
  );
  const rootStyle = useMemo(
    () => ({
      ...containerStyle,
      position:
        typeof document !== 'undefined' && portalRoot === document.body
          ? 'fixed'
          : 'absolute',
      zIndex: 70000,
    }) as CSSProperties,
    [containerStyle, portalRoot],
  );
  const wrapperClassName = useMemo(
    () => `${styles.toastWrapper} ${visible ? styles.toastVisible : styles.toastHidden}`,
    [visible],
  );

  if (!toast) {
    return null;
  }

  const frame = (
    <div
      className={rootClassName}
      style={rootStyle}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div
        className={wrapperClassName}
      >
        <Chip
          text={toast.message}
          metadata={toast.metadata}
          icon={toast.icon}
          chipStyle={ChipStyle.ELEVATED}
        />
      </div>
    </div>
  );

  if (portalRoot == null) {
    return null;
  }

  return createPortal(
    frame,
    portalRoot,
  );
});
