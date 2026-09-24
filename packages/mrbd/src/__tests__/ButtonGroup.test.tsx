/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * ButtonGroup tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ButtonGroup, ButtonGroupAlignment } from '../mrbd/ui/ButtonGroup';
import { Button } from '../mrbd/ui/Button';
import { ButtonDivider } from '../mrbd/ui/ButtonDivider';
import { QuickReplyButton } from '../mrbd/ui/QuickReplyButton';

describe('ButtonGroup alignment', () => {
  it('defaults to CENTER alignment', () => {
    const { container } = render(
      <ButtonGroup>
        <Button icon={{ uri: "/icons/test.svg" }} title="A" />
        <Button icon={{ uri: "/icons/test.svg" }} title="B" />
      </ButtonGroup>
    );
    const group = container.querySelector('[class*="buttonGroup"]');
    expect(group?.getAttribute('style')).toContain('center');
  });

  it('START alignment sets justify-content: flex-start', () => {
    const { container } = render(
      <ButtonGroup alignment={ButtonGroupAlignment.START}>
        <Button icon={{ uri: "/icons/test.svg" }} title="A" />
      </ButtonGroup>
    );
    const group = container.querySelector('[class*="buttonGroup"]');
    expect(group?.getAttribute('style')).toContain('flex-start');
  });

  it('END alignment sets justify-content: flex-end', () => {
    const { container } = render(
      <ButtonGroup alignment={ButtonGroupAlignment.END}>
        <Button icon={{ uri: "/icons/test.svg" }} title="A" />
      </ButtonGroup>
    );
    const group = container.querySelector('[class*="buttonGroup"]');
    expect(group?.getAttribute('style')).toContain('flex-end');
  });
});

describe('ButtonGroup rendering', () => {
  it('renders children', () => {
    render(
      <ButtonGroup>
        <Button icon={{ uri: "/icons/test.svg" }} title="Reply" />
        <Button icon={{ uri: "/icons/test.svg" }} title="Write" />
      </ButtonGroup>
    );
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(2);
  });

  it('renders ButtonDivider between buttons', () => {
    const { container } = render(
      <ButtonGroup>
        <Button icon={{ uri: "/icons/test.svg" }} title="A" />
        <ButtonDivider />
        <Button icon={{ uri: "/icons/test.svg" }} title="B" />
      </ButtonGroup>
    );
    const divider = container.querySelector('[aria-hidden="true"]');
    expect(divider).not.toBeNull();
  });

  it('container is transparent to accessibility (no group role)', () => {
    // Only the child buttons are announced; the container itself is not exposed
    // as a group.
    const { container } = render(
      <ButtonGroup>
        <Button title="A" />
      </ButtonGroup>
    );
    expect(screen.queryByRole('group')).toBeNull();
    expect(
      container.querySelector('[class*="buttonGroup"]')?.getAttribute('role'),
    ).toBeNull();
  });

  it('container has no aria-label (transparent to a11y)', () => {
    const { container } = render(
      <ButtonGroup>
        <Button title="A" />
      </ButtonGroup>
    );
    expect(
      container
        .querySelector('[class*="buttonGroup"]')
        ?.getAttribute('aria-label'),
    ).toBeNull();
  });

  it('forwards function refs to the group element', () => {
    const forwardedRef = vi.fn();
    const { container } = render(
      <ButtonGroup ref={forwardedRef}>
        <Button title="A" />
      </ButtonGroup>
    );

    expect(forwardedRef).toHaveBeenCalledWith(container.firstElementChild);
  });

  it('has minHeight of 88px (BUTTON_HEIGHT)', () => {
    const { container } = render(
      <ButtonGroup>
        <Button title="A" />
      </ButtonGroup>
    );
    const group = container.querySelector('[class*="buttonGroup"]');
    expect(group?.getAttribute('style')).toContain('min-height: 88px');
  });

  it('uses 72px height for quick-reply-only groups', () => {
    const { container } = render(
      <ButtonGroup>
        <QuickReplyButton title="Yes" />
        <QuickReplyButton title="No" />
      </ButtonGroup>
    );
    const group = container.querySelector('[class*="buttonGroup"]');
    expect(group?.getAttribute('style')).toContain('min-height: 72px');
  });

  it('uses the tallest child height for mixed regular and quick reply groups', () => {
    const { container } = render(
      <ButtonGroup>
        <Button icon={{ uri: "/icons/test.svg" }} title="Call" />
        <QuickReplyButton title="Accept" />
      </ButtonGroup>
    );
    const group = container.querySelector('[class*="buttonGroup"]');
    expect(group?.getAttribute('style')).toContain('min-height: 88px');
  });
});

describe('ButtonGroup keyboard navigation', () => {
  it('ArrowRight moves focus to next button', () => {
    render(
      <ButtonGroup>
        <Button icon={{ uri: "/icons/test.svg" }} title="A" />
        <Button icon={{ uri: "/icons/test.svg" }} title="B" />
        <Button icon={{ uri: "/icons/test.svg" }} title="C" />
      </ButtonGroup>
    );
    const buttons = screen.getAllByRole('button');
    buttons[0].focus();
    expect(document.activeElement).toBe(buttons[0]);

    fireEvent.keyDown(buttons[0], { key: 'ArrowRight' });
    expect(document.activeElement).toBe(buttons[1]);
  });

  it('ArrowLeft moves focus to previous button', () => {
    render(
      <ButtonGroup>
        <Button icon={{ uri: "/icons/test.svg" }} title="A" />
        <Button icon={{ uri: "/icons/test.svg" }} title="B" />
      </ButtonGroup>
    );
    const buttons = screen.getAllByRole('button');
    buttons[1].focus();

    fireEvent.keyDown(buttons[1], { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(buttons[0]);
  });

  it('ArrowLeft at first button does not wrap', () => {
    render(
      <ButtonGroup>
        <Button icon={{ uri: "/icons/test.svg" }} title="A" />
        <Button icon={{ uri: "/icons/test.svg" }} title="B" />
      </ButtonGroup>
    );
    const buttons = screen.getAllByRole('button');
    buttons[0].focus();

    fireEvent.keyDown(buttons[0], { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(buttons[0]);
  });

  it('ArrowRight at last button does not wrap', () => {
    render(
      <ButtonGroup>
        <Button icon={{ uri: "/icons/test.svg" }} title="A" />
        <Button icon={{ uri: "/icons/test.svg" }} title="B" />
      </ButtonGroup>
    );
    const buttons = screen.getAllByRole('button');
    buttons[1].focus();

    fireEvent.keyDown(buttons[1], { key: 'ArrowRight' });
    expect(document.activeElement).toBe(buttons[1]);
  });
});

describe('ButtonGroup focus callbacks', () => {
  it('calls onChildFocusChange when a child gains focus', () => {
    const onFocusChange = vi.fn();
    render(
      <ButtonGroup onChildFocusChange={onFocusChange}>
        <Button icon={{ uri: "/icons/test.svg" }} title="A" />
        <Button icon={{ uri: "/icons/test.svg" }} title="B" />
      </ButtonGroup>
    );
    const buttons = screen.getAllByRole('button');
    fireEvent.focus(buttons[0]);
    expect(onFocusChange).toHaveBeenCalled();
  });

  it('calls onChildFocusChange with null when focus leaves group', () => {
    const onFocusChange = vi.fn();
    render(
      <div>
        <ButtonGroup onChildFocusChange={onFocusChange}>
          <Button icon={{ uri: "/icons/test.svg" }} title="A" />
        </ButtonGroup>
        <button>Outside</button>
      </div>
    );
    const groupButton = screen.getAllByRole('button')[0];
    const outsideButton = screen.getByText('Outside');

    fireEvent.focus(groupButton);
    onFocusChange.mockClear();
    fireEvent.blur(groupButton, { relatedTarget: outsideButton });
    // Callback signature is (group, focusedChild) — child is null on leave.
    expect(onFocusChange).toHaveBeenCalledWith(expect.any(HTMLElement), null);
  });
});

// ============================================================================
// Overflow visible (child clipping disabled)
// ============================================================================

describe('ButtonGroup overflow visible', () => {
  it('group does not clip children (overflow not hidden)', () => {
    const { container } = render(
      <ButtonGroup>
        <Button icon={{ uri: "/icons/test.svg" }} title="A" />
        <Button icon={{ uri: "/icons/test.svg" }} title="B" />
      </ButtonGroup>
    );
    const group = container.querySelector('[class*="buttonGroup"]');
    const style = group?.getAttribute('style') ?? '';
    // overflow should NOT be hidden — buttons need to visually expand beyond group bounds
    expect(style).not.toContain('overflow: hidden');
  });
});

// ============================================================================
// Layout handles multiple buttons correctly (3+ buttons)
// Multiple buttons in group tested with measure/layout
// ============================================================================

describe('ButtonGroup multiple buttons', () => {
  it('renders 3 buttons correctly', () => {
    render(
      <ButtonGroup>
        <Button icon={{ uri: "/icons/test.svg" }} title="A" />
        <Button icon={{ uri: "/icons/test.svg" }} title="B" />
        <Button icon={{ uri: "/icons/test.svg" }} title="C" />
      </ButtonGroup>
    );
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(3);
  });

  it('renders 5 buttons correctly', () => {
    render(
      <ButtonGroup>
        <Button icon={{ uri: "/icons/test.svg" }} title="A" />
        <Button icon={{ uri: "/icons/test.svg" }} title="B" />
        <Button icon={{ uri: "/icons/test.svg" }} title="C" />
        <Button icon={{ uri: "/icons/test.svg" }} title="D" />
        <Button icon={{ uri: "/icons/test.svg" }} title="E" />
      </ButtonGroup>
    );
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(5);
  });

  it('keyboard navigation works across 3 buttons', () => {
    render(
      <ButtonGroup>
        <Button icon={{ uri: "/icons/test.svg" }} title="A" />
        <Button icon={{ uri: "/icons/test.svg" }} title="B" />
        <Button icon={{ uri: "/icons/test.svg" }} title="C" />
      </ButtonGroup>
    );
    const buttons = screen.getAllByRole('button');
    buttons[0].focus();

    fireEvent.keyDown(buttons[0], { key: 'ArrowRight' });
    expect(document.activeElement).toBe(buttons[1]);

    fireEvent.keyDown(buttons[1], { key: 'ArrowRight' });
    expect(document.activeElement).toBe(buttons[2]);

    // At last button, should not wrap
    fireEvent.keyDown(buttons[2], { key: 'ArrowRight' });
    expect(document.activeElement).toBe(buttons[2]);
  });

  it('renders buttons with dividers correctly', () => {
    const { container } = render(
      <ButtonGroup>
        <Button icon={{ uri: "/icons/test.svg" }} title="A" />
        <ButtonDivider />
        <Button icon={{ uri: "/icons/test.svg" }} title="B" />
        <ButtonDivider />
        <Button icon={{ uri: "/icons/test.svg" }} title="C" />
      </ButtonGroup>
    );
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(3);
    // Each button now renders aria-hidden material canvases, so scope the
    // divider count to the divider elements themselves.
    const dividers = container.querySelectorAll('[class*="buttonDivider"]');
    expect(dividers.length).toBe(2);
  });
});

// ============================================================================
// Changing alignment re-renders correctly
// Changing alignment triggers a re-layout
// ============================================================================

describe('ButtonGroup alignment changes', () => {
  it('re-renders when alignment changes from CENTER to START', () => {
    const { container, rerender } = render(
      <ButtonGroup alignment={ButtonGroupAlignment.CENTER}>
        <Button icon={{ uri: "/icons/test.svg" }} title="A" />
      </ButtonGroup>
    );
    let group = container.querySelector('[class*="buttonGroup"]');
    expect(group?.getAttribute('style')).toContain('center');

    rerender(
      <ButtonGroup alignment={ButtonGroupAlignment.START}>
        <Button icon={{ uri: "/icons/test.svg" }} title="A" />
      </ButtonGroup>
    );
    group = container.querySelector('[class*="buttonGroup"]');
    expect(group?.getAttribute('style')).toContain('flex-start');
  });

  it('re-renders when alignment changes from START to END', () => {
    const { container, rerender } = render(
      <ButtonGroup alignment={ButtonGroupAlignment.START}>
        <Button icon={{ uri: "/icons/test.svg" }} title="A" />
      </ButtonGroup>
    );
    let group = container.querySelector('[class*="buttonGroup"]');
    expect(group?.getAttribute('style')).toContain('flex-start');

    rerender(
      <ButtonGroup alignment={ButtonGroupAlignment.END}>
        <Button icon={{ uri: "/icons/test.svg" }} title="A" />
      </ButtonGroup>
    );
    group = container.querySelector('[class*="buttonGroup"]');
    expect(group?.getAttribute('style')).toContain('flex-end');
  });

  it('re-renders when alignment changes from END to CENTER', () => {
    const { container, rerender } = render(
      <ButtonGroup alignment={ButtonGroupAlignment.END}>
        <Button icon={{ uri: "/icons/test.svg" }} title="A" />
      </ButtonGroup>
    );

    rerender(
      <ButtonGroup alignment={ButtonGroupAlignment.CENTER}>
        <Button icon={{ uri: "/icons/test.svg" }} title="A" />
      </ButtonGroup>
    );
    const group = container.querySelector('[class*="buttonGroup"]');
    expect(group?.getAttribute('style')).toContain('center');
  });
});

// ============================================================================
// Single button centering
// Single button in group positions correctly
// ============================================================================

describe('ButtonGroup single button', () => {
  it('single button renders in the group', () => {
    const { container } = render(
      <ButtonGroup>
        <Button icon={{ uri: "/icons/test.svg" }} title="Solo" />
      </ButtonGroup>
    );
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(
      container.querySelector('[class*="buttonGroup"]'),
    ).toBeInTheDocument();
  });

  it('single button with CENTER alignment uses center justification', () => {
    const { container } = render(
      <ButtonGroup alignment={ButtonGroupAlignment.CENTER}>
        <Button icon={{ uri: "/icons/test.svg" }} title="Solo" />
      </ButtonGroup>
    );
    const group = container.querySelector('[class*="buttonGroup"]');
    expect(group?.getAttribute('style')).toContain('center');
  });

  it('single button keyboard nav does not crash', () => {
    render(
      <ButtonGroup>
        <Button icon={{ uri: "/icons/test.svg" }} title="Solo" />
      </ButtonGroup>
    );
    const button = screen.getByRole('button');
    button.focus();

    // ArrowRight on only button should not crash or change focus
    fireEvent.keyDown(button, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(button);

    // ArrowLeft on only button should not crash
    fireEvent.keyDown(button, { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(button);
  });
});

// ============================================================================
// Empty group renders without crashing
// Edge case, no children
// ============================================================================

// ============================================================================
// Non-sizable child dev warning
// Children that do not implement the sizing contract trigger a soft, dev-only
// console.warn rather than blocking rendering.
// ============================================================================

describe('ButtonGroup non-sizable child warning', () => {
  it('warns when a plain DOM child lacks the sizing contract', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <ButtonGroup>
        <div>not a button</div>
      </ButtonGroup>
    );
    expect(warn).toHaveBeenCalled();
    expect(warn.mock.calls[0][0]).toContain('ButtonGroup');
    warn.mockRestore();
  });

  it('does not warn for valid Button children', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <ButtonGroup>
        <Button icon={{ uri: "/icons/test.svg" }} title="A" />
        <Button icon={{ uri: "/icons/test.svg" }} title="B" />
      </ButtonGroup>
    );
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('does not warn for QuickReplyButton or ButtonDivider children', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <ButtonGroup>
        <QuickReplyButton title="Yes" />
        <ButtonDivider />
        <QuickReplyButton title="No" />
      </ButtonGroup>
    );
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('does not warn for an empty group', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<ButtonGroup>{null}</ButtonGroup>);
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('warns only for the non-sizable child in a mixed group', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <ButtonGroup>
        <Button icon={{ uri: "/icons/test.svg" }} title="A" />
        <span>stray</span>
      </ButtonGroup>
    );
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });
});

describe('ButtonGroup empty', () => {
  it('renders empty group without crashing', () => {
    const { container } = render(
      <ButtonGroup>{null}</ButtonGroup>
    );
    expect(container.querySelector('[class*="buttonGroup"]')).toBeInTheDocument();
  });

  it('empty group has correct minHeight', () => {
    const { container } = render(
      <ButtonGroup>{null}</ButtonGroup>
    );
    const group = container.querySelector('[class*="buttonGroup"]');
    expect(group?.getAttribute('style')).toContain('min-height: 88px');
  });

  it('empty group is transparent to a11y (no role or aria-label)', () => {
    const { container } = render(
      <ButtonGroup>{null}</ButtonGroup>
    );
    const group = container.querySelector('[class*="buttonGroup"]');
    expect(group?.getAttribute('role')).toBeNull();
    expect(group?.getAttribute('aria-label')).toBeNull();
  });
});
