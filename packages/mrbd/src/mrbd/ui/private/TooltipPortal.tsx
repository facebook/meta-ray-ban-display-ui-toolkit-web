/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createPortal } from 'react-dom';
import {
  memo,
  useMemo,
  type RefObject,
} from 'react';
import type { TooltipBoundaryRect } from '@wearables-ui-toolkit/foundation/base/TooltipPositioning';
import { useFloatingPortalRoot } from '@wearables-ui-toolkit/foundation/portal/FloatingPortalRoot';
import { TooltipContainer } from '../TooltipContainer';
import {
  getTooltipOverlayStyle,
  getTooltipPortalStyle,
} from './TooltipLayout';
import type { TooltipShowOptions } from '../Tooltip.types';
import styles from '../Tooltip.module.css';

export interface TooltipPortalProps {
  tooltipRef: RefObject<HTMLDivElement | null>;
  clipBoundary: TooltipBoundaryRect;
  position: { top: number; left: number };
  isDismissing: boolean;
  options: TooltipShowOptions;
  isPositioned?: boolean;
  accessibleLabel?: string;
  tailDirection?: 'up' | 'down';
  tailCenterX?: number;
}

export const TooltipPortal = memo(function TooltipPortal({
  tooltipRef,
  clipBoundary,
  position,
  isDismissing,
  options,
  isPositioned = true,
  accessibleLabel,
  tailDirection,
  tailCenterX,
}: TooltipPortalProps) {
  const portalRoot = useFloatingPortalRoot();
  const portalStyle = useMemo(
    () => getTooltipPortalStyle(clipBoundary, portalRoot),
    [clipBoundary, portalRoot],
  );
  const overlayClassName = useMemo(
    () => `${styles.tooltipOverlay} ${isDismissing ? styles.fadeOut : styles.fadeIn}`,
    [isDismissing],
  );
  const overlayStyle = useMemo(
    () => ({
      ...getTooltipOverlayStyle({
        position,
        boundary: clipBoundary,
        isFocusable: options.isFocusable,
      }),
      visibility: isPositioned ? 'visible' as const : 'hidden' as const,
    }),
    [position, clipBoundary, options.isFocusable, isPositioned],
  );
  if (portalRoot == null) {
    return null;
  }

  return createPortal(
    <div style={portalStyle}>
      <div
        ref={tooltipRef}
        className={overlayClassName}
        style={overlayStyle}
        role="tooltip"
        aria-label={accessibleLabel}
        aria-live="polite"
      >
        {options.content ?? (
          <TooltipContainer
            text={options.text}
            metadata={options.metadata}
            icon={options.icon}
            trailingIcon={options.trailingIcon}
            showTooltipTail={options.showTooltipTail ?? true}
            tailDirection={tailDirection}
            tailCenterX={tailCenterX}
          />
        )}
      </div>
    </div>,
    portalRoot,
  );
});
