/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { memo } from 'react';
import { createPortal } from 'react-dom';
import { useFloatingPortalRoot } from '../portal/FloatingPortalRoot';
import { TooltipPopup } from './TooltipPopup';
import type { TooltipPopupProps } from './TooltipPopup.types';

interface InteractableTooltipPortalProps extends TooltipPopupProps {
  isMounted: boolean;
}

/**
 * Portal-backed tooltip overlay for InteractableBase-derived components.
 */
export const InteractableTooltipPortal = memo(function InteractableTooltipPortal({
  isMounted,
  ...tooltipProps
}: InteractableTooltipPortalProps) {
  const portalRoot = useFloatingPortalRoot();

  if (
    !isMounted ||
    (tooltipProps.text == null && tooltipProps.content == null) ||
    portalRoot == null
  ) {
    return null;
  }

  return createPortal(
    <TooltipPopup {...tooltipProps} />,
    portalRoot,
  );
});
