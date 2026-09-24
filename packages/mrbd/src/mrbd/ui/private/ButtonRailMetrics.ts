/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Fading edge length (medium) for 'mrbd': 64px. Drives both the gradient
 * overlay width (`--fading-edge-length`) and the scroll-to-focused inset math.
 */
export const BUTTON_RAIL_FADING_EDGE_LENGTH = 64;

/**
 * Scroll spring parameters: stiffness 150, damping 20, mass 0.5, fast settle.
 */
export const BUTTON_RAIL_SCROLL_SPRING_STIFFNESS = 150;
export const BUTTON_RAIL_SCROLL_SPRING_DAMPING = 20;
export const BUTTON_RAIL_SCROLL_SPRING_MASS = 0.5;
export const BUTTON_RAIL_SCROLL_SPRING_FRAME_MS = 1000 / 60;
export const BUTTON_RAIL_SCROLL_SPRING_VELOCITY_THRESHOLD = 0.05;
export const BUTTON_RAIL_SCROLL_SPRING_POSITION_THRESHOLD = 0.02;
