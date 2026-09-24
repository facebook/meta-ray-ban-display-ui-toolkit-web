/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export type AdjustableSetting = 'brightness' | 'volume';
export type ListPage = 'notifications' | 'settings';
export type LauncherPage = AdjustableSetting | ListPage;
export type RailFocusTarget = AdjustableSetting | ListPage;
