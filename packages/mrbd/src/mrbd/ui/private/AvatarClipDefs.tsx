/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { memo } from 'react';
import styles from '../Avatar.module.css';

export interface AvatarClipDefsProps {
  duoPrimaryMaskId: string;
  duoSecondaryMaskId: string;
  dimension: number;
  showBadge: boolean;
  badgeCutoutCx: number;
  badgeCutoutCy: number;
  badgeCutoutR: number;
  isDuo: boolean;
  primaryCx: number;
  primaryCy: number;
  secondaryCx: number;
  secondaryCy: number;
  duoR: number;
  duoSecondaryCutoutR: number;
}

export const AvatarClipDefs = memo(function AvatarClipDefs({
  duoPrimaryMaskId,
  duoSecondaryMaskId,
  dimension,
  showBadge,
  badgeCutoutCx,
  badgeCutoutCy,
  badgeCutoutR,
  isDuo,
  primaryCx,
  primaryCy,
  secondaryCx,
  secondaryCy,
  duoR,
  duoSecondaryCutoutR,
}: AvatarClipDefsProps) {
  const maskInset = badgeCutoutR;
  const maskSize = dimension + maskInset * 2;

  return (
    <svg
      className={styles.clipSvg}
      width={dimension}
      height={dimension}
      viewBox={`0 0 ${dimension} ${dimension}`}
      aria-hidden="true"
    >
      <defs>
        {isDuo && (
          <>
            <mask
              id={duoPrimaryMaskId}
              maskUnits="userSpaceOnUse"
              maskContentUnits="userSpaceOnUse"
              x={-maskInset}
              y={-maskInset}
              width={maskSize}
              height={maskSize}
            >
              <rect
                x={-maskInset}
                y={-maskInset}
                width={maskSize}
                height={maskSize}
                fill="black"
              />
              <circle cx={primaryCx} cy={primaryCy} r={duoR} fill="white" />
              {showBadge && (
                <circle
                  cx={badgeCutoutCx}
                  cy={badgeCutoutCy}
                  r={badgeCutoutR}
                  fill="black"
                />
              )}
            </mask>

            <mask
              id={duoSecondaryMaskId}
              maskUnits="userSpaceOnUse"
              maskContentUnits="userSpaceOnUse"
              x={-maskInset}
              y={-maskInset}
              width={maskSize}
              height={maskSize}
            >
              <rect
                x={-maskInset}
                y={-maskInset}
                width={maskSize}
                height={maskSize}
                fill="black"
              />
              <circle cx={secondaryCx} cy={secondaryCy} r={duoR} fill="white" />
              <circle
                cx={primaryCx}
                cy={primaryCy}
                r={duoSecondaryCutoutR}
                fill="black"
              />
              {showBadge && (
                <circle
                  cx={badgeCutoutCx}
                  cy={badgeCutoutCy}
                  r={badgeCutoutR}
                  fill="black"
                />
              )}
            </mask>
          </>
        )}
      </defs>
    </svg>
  );
});
