/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { render } from '@testing-library/react';
import { vi } from 'vitest';
import {
  AppMaterialProvider,
  ThemedButton,
} from './AppMaterialTheme';
import { createNeonMaterial } from './NeonMaterial';

describe('AppMaterialProvider', () => {
  it('creates an independent material for every themed control', () => {
    const createMaterial = vi.fn(createNeonMaterial);

    const { rerender } = render(
      <AppMaterialProvider createMaterial={createMaterial}>
        <ThemedButton title="First" />
        <ThemedButton title="Second" />
      </AppMaterialProvider>,
    );

    expect(createMaterial).toHaveBeenCalledTimes(2);

    rerender(
      <AppMaterialProvider createMaterial={createMaterial}>
        <ThemedButton title="First" />
        <ThemedButton title="Second" />
      </AppMaterialProvider>,
    );

    expect(createMaterial).toHaveBeenCalledTimes(2);
  });
});
