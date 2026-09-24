/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Panel component
 *
 * A non-focusable, non-clickable Container variant.
 * Uses panel-specific material (the default panel material).
 * Content scale is always 1 (no scale animation on state change).
 *
 * Used for non-interactive content areas.
 *
 * Key differences from Container:
 * - focusable=false, pressable=false, clickable=false
 * - No click handler
 * - contentScaleForState always returns 1 (no press/focus scaling)
 * - Panel-specific material with reduced opacity per state
 *
 * Panel extends Container, sets it non-clickable and non-focusable, and uses
 * the default panel material.
 */

import { forwardRef, memo } from 'react';
import type { PanelProps } from './Panel.types';
import { PanelInternal } from './private/PanelInternal';

export type { PanelProps } from './Panel.types';

// ============================================================================
// Component
// ============================================================================

/**
 * Panel component
 * Non-interactive container for content areas.
 *
 * Usage:
 * ```tsx
 * <Panel width={400} height={300}>
 *   <p>Panel content goes here</p>
 * </Panel>
 * ```
 */
export const Panel = memo(forwardRef<HTMLDivElement, PanelProps>(
  function Panel({ children, ...panelProps }, ref) {
    return (
      <PanelInternal
        {...panelProps}
        ref={ref}
      >
        {children}
      </PanelInternal>
    );
  },
));
