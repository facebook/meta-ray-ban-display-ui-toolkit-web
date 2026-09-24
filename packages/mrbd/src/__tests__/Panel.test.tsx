/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Panel tests
 *
 * Non-focusable, non-clickable Container variant.
 * Uses panel-specific material, contentScale always 1.
 */

import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import { Panel } from '@wearables-ui-toolkit/foundation/components/Panel';
import type { PanelProps } from '@wearables-ui-toolkit/foundation/components/Panel';

describe('Panel initialization', () => {
  it('renders without crashing', () => {
    const { container } = render(<Panel />);
    expect(container.firstElementChild).not.toBeNull();
  });

  it('renders children', () => {
    const { container } = render(
      <Panel><span data-testid="panel-content">Content</span></Panel>
    );
    expect(container.querySelector('[data-testid="panel-content"]')).not.toBeNull();
  });

  it('has background layers', () => {
    const { container } = render(<Panel />);
    expect(container.querySelector('[class*="backgroundLayers"]')).not.toBeNull();
  });

  it('uses the medium corner radius by default', () => {
    const { container } = render(<Panel />);
    expect(container.firstElementChild).toHaveStyle({ borderRadius: '32px' });
  });
});

describe('Panel non-interactive behavior (isFocusable=false)', () => {
  it('has no tabIndex because isFocusable=false', () => {
    const { container } = render(<Panel />);
    const el = container.firstElementChild;
    expect(el?.getAttribute('tabindex')).toBeNull();
  });

  it('does not expose default button semantics', () => {
    const { container } = render(<Panel />);
    const el = container.firstElementChild;
    expect(el?.getAttribute('role')).toBeNull();
    expect(el?.getAttribute('aria-disabled')).toBeNull();
  });

  it('cursor is default (not pointer)', () => {
    const { container } = render(<Panel />);
    const style = container.firstElementChild?.getAttribute('style') ?? '';
    expect(style).toContain('cursor: default');
  });

  it('supports inherited interaction props when explicitly enabled', () => {
    const onStateChange = vi.fn();
    const onClick = vi.fn();
    const onKeyDown = vi.fn();
    const interactionProps = {
      focusable: true,
      pressable: true,
      clickable: true,
      onStateChange,
      onClick,
      onKeyDown,
    } satisfies PanelProps;
    const { container } = render(
      <Panel {...interactionProps} />,
    );
    const el = container.firstElementChild as HTMLElement;

    fireEvent.focus(el);
    fireEvent.mouseDown(el);
    fireEvent.mouseUp(el);
    fireEvent.click(el);
    fireEvent.keyDown(el, { key: 'Enter' });

    expect(el).toHaveAttribute('tabindex', '0');
    expect(onStateChange).toHaveBeenCalled();
    expect(onClick).toHaveBeenCalledOnce();
    expect(onKeyDown).toHaveBeenCalledOnce();
  });
});

describe('Panel custom props', () => {
  it('accepts className', () => {
    const { container } = render(<Panel className="my-panel" />);
    expect(container.firstElementChild?.className).toContain('my-panel');
  });

  it('accepts width and height', () => {
    const { container } = render(<Panel width={400} height={300} />);
    const style = container.firstElementChild?.getAttribute('style') ?? '';
    expect(style).toContain('width: 400');
    expect(style).toContain('height: 300');
  });
});
