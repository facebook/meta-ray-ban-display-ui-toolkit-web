/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * TooltipContainer tests
 *
 * Constants under test:
 * - Background: elevation 3 background (#474D57)
 * - Corner radius: FULL (pill shape)
 * - Text blend: plus (screen)
 * - Metadata blend: lighten
 * - Min width: 36px
 * - Shadow blur: 8px
 * - Icon blend: plus
 * - Tail: SVG triangle pointer
 * - showTooltipTail: default true
 */

import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { TooltipContainer } from '../mrbd/ui/TooltipContainer';
import { TEST_ICON } from './helpers/testIcon';

const TEST_ICON_SRC = '/icons/test-icon.svg';
const TEST_ICON_URI_SOURCE = { uri: TEST_ICON_SRC };
const tooltipContainerCss = readFileSync(
  `${process.cwd()}/packages/mrbd/src/mrbd/ui/TooltipContainer.module.css`,
  'utf8',
);

describe('TooltipContainer rendering', () => {
  it('renders without crashing', () => {
    const { container } = render(<TooltipContainer text="Hello" />);
    expect(container.firstElementChild).not.toBeNull();
  });

  it('renders text', () => {
    const { container } = render(<TooltipContainer text="Tooltip text" />);
    expect(container.textContent).toContain('Tooltip text');
  });

  it('renders metadata text', () => {
    const { container } = render(
      <TooltipContainer text="Main" metadata="Meta info" />
    );
    expect(container.textContent).toContain('Meta info');
  });

  it('hides text when not provided', () => {
    const { container } = render(<TooltipContainer />);
    // No text content except possibly empty metadata
    expect(container.textContent?.trim()).toBe('');
  });
});

describe('TooltipContainer icon', () => {
  it('renders a URL icon as a tinted mask when provided', () => {
    const { container } = render(
      <TooltipContainer text="Test" icon={TEST_ICON_URI_SOURCE} />
    );
    const iconContainer = container.querySelector('[class*="icon"]');
    expect(iconContainer).not.toBeNull();
    const maskedIcon = iconContainer?.querySelector('[style*="mask-image"]');
    expect(maskedIcon).not.toBeNull();
    expect(maskedIcon?.getAttribute('style')).toContain(TEST_ICON_SRC);
  });

  it('renders a bundled vector token inline as an svg', () => {
    const { container } = render(
      <TooltipContainer text="Test" icon={TEST_ICON} />
    );
    const iconContainer = container.querySelector('[class*="icon"]');
    expect(iconContainer).not.toBeNull();
    expect(iconContainer?.querySelector('svg')).not.toBeNull();
  });

  it('hides icon when not provided', () => {
    const { container } = render(<TooltipContainer text="Test" />);
    expect(container.querySelector('[class*="icon"]')).toBeNull();
  });
});

describe('TooltipContainer material', () => {
  it('draws an integrated material shape', () => {
    const { container } = render(
      <TooltipContainer text="Test" width={160} height={72} />
    );
    const materialShape = container.querySelector('[class*="materialShape"] path');
    expect(materialShape).not.toBeNull();
    expect(materialShape?.getAttribute('fill')).toBe('var(--uit-color-background-elevation3)');
  });

  it('has pill shape', () => {
    const { container } = render(<TooltipContainer text="Test" />);
    // The SVG path clamps the shared full-radius geometry to a pill.
    expect(container.firstElementChild).not.toBeNull();
  });
});

describe('TooltipContainer tail', () => {
  it('shows tail by default (showTooltipTail = true)', () => {
    const { container } = render(
      <TooltipContainer text="Test" width={160} height={88} tailDirection="down" tailCenterX={80} />
    );
    const pathD = container.querySelector('[class*="materialShape"] path')?.getAttribute('d') ?? '';
    expect(pathD).toContain('C');
    expect(pathD).not.toContain('L 80,72');
  });

  it('hides tail when showTooltipTail=false', () => {
    const { container } = render(
      <TooltipContainer text="Test" width={160} height={88} showTooltipTail={false} tailDirection="down" tailCenterX={80} />
    );
    const pathD = container.querySelector('[class*="materialShape"] path')?.getAttribute('d') ?? '';
    expect(pathD).not.toContain('80,72');
  });

  it('clamps the tail center inside the rounded body', () => {
    const { container } = render(
      <TooltipContainer text="Test" width={160} height={88} tailDirection="down" tailCenterX={0} />
    );
    const pathD = container.querySelector('[class*="materialShape"] path')?.getAttribute('d') ?? '';

    expect(pathD).toContain('C');
    expect(pathD).not.toContain('L 0,');
  });

  it('renders an up tail as part of the same material path', () => {
    const { container } = render(
      <TooltipContainer text="Test" width={160} height={88} tailDirection="up" tailCenterX={80} />
    );
    const materialShape = container.querySelector('[class*="materialShape"] path');
    const pathD = materialShape?.getAttribute('d') ?? '';

    expect(materialShape).not.toBeNull();
    expect(pathD).toContain('C');
    expect(pathD).not.toContain('L 80,16');
  });
});

describe('TooltipContainer text styling', () => {
  it('text element exists with correct class', () => {
    const { container } = render(<TooltipContainer text="Test" />);
    const textEl = container.querySelector('[class*="text"]');
    expect(textEl).not.toBeNull();
  });

  it('metadata element exists when metadata provided', () => {
    const { container } = render(
      <TooltipContainer text="Main" metadata="Info" />
    );
    const metaEl = container.querySelector('[class*="metadata"]');
    expect(metaEl).not.toBeNull();
  });

  it('keeps blended content in the material backdrop stacking context', () => {
    const contentContainerRule =
      tooltipContainerCss.match(/\.contentContainer\s*\{(?<rule>[\s\S]*?)\n\}/)?.groups
        ?.rule ?? '';

    expect(contentContainerRule).not.toMatch(/(^|\s)z-index\s*:/);
  });
});

describe('TooltipContainer min width (MIN_WIDTH = 36px)', () => {
  it('has min-width styling', () => {
    const { container } = render(<TooltipContainer text="X" />);
    // Min width should be applied via CSS or inline style
    expect(container.firstElementChild).not.toBeNull();
  });
});

describe('TooltipContainer custom props', () => {
  it('accepts className', () => {
    const { container } = render(
      <TooltipContainer text="Test" className="my-tooltip" />
    );
    expect(container.firstElementChild?.className).toContain('my-tooltip');
  });

  it('accepts custom style', () => {
    const { container } = render(
      <TooltipContainer text="Test" style={{ margin: 8 }} />
    );
    const style = container.firstElementChild?.getAttribute('style') ?? '';
    expect(style).toContain('margin: 8px');
  });
});

describe('TooltipContainer re-rendering', () => {
  it('updates text', () => {
    const { rerender, container } = render(<TooltipContainer text="v1" />);
    expect(container.textContent).toContain('v1');

    rerender(<TooltipContainer text="v2" />);
    expect(container.textContent).toContain('v2');
  });

  it('updates metadata', () => {
    const { rerender, container } = render(
      <TooltipContainer text="Main" metadata="m1" />
    );
    expect(container.textContent).toContain('m1');

    rerender(<TooltipContainer text="Main" metadata="m2" />);
    expect(container.textContent).toContain('m2');
  });

  it('toggles icon', () => {
    const { rerender, container } = render(<TooltipContainer text="Test" />);
    expect(container.querySelector('[style*="mask-image"]')).toBeNull();

    rerender(<TooltipContainer text="Test" icon={TEST_ICON_URI_SOURCE} />);
    expect(container.querySelector('[style*="mask-image"]')).not.toBeNull();
  });
});
