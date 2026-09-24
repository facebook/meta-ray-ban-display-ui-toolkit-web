/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
  ForwardedRef,
  MutableRefObject,
  RefObject,
} from 'react';
import type {
  InvalidFocusDirection,
  PartialFocusHandoffDetail,
  PartialFocusSupportedAxis,
} from './FocusCoordinator';

export interface UseInteractableFocusOwnerParams {
  forwardedRef: ForwardedRef<HTMLElement>;
  internalRef: RefObject<HTMLElement | null>;
  isFocusable: boolean;
  initialFocusEligible: boolean;
  currentDirectionalKeyDownRef: MutableRefObject<string | null>;
  applyFocusedFromCoordinator: (
    focused: boolean,
    recordFocusChange: boolean,
    forceNotify?: boolean,
  ) => void;
  clearFocusedOwner: () => void;
  partialFocusSupportedAxis: PartialFocusSupportedAxis;
  isRubberbandTranslationEnabled: boolean;
  onInvalidFocusDirection?: (direction: InvalidFocusDirection) => void;
  onPartialFocusHandoff?: (detail: PartialFocusHandoffDetail) => void;
}
