/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/*
 * Copyright 2022 The Android Open Source Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*
 * Modifications: Meta Platforms, Inc. adapted the relevant AndroidX
 * graphics-shapes data types for TypeScript interfaces and numeric tuples.
 * The modifications are licensed under the Apache License, Version 2.0. See
 * LICENSE, NOTICE, and UPSTREAM.md in this package.
 */

export interface AndroidXCornerRounding {
  radius: number;
  smoothing: number;
}

export interface AndroidXRoundedPolygonVertex {
  x: number;
  y: number;
  rounding: AndroidXCornerRounding;
}

export interface AndroidXPoint {
  x: number;
  y: number;
}

export interface AndroidXCubic {
  points: [number, number, number, number, number, number, number, number];
}
