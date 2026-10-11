/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { CHECKLISTS } from '../../../checklist';

export const dynamicParams = false;

export function generateStaticParams() {
  return CHECKLISTS.map(list => ({ listId: list.id }));
}

// The root layout renders every screen; see layout.tsx.
export default function ListRoute() {
  return null;
}
