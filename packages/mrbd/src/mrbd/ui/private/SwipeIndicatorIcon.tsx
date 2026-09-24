/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { memo } from 'react';
/**
 * Chevron Up SVG icon (shallow filled caret).
 * Points upward by default; rotated by SwipeIndicator for DOWN direction.
 */
export interface SwipeIndicatorCaretIconProps {
  className?: string;
}

export const SwipeIndicatorCaretIcon = memo(function SwipeIndicatorCaretIcon({
  className,
}: SwipeIndicatorCaretIconProps) {
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M11.393 7.382c0.451-0.2 0.976-0.165 1.402 0.1l9.441 5.901 0.101 0.07c0.48 0.373 0.61 1.057 0.28 1.583-0.351 0.562-1.091 0.732-1.653 0.381L12 9.814l-8.964 5.603c-0.561 0.351-1.302 0.181-1.653-0.381s-0.181-1.302 0.381-1.653l9.442-5.901 0.187-0.1z"
        fill="currentColor"
      />
    </svg>
  );
});
