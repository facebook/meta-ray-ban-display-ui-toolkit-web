/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * ActionHint tests
 *
 * Constants:
 * - Icon size: 24px
 * - Padding: 12px horizontal, 8px vertical
 * - Icon margin-right: 8px
 * - Text: Meta3 text appearance, primary text color, additive blend mode
 * - Material: actionHint material with XSMALL corner radius (16px)
 * - Icon: hidden by default, visible when set
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { VisualState } from '@wearables-ui-toolkit/foundation/base/Interactions';
import { MaterialLibrary } from '@wearables-ui-toolkit/foundation/material/MaterialLibrary';
import { ActionHint } from '../mrbd/ui/ActionHint';
import { TEST_ICON } from './helpers/testIcon';
import { drawLayer } from './helpers/canvasRecorder';

const TEST_ICON_SRC = '/icons/test-icon.svg';

describe('ActionHint rendering', () => {
  it('renders without crashing', () => {
    const { container } = render(<ActionHint text="Tap to open" />);
    expect(container.firstElementChild).not.toBeNull();
  });

  it('renders text', () => {
    const { container } = render(<ActionHint text="Preview with AI" />);
    expect(container.textContent).toContain('Preview with AI');
  });

  it('renders icon when provided (vector token renders inline svg)', () => {
    const { container } = render(
      <ActionHint text="Test" icon={TEST_ICON} />
    );
    const iconEl = container.querySelector('[class*="icon"]');
    expect(iconEl).not.toBeNull();
    expect(iconEl?.querySelector('svg')).not.toBeNull();
  });

  it('renders icon from a URI source as a tinted mask', () => {
    const { container } = render(
      <ActionHint text="Test" icon={{ uri: TEST_ICON_SRC }} />
    );
    const iconEl = container.querySelector('[class*="icon"]');
    const maskSpan = iconEl?.querySelector('[style*="mask-image"]');
    expect(maskSpan).not.toBeNull();
    expect(maskSpan?.getAttribute('style')).toContain(`url("${TEST_ICON_SRC}")`);
  });

  it('hides icon when not provided (hidden by default)', () => {
    const { container } = render(<ActionHint text="Test" />);
    expect(container.querySelector('[class*="icon"]')).toBeNull();
  });
});

describe('ActionHint optional text', () => {
  it('renders with no text prop, defaulting to an empty string', () => {
    const { container } = render(<ActionHint />);
    const textEl = container.querySelector('[class*="text"]');
    expect(textEl).not.toBeNull();
    expect(textEl?.textContent).toBe('');
  });

  it('renders the provided text when text is set', () => {
    const { container } = render(<ActionHint text="Tap to open" />);
    const textEl = container.querySelector('[class*="text"]');
    expect(textEl?.textContent).toBe('Tap to open');
  });
});

describe('ActionHint padding', () => {
  it('has 12px horizontal, 8px vertical padding', () => {
    const { container } = render(<ActionHint text="Test" />);
    const style = container.firstElementChild?.getAttribute('style') ?? '';
    expect(style).toContain('padding: 8px 12px');
  });
});

describe('ActionHint icon sizing (24px)', () => {
  it('icon container is 24x24px', () => {
    const { container } = render(
      <ActionHint text="Test" icon={TEST_ICON} />
    );
    const iconEl = container.querySelector('[class*="icon"]');
    const style = iconEl?.getAttribute('style') ?? '';
    expect(style).toContain('width: 24px');
    expect(style).toContain('height: 24px');
  });

  it('icon has 8px right margin', () => {
    const { container } = render(
      <ActionHint text="Test" icon={TEST_ICON} />
    );
    const iconEl = container.querySelector('[class*="icon"]');
    const style = iconEl?.getAttribute('style') ?? '';
    expect(style).toContain('margin-right: 8px');
  });
});

describe('ActionHint material (actionHint material + XSMALL)', () => {
  it('uses StaticContainer as base', () => {
    const { container } = render(<ActionHint text="Test" />);
    const bgLayers = container.querySelector('[class*="backgroundLayers"]');
    expect(bgLayers).not.toBeNull();
  });

  it('uses actionHint material (has gradient background)', () => {
    const { container } = render(<ActionHint text="Test" />);
    // actionHint material creates background layers
    expect(container.firstElementChild).not.toBeNull();
  });

  it('uses the actionHint material layers', () => {
    const material = MaterialLibrary.actionHint();
    const layers = material.getBackgroundLayers();
    expect(layers.map(layer => layer.id)).toEqual([
      'action-hint-gradient',
      'action-hint-stroke',
    ]);
  });

  it('renders linear gradient from top-left to bottom-right', () => {
    const gradientLayer = MaterialLibrary.actionHint().getBackgroundLayers()[0];

    const rec = drawLayer(gradientLayer, {
      state: VisualState.DEFAULT,
      width: 100,
      height: 42,
    });
    const linear = rec.gradients.find(g => g.kind === 'linear');
    // Gradient spans the rect diagonal: (0,0) -> (width,height), i.e. top-left to
    // bottom-right, with a 15% white fade to transparent.
    expect(linear?.args).toEqual([0, 0, 100, 42]);
    expect(linear?.stops.map(s => s.color)).toEqual([
      'rgba(255, 255, 255, 0.15)',
      'rgba(255, 255, 255, 0)',
    ]);
    expect(rec.has('fill')).toBe(true);
  });
});

describe('ActionHint text styling (Meta3 text appearance)', () => {
  it('text element has text class', () => {
    const { container } = render(<ActionHint text="Test" />);
    const textEl = container.querySelector('[class*="text"]');
    expect(textEl).not.toBeNull();
  });

  it('text uses the meta3 type style with no extra word-spacing', () => {
    const { container } = render(<ActionHint text="I am an action hint" icon={TEST_ICON} />);
    const textEl = container.querySelector('[class*="text"]');
    // Typography comes from the meta3 class; no fabricated inline word-spacing.
    expect(textEl?.getAttribute('style') ?? '').not.toContain('word-spacing');
  });
});

describe('ActionHint custom props', () => {
  it('accepts className', () => {
    const { container } = render(<ActionHint text="Test" className="my-hint" />);
    expect(container.firstElementChild?.className).toContain('my-hint');
  });

  it('accepts custom style', () => {
    const { container } = render(<ActionHint text="Test" style={{ margin: 8 }} />);
    const style = container.firstElementChild?.getAttribute('style') ?? '';
    expect(style).toContain('margin: 8px');
  });

  it('forwards static container root attributes for component capture', () => {
    const { container } = render(
      <ActionHint
        data-testid="action-hint-root"
        data-uit-capture-id="action-hint-capture"
        text="Test"
      />
    );
    expect(container.firstElementChild?.getAttribute('data-testid')).toBe('action-hint-root');
    expect(container.firstElementChild?.getAttribute('data-uit-capture-id')).toBe('action-hint-capture');
  });
});

describe('ActionHint re-rendering', () => {
  it('updates text', () => {
    const { rerender, container } = render(<ActionHint text="v1" />);
    expect(container.textContent).toContain('v1');

    rerender(<ActionHint text="v2" />);
    expect(container.textContent).toContain('v2');
  });

  it('shows/hides icon', () => {
    const { rerender, container } = render(<ActionHint text="Test" />);
    expect(container.querySelector('[class*="icon"]')).toBeNull();

    rerender(<ActionHint text="Test" icon={{ uri: TEST_ICON_SRC }} />);
    expect(container.querySelector('[style*="mask-image"]')).not.toBeNull();
  });
});
