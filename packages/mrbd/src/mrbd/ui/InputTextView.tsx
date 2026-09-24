/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  forwardRef,
  memo,
  useCallback,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from 'react';
import { MaterialLibrary } from '../foundation/MaterialLibrary';
import { copyTextInputMaterialForHost } from '@wearables-ui-toolkit/foundation/material/TextInputContainerMaterial';
import { InputTextViewFrame } from './InputTextViewFrame';
import { DEFAULT_INPUT_TEXT_VIEW_ACTION_ICON } from './InputTextViewIcons';
import { getInputTextViewLayoutState } from './InputTextViewLayout';
import {
  InputTextViewSize,
  type InputTextViewInputProps,
  type InputTextViewProps,
} from './InputTextView.types';

export { InputTextViewSize } from './InputTextView.types';
export type {
  InputTextViewInputProps,
  InputTextViewProps,
} from './InputTextView.types';

const EMPTY_INPUT_TEXT_VIEW_STYLE: CSSProperties = {};
const EMPTY_INPUT_TEXT_VIEW_INPUT_PROPS: InputTextViewInputProps = {};

/**
 * A multiline text-entry surface for Meta Ray-Ban Display applications.
 *
 * The field grows from one to three visible lines, then scrolls within the
 * surface. Focusing the underlying textarea lets the embedding environment own
 * text entry while the web surface remains a focused text display.
 */
export const InputTextView = memo(forwardRef<HTMLDivElement, InputTextViewProps>(
  function InputTextView(
    {
      text,
      defaultText = '',
      hint = 'Start writing',
      size = InputTextViewSize.FULL,
      material: materialProp,
      showLoader = false,
      loadingLabel = 'Loading',
      actionIcon = DEFAULT_INPUT_TEXT_VIEW_ACTION_ICON,
      actionButtonMaterial,
      actionLabel = 'Send',
      showActionButton: showActionButtonProp = true,
      onSend,
      onTextChange,
      inputProps = EMPTY_INPUT_TEXT_VIEW_INPUT_PROPS,
      className = '',
      style = EMPTY_INPUT_TEXT_VIEW_STYLE,
      ...rootProps
    },
    ref,
  ) {
    const [uncontrolledText, setUncontrolledText] = useState(defaultText);
    const textAreaRef = useRef<HTMLTextAreaElement>(null);
    const material = useMemo(
      () => copyTextInputMaterialForHost(
        materialProp ?? MaterialLibrary.textInput(),
      ),
      [materialProp],
    );
    const value = text ?? uncontrolledText;
    const hasAction = onSend != null;
    const {
      showAccessory,
      showActionButton,
      containerWidth,
      editAreaStyle,
    } = useMemo(
      () => getInputTextViewLayoutState({
        value,
        size,
        showLoader,
        showActionButton: showActionButtonProp,
        hasAction,
      }),
      [hasAction, showActionButtonProp, showLoader, size, value],
    );

    const handleTextChange = useCallback((nextText: string) => {
      if (text == null) {
        setUncontrolledText(nextText);
      }
      onTextChange?.(nextText);
    }, [onTextChange, text]);

    const handleSend = useCallback(() => {
      if (onSend == null || value.length === 0) {
        return;
      }

      onSend(value);
      if (text == null) {
        setUncontrolledText('');
        onTextChange?.('');
      }
    }, [onSend, onTextChange, text, value]);

    const handleKeyDown = useCallback((event: KeyboardEvent<HTMLTextAreaElement>) => {
      const isDirectionalNavigation =
        event.key === 'ArrowUp' ||
        event.key === 'ArrowDown' ||
        event.key === 'ArrowLeft' ||
        event.key === 'ArrowRight';

      inputProps.onKeyDown?.(event);
      if (event.defaultPrevented) {
        if (event.key !== 'Escape' && event.key !== 'Tab') {
          event.stopPropagation();
        }
        return;
      }
      if (isDirectionalNavigation || event.key === 'Escape' || event.key === 'Tab') {
        return;
      }

      event.stopPropagation();
      const isUnmodifiedEnter =
        event.key === 'Enter' &&
        !event.shiftKey &&
        !event.altKey &&
        !event.ctrlKey &&
        !event.metaKey;
      if (
        onSend != null &&
        isUnmodifiedEnter &&
        !event.nativeEvent.isComposing
      ) {
        event.preventDefault();
        handleSend();
      }
    }, [handleSend, inputProps, onSend]);

    return (
      <InputTextViewFrame
        ref={ref}
        rootProps={rootProps}
        className={className}
        style={style}
        material={material}
        containerWidth={containerWidth}
        textAreaRef={textAreaRef}
        showAccessory={showAccessory}
        showActionButton={showActionButton}
        enterSubmissionEnabled={hasAction}
        measureEmptyWidth={
          size === InputTextViewSize.SHRINK_WHEN_EMPTY && value.length === 0
        }
        editAreaStyle={editAreaStyle}
        value={value}
        hint={hint}
        showLoader={showLoader}
        loadingLabel={loadingLabel}
        actionIcon={actionIcon}
        actionButtonMaterial={actionButtonMaterial}
        actionLabel={actionLabel}
        inputProps={inputProps}
        onTextChange={handleTextChange}
        onKeyDown={handleKeyDown}
        onSend={handleSend}
      />
    );
  },
));
