/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { KeyboardEvent } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { createEvent, fireEvent, render, screen } from '@testing-library/react';
import { MaterialLibrary } from '@wearables-ui-toolkit/foundation/material/MaterialLibrary';
import { InputTextView, InputTextViewSize } from '../mrbd/ui/InputTextView';
import { DEFAULT_INPUT_TEXT_VIEW_ACTION_ICON } from '../mrbd/ui/InputTextViewIcons';
import {
  getInputTextViewContainerWidth,
  getInputTextViewEditAreaStyle,
  getInputTextViewEmptyContainerWidth,
  getInputTextViewLayoutState,
  getInputTextViewScrollState,
  shouldShowInputTextViewAccessory,
  shouldShowInputTextViewActionButton,
} from '../mrbd/ui/InputTextViewLayout';
import {
  INPUT_TEXT_VIEW_ACCESSORY_TRAILING_PADDING,
  INPUT_TEXT_VIEW_ACTION_BUTTON_GAP,
  INPUT_TEXT_VIEW_ACTION_BUTTON_SIZE,
  INPUT_TEXT_VIEW_HORIZONTAL_PADDING,
} from '../mrbd/ui/InputTextViewMetrics';

describe('InputTextView layout helpers', () => {
  it('keeps the loader in-field and shows the separate action when configured', () => {
    expect(
      shouldShowInputTextViewAccessory({ showLoader: false }),
    ).toBe(false);
    expect(
      shouldShowInputTextViewAccessory({ showLoader: true }),
    ).toBe(true);
    expect(
      shouldShowInputTextViewActionButton({
        showActionButton: true,
        hasAction: true,
      }),
    ).toBe(true);
    expect(
      shouldShowInputTextViewActionButton({
        showActionButton: false,
        hasAction: true,
      }),
    ).toBe(false);
    expect(
      shouldShowInputTextViewActionButton({
        showActionButton: true,
        hasAction: false,
      }),
    ).toBe(false);
  });

  it('uses the full and shrink-empty width rules', () => {
    expect(
      getInputTextViewContainerWidth({
        size: InputTextViewSize.FULL,
        hasText: false,
      }),
    ).toBe('100%');
    expect(
      getInputTextViewContainerWidth({
        size: InputTextViewSize.SHRINK_WHEN_EMPTY,
        hasText: false,
      }),
    ).toBe(252);
    expect(
      getInputTextViewContainerWidth({
        size: InputTextViewSize.FULL,
        hasText: true,
        showActionButton: true,
      }),
    ).toBe(
      `calc(100% - ${
        INPUT_TEXT_VIEW_ACTION_BUTTON_SIZE + INPUT_TEXT_VIEW_ACTION_BUTTON_GAP
      }px)`,
    );
  });

  it('uses a stable initial width before measuring a shrink-empty hint', () => {
    expect(getInputTextViewEmptyContainerWidth()).toBe(252);
  });

  it('reserves trailing space for a visible accessory', () => {
    expect(getInputTextViewEditAreaStyle(false)).toEqual({
      paddingRight: INPUT_TEXT_VIEW_HORIZONTAL_PADDING,
    });
    expect(getInputTextViewEditAreaStyle(true)).toEqual({
      paddingRight: INPUT_TEXT_VIEW_ACCESSORY_TRAILING_PADDING,
    });
  });

  it('derives scrollbar and fading-edge state from the viewport', () => {
    expect(
      getInputTextViewScrollState({
        scrollTop: 0,
        scrollHeight: 120,
        clientHeight: 120,
      }),
    ).toEqual({
      isScrollable: false,
      showTopFade: false,
      showBottomFade: false,
      scrollRatio: 0,
      viewportRatio: 1,
    });
    expect(
      getInputTextViewScrollState({
        scrollTop: 60,
        scrollHeight: 240,
        clientHeight: 120,
      }),
    ).toEqual({
      isScrollable: true,
      showTopFade: true,
      showBottomFade: true,
      scrollRatio: 0.5,
      viewportRatio: 0.5,
    });
    expect(
      getInputTextViewScrollState({
        scrollTop: 120,
        scrollHeight: 240,
        clientHeight: 120,
      }).showBottomFade,
    ).toBe(false);
  });

  it('returns the composed layout state used by the component', () => {
    expect(
      getInputTextViewLayoutState({
        value: '',
        size: InputTextViewSize.SHRINK_WHEN_EMPTY,
        showLoader: false,
        showActionButton: true,
        hasAction: true,
      }),
    ).toEqual({
      hasText: false,
      showAccessory: false,
      showActionButton: true,
      containerWidth: 252,
      editAreaStyle: { paddingRight: INPUT_TEXT_VIEW_HORIZONTAL_PADDING },
    });
  });
});

describe('InputTextView rendering and behavior', () => {
  it('renders the default hint with no accessory when empty', () => {
    render(<InputTextView />);

    expect(screen.getByLabelText('Start writing')).toHaveAttribute(
      'placeholder',
      'Start writing',
    );
    expect(screen.queryByRole('button', { name: 'Send' })).toBeNull();
  });

  it('renders the standard send icon in a separate action button', () => {
    render(<InputTextView text="Hello" onSend={() => {}} />);

    const action = screen.getByRole('button', { name: 'Send' });
    const icon = action.querySelector('svg[aria-hidden="true"][fill="currentColor"]');
    expect(icon).toHaveAttribute(
      'viewBox',
      DEFAULT_INPUT_TEXT_VIEW_ACTION_ICON.viewBox,
    );
    const paths = Array.from(icon?.querySelectorAll('path') ?? []);
    expect(paths.map(path => path.getAttribute('d'))).toEqual(
      DEFAULT_INPUT_TEXT_VIEW_ACTION_ICON.paths.map(path => path.d),
    );
    expect(screen.getByLabelText('Start writing')).toHaveStyle({
      paddingRight: `${INPUT_TEXT_VIEW_HORIZONTAL_PADDING}px`,
    });
  });

  it('forwards a custom material to the separate action button', () => {
    const actionButtonMaterial = MaterialLibrary.themedPrimaryBlue();
    const attachSpy = vi.spyOn(actionButtonMaterial, 'attachToHost');

    render(
      <InputTextView
        text="Hello"
        onSend={() => {}}
        actionButtonMaterial={actionButtonMaterial}
      />,
    );

    expect(attachSpy).toHaveBeenCalled();
  });

  it('keeps the configured action visible but disabled while empty', () => {
    render(<InputTextView onSend={() => {}} />);

    expect(screen.getByRole('button', { name: 'Send' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('renders a non-interactive loader in the accessory slot', () => {
    render(<InputTextView showLoader loadingLabel="Sending" />);

    expect(screen.getByRole('progressbar', { name: 'Sending' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Send' })).toBeNull();
  });

  it('notifies text changes for uncontrolled input', () => {
    const handleTextChange = vi.fn();
    render(<InputTextView onTextChange={handleTextChange} onSend={() => {}} />);

    fireEvent.change(screen.getByLabelText('Start writing'), {
      target: { value: 'Hello' },
    });

    expect(handleTextChange).toHaveBeenCalledWith('Hello');
    expect(screen.getByRole('button', { name: 'Send' })).toBeInTheDocument();
  });

  it('sends, clears, and reports the cleared uncontrolled text on Enter', () => {
    const handleSend = vi.fn();
    const handleTextChange = vi.fn();
    render(<InputTextView onSend={handleSend} onTextChange={handleTextChange} />);
    const textarea = screen.getByLabelText('Start writing');

    fireEvent.change(textarea, { target: { value: 'Hello' } });
    expect(fireEvent.keyDown(textarea, { key: 'Enter' })).toBe(false);

    expect(handleSend).toHaveBeenCalledWith('Hello');
    expect(handleTextChange).toHaveBeenNthCalledWith(1, 'Hello');
    expect(handleTextChange).toHaveBeenNthCalledWith(2, '');
    expect(textarea).toHaveValue('');
  });

  it('consumes empty Enter when submission is configured', () => {
    const handleSend = vi.fn();
    render(<InputTextView onSend={handleSend} />);
    const textarea = screen.getByLabelText('Start writing');
    const enterEvent = createEvent.keyDown(textarea, { key: 'Enter' });

    fireEvent(textarea, enterEvent);

    expect(enterEvent.defaultPrevented).toBe(true);
    expect(handleSend).not.toHaveBeenCalled();
    expect(textarea).toHaveValue('');
  });

  it('keeps Enter submission when the separate action is hidden', () => {
    const handleSend = vi.fn();
    render(
      <InputTextView
        defaultText="Hello"
        showActionButton={false}
        onSend={handleSend}
      />,
    );

    const textarea = screen.getByLabelText('Start writing');
    const enterEvent = createEvent.keyDown(textarea, { key: 'Enter' });

    fireEvent(textarea, enterEvent);

    expect(enterEvent.defaultPrevented).toBe(true);
    expect(handleSend).toHaveBeenCalledWith('Hello');
    expect(screen.queryByRole('button', { name: 'Send' })).toBeNull();
  });

  it('keeps normal multiline Enter behavior when no send action exists', () => {
    render(<InputTextView defaultText="Hello" />);

    const textarea = screen.getByLabelText('Start writing');
    const enterEvent = createEvent.keyDown(textarea, { key: 'Enter' });

    fireEvent(textarea, enterEvent);

    expect(enterEvent.defaultPrevented).toBe(false);
  });

  it('does not send on Shift+Enter', () => {
    const handleSend = vi.fn();
    render(<InputTextView defaultText="Hello" onSend={handleSend} />);

    fireEvent.keyDown(screen.getByLabelText('Start writing'), {
      key: 'Enter',
      shiftKey: true,
    });

    expect(handleSend).not.toHaveBeenCalled();
  });

  it.each([
    { event: { key: 'Enter', isComposing: true }, label: 'IME composition' },
    { event: { key: 'Enter', altKey: true }, label: 'Alt+Enter' },
    { event: { key: 'Enter', ctrlKey: true }, label: 'Control+Enter' },
    { event: { key: 'Enter', metaKey: true }, label: 'Meta+Enter' },
  ])('does not send during $label', ({ event }) => {
    const handleSend = vi.fn();
    render(<InputTextView defaultText="Hello" onSend={handleSend} />);

    fireEvent.keyDown(screen.getByLabelText('Start writing'), event);

    expect(handleSend).not.toHaveBeenCalled();
  });

  it('lets Escape and Tab reach surrounding navigation', () => {
    const handleRootKeyDown = vi.fn();
    render(<InputTextView onKeyDown={handleRootKeyDown} />);
    const textarea = screen.getByLabelText('Start writing');

    fireEvent.keyDown(textarea, { key: 'Escape' });
    fireEvent.keyDown(textarea, { key: 'Tab' });

    expect(handleRootKeyDown).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ key: 'Escape' }),
    );
    expect(handleRootKeyDown).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ key: 'Tab' }),
    );
  });

  it('lets unhandled directional keys participate in root focus navigation', () => {
    const handleRootKeyDown = vi.fn();
    const handleInputKeyDown = vi.fn();
    render(
      <InputTextView
        onKeyDown={handleRootKeyDown}
        inputProps={{ onKeyDown: handleInputKeyDown }}
      />,
    );

    const arrowDownEvent = createEvent.keyDown(
      screen.getByLabelText('Start writing'),
      { key: 'ArrowDown' },
    );
    fireEvent(screen.getByLabelText('Start writing'), arrowDownEvent);

    expect(arrowDownEvent.defaultPrevented).toBe(false);
    expect(handleInputKeyDown).toHaveBeenCalledTimes(1);
    expect(handleRootKeyDown).toHaveBeenCalledTimes(1);
  });

  it('contains directional keyboard events when the consumer handles them', () => {
    const handleRootKeyDown = vi.fn();
    const handleInputKeyDown = vi.fn((event: KeyboardEvent<HTMLTextAreaElement>) => {
      event.preventDefault();
    });
    render(
      <InputTextView
        onKeyDown={handleRootKeyDown}
        inputProps={{ onKeyDown: handleInputKeyDown }}
      />,
    );

    fireEvent.keyDown(screen.getByLabelText('Start writing'), { key: 'ArrowDown' });

    expect(handleInputKeyDown).toHaveBeenCalledTimes(1);
    expect(handleRootKeyDown).not.toHaveBeenCalled();
  });

  it('contains caller-consumed non-navigation keys', () => {
    const handleRootKeyDown = vi.fn();
    render(
      <InputTextView
        onKeyDown={handleRootKeyDown}
        inputProps={{
          onKeyDown: event => event.preventDefault(),
        }}
      />,
    );

    fireEvent.keyDown(screen.getByLabelText('Start writing'), { key: 'a' });

    expect(handleRootKeyDown).not.toHaveBeenCalled();
  });

  it('forwards standard textarea attributes and keyboard handlers', () => {
    const handleKeyDown = vi.fn();
    render(
      <InputTextView
        hint="Message"
        inputProps={{
          name: 'message',
          maxLength: 40,
          autoComplete: 'off',
          onKeyDown: handleKeyDown,
        }}
      />,
    );
    const textarea = screen.getByLabelText('Message');

    fireEvent.keyDown(textarea, { key: 'a' });

    expect(textarea).toHaveAttribute('name', 'message');
    expect(textarea).toHaveAttribute('maxlength', '40');
    expect(textarea).toHaveAttribute('autocomplete', 'off');
    expect(handleKeyDown).toHaveBeenCalledTimes(1);
  });
});
