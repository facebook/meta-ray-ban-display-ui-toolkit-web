/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { IconWithContainerMaterial } from '@wearables-ui-toolkit/foundation/components/IconWithContainerMaterial';
import { MaterialLibrary } from '@wearables-ui-toolkit/foundation/material/MaterialLibrary';
import {
  CornerRadius,
  RoundedRectangleShapeProvider,
} from '@wearables-ui-toolkit/foundation/material/ShapeProvider';

function TestIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 4h16v16H4z" />
    </svg>
  );
}

describe('IconWithContainerMaterial', () => {
  it('renders a non-focusable material-backed icon surface', () => {
    const { container } = render(
      <IconWithContainerMaterial icon={<TestIcon />} />,
    );

    const root = container.firstElementChild;
    const icon = container.querySelector('svg');

    expect(root).not.toHaveAttribute('tabindex');
    expect(root).not.toHaveAttribute('role');
    expect(icon).toBeInTheDocument();
  });

  it('defaults to the regular container material', () => {
    const defaultSpy = vi.spyOn(MaterialLibrary, 'default');

    render(
      <IconWithContainerMaterial icon={<TestIcon />} />,
    );

    expect(defaultSpy).toHaveBeenCalledTimes(1);

    defaultSpy.mockRestore();
  });

  it('forwards a custom shape provider to its container', () => {
    const { container } = render(
      <IconWithContainerMaterial
        icon={<TestIcon />}
        shapeProvider={
          new RoundedRectangleShapeProvider(CornerRadius.XXSMALL)
        }
      />,
    );

    expect(container.firstElementChild).toHaveStyle({ borderRadius: '8px' });
  });
});
