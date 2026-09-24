/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { TextAppearance } from './TextAppearance';

export type TextAppearanceKey = keyof typeof TextAppearance;
export type TextAppearanceValue = typeof TextAppearance[TextAppearanceKey];
