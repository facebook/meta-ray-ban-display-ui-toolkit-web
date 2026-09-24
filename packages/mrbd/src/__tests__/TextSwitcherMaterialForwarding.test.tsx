/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TextSwitcher } from '@wearables-ui-toolkit/foundation/components/TextSwitcher';
import {
  CornerRadius,
  RoundedRectangleShapeProvider,
} from '@wearables-ui-toolkit/foundation/material/ShapeProvider';

const { staticContainerSpy } = vi.hoisted(() => ({
  staticContainerSpy: vi.fn(),
}));

// vi.mock is hoisted above the imports, so TextSwitcher binds to this spied
// implementation component and we can inspect the material it is handed.
vi.mock('@wearables-ui-toolkit/foundation/components/private/StaticContainerInternal', async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import('@wearables-ui-toolkit/foundation/components/private/StaticContainerInternal')
    >();
  return {
    ...actual,
    StaticContainerInternal: (props: Record<string, unknown>) => {
      staticContainerSpy(props);
      return null;
    },
  };
});

describe('TextSwitcher shape provider forwarding', () => {
  it('forwards a caller-supplied shape provider', () => {
    staticContainerSpy.mockClear();
    const shapeProvider = new RoundedRectangleShapeProvider(CornerRadius.SMALL);
    render(
      <TextSwitcher
        text="First"
        shapeProvider={shapeProvider}
      />,
    );

    expect(staticContainerSpy.mock.calls[0]?.[0]?.shapeProvider).toBe(
      shapeProvider,
    );
  });

  it('uses a LARGE rounded rectangle by default', () => {
    staticContainerSpy.mockClear();
    render(<TextSwitcher text="First" />);

    const forwarded = staticContainerSpy.mock.calls[0]?.[0]
      ?.shapeProvider as RoundedRectangleShapeProvider;
    expect(forwarded.cornerRadius).toBe(CornerRadius.LARGE);
  });
});
