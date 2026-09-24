/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import {
  Vignette,
  VignetteEdge,
} from '@wearables-ui-toolkit/foundation/components/Vignette';
import {
  VIGNETTE_FADE_DURATION_MS,
  VIGNETTE_SCRIM_SIZE,
} from '@wearables-ui-toolkit/foundation/components/private/VignetteMetrics';

describe('Vignette', () => {
  it('uses medium Scrim size and fade duration', () => {
    expect(VIGNETTE_SCRIM_SIZE).toBe(64);
    expect(VIGNETTE_FADE_DURATION_MS).toBe(200);
  });

  it('renders all four edge scrims by default', () => {
    const { container } = render(<Vignette animate={false} />);
    const scrims = container.querySelectorAll('[class*="scrim"]');

    expect(scrims).toHaveLength(4);
    expect((scrims[0] as HTMLElement).className).toContain('top');
    expect((scrims[1] as HTMLElement).className).toContain('bottom');
    expect((scrims[2] as HTMLElement).className).toContain('left');
    expect((scrims[3] as HTMLElement).className).toContain('right');
  });

  it('marks disabled edges hidden without removing their scrim nodes', () => {
    const { container } = render(
      <Vignette
        animate={false}
        enabledEdges={{
          [VignetteEdge.TOP]: false,
          [VignetteEdge.BOTTOM]: true,
          [VignetteEdge.LEFT]: false,
          [VignetteEdge.RIGHT]: true,
        }}
      />,
    );
    const scrims = Array.from(container.querySelectorAll<HTMLElement>('[class*="scrim"]'));

    expect(scrims).toHaveLength(4);
    expect(scrims[0].className).toContain('hidden');
    expect(scrims[1].className).not.toContain('hidden');
    expect(scrims[2].className).toContain('hidden');
    expect(scrims[3].className).not.toContain('hidden');
  });

  it('supports per-edge animation overrides', () => {
    const { container } = render(
      <Vignette
        animate={false}
        animatedEdges={{
          [VignetteEdge.TOP]: true,
          [VignetteEdge.RIGHT]: true,
        }}
      />,
    );
    const scrims = Array.from(container.querySelectorAll<HTMLElement>('[class*="scrim"]'));

    expect(scrims[0].className).toContain('animate');
    expect(scrims[1].className).not.toContain('animate');
    expect(scrims[2].className).not.toContain('animate');
    expect(scrims[3].className).toContain('animate');
  });

  it('can disable individual edges while animation defaults on', () => {
    const { container } = render(
      <Vignette
        animatedEdges={{
          [VignetteEdge.TOP]: false,
          [VignetteEdge.RIGHT]: false,
        }}
      />,
    );
    const scrims = Array.from(container.querySelectorAll<HTMLElement>('[class*="scrim"]'));

    expect(scrims[0].className).not.toContain('animate');
    expect(scrims[1].className).toContain('animate');
    expect(scrims[2].className).toContain('animate');
    expect(scrims[3].className).not.toContain('animate');
  });
});
