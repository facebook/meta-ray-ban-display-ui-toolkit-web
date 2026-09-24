/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export interface AvatarBadgeMetrics {
  badgeSize: number;
  badgeInset: number;
  cutoutCx: number;
  cutoutCy: number;
  cutoutR: number;
}

export interface AvatarDuoMetrics {
  duoSize: number;
  duoMargin: number;
  duoCutoutMargin: number;
  duoR: number;
  primaryCx: number;
  primaryCy: number;
  secondaryCx: number;
  secondaryCy: number;
  secondaryCutoutR: number;
}
