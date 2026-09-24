/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export type InvalidFocusDirection = 'up' | 'down' | 'left' | 'right';

export enum PartialFocusSupportedAxis {
  XY = 'xy',
  X = 'x',
  Y = 'y',
  None = 'none',
}

export interface InvalidFocusDirectionDetail {
  direction: InvalidFocusDirection;
}

export type PartialFocusHandoffPhase = 'incoming' | 'outgoing' | 'reset';

export interface PartialFocusHandoffRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
  x: number;
  y: number;
}

export interface PartialFocusHandoffDetail {
  phase: PartialFocusHandoffPhase;
  otherRect?: PartialFocusHandoffRect | null;
  animated?: boolean;
}

export interface FocusOwner {
  element: HTMLElement;
  initialFocusEligible: boolean;
  partialFocusSupportedAxis: PartialFocusSupportedAxis;
  isRubberbandTranslationEnabled: boolean;
  applyFocus: (forceNotify?: boolean) => void;
  clearFocus: () => void;
}
