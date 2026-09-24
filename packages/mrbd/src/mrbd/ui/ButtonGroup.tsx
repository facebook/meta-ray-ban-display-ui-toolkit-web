/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * ButtonGroup component for Meta Ray-Ban Display
 *
 * Container for arranging buttons horizontally with alignment control.
 * Manages focus navigation between child buttons via keyboard (arrow keys).
 * Defines the Sizable interface for child components.
 *
 * A child that does not implement Sizable cannot break the page, so it is
 * surfaced as a dev-only console.warn (see
 * warnOnNonSizableButtonGroupChildren) rather than throwing in production.
 *
 * No touch on Meta Ray-Ban Display — all interaction via d-pad/trackpad.
 */

import {
  forwardRef,
  memo,
  useRef,
  useCallback,
  useLayoutEffect,
  useMemo,
  useState,
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
} from 'react';
import { useComposedRef } from '@wearables-ui-toolkit/foundation/utils/useComposedRef';
import { ButtonGroupAlignment } from './ButtonGroup.types';
import type { ButtonGroupProps } from './ButtonGroup.types';
import {
  BUTTON_GROUP_DEFAULT_HEIGHT,
  calculateButtonGroupHeight,
  getButtonGroupFocusableChildren,
  getButtonGroupJustifyContent,
  getButtonGroupNextFocusable,
  warnOnNonSizableButtonGroupChildren,
} from './private/ButtonGroupLayout';
import styles from './ButtonGroup.module.css';

export { ButtonGroupAlignment } from './ButtonGroup.types';
export type { ButtonGroupProps, Sizable } from './ButtonGroup.types';

// ============================================================================
// Component
// ============================================================================

const DEFAULT_STYLE: CSSProperties = {};

/**
 * ButtonGroup component
 * Arranges buttons horizontally with alignment and keyboard focus management.
 *
 * Key handling (d-pad navigation):
 * - ArrowLeft: move focus to previous focusable child
 * - ArrowRight: move focus to next focusable child
 *
 * Usage:
 * ```tsx
 * <ButtonGroup alignment={ButtonGroupAlignment.CENTER}>
 *   <Button title="OK" icon={<CheckIcon />} />
 *   <Button title="Cancel" icon={<XIcon />} />
 * </ButtonGroup>
 * ```
 */
export const ButtonGroup = memo(forwardRef<HTMLDivElement, ButtonGroupProps>(
  function ButtonGroup(
    {
      children,
      alignment = ButtonGroupAlignment.CENTER,
      onChildFocusChange,
      className = '',
      style = DEFAULT_STYLE,
    },
    ref
  ) {
    const internalRef = useRef<HTMLDivElement>(null);
    const setContainerRef = useComposedRef(ref, internalRef);
    const [buttonHeight, setButtonHeight] = useState(BUTTON_GROUP_DEFAULT_HEIGHT);

    /**
     * Get all focusable children within the group.
     * Iterates over visible children that implement the Sizable interface.
     */
    const getFocusableChildren = useCallback((): HTMLElement[] => {
      return getButtonGroupFocusableChildren(internalRef.current);
    }, []);

    /**
     * Handle keyboard navigation between children.
     * Manages focus with the d-pad.
     */
    const handleKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
      const focusable = getFocusableChildren();
      if (focusable.length === 0) return;

      const nextFocusable = getButtonGroupNextFocusable(
        focusable,
        event.target as HTMLElement,
        event.key,
      );

      if (nextFocusable != null) {
        event.preventDefault();
        event.stopPropagation();
        nextFocusable.focus();
      }
    }, [getFocusableChildren]);

    /**
     * Track focus changes within the group.
     * Observes child focus changes.
     */
    const handleFocusIn = useCallback((event: FocusEvent<HTMLDivElement>) => {
      onChildFocusChange?.(internalRef.current, event.target as HTMLElement);
    }, [onChildFocusChange]);

    const handleFocusOut = useCallback((event: FocusEvent<HTMLDivElement>) => {
      // Check if focus is leaving the group entirely
      const container = internalRef.current;
      if (!container) return;
      // relatedTarget is where focus is going — if it's outside our container, focus left
      if (!event.relatedTarget || !container.contains(event.relatedTarget as Node)) {
        onChildFocusChange?.(internalRef.current, null);
      }
    }, [onChildFocusChange]);

    /**
     * Measures every visible Sizable child and uses the
     * tallest one as the group height. QuickReplyButton is 72px while regular
     * Button is 88px, so hard-coding 88px top-aligns quick replies in mixed
     * groups and adds extra rail height for quick-reply-only groups.
     */
    useLayoutEffect(() => {
      const container = internalRef.current;
      if (!container) return;

      // Dev-only check for non-Sizable children: soft-warn instead of
      // throwing in production.
      warnOnNonSizableButtonGroupChildren(container.children);

      const nextHeight = calculateButtonGroupHeight(container.children);
      setButtonHeight(prevHeight => prevHeight === nextHeight ? prevHeight : nextHeight);
    }, [children]);

    const justifyContent = useMemo(
      () => getButtonGroupJustifyContent(alignment),
      [alignment],
    );

    const groupStyle = useMemo<CSSProperties>(
      () => ({
        justifyContent,
        minHeight: buttonHeight,
        ...style,
      }),
      [buttonHeight, justifyContent, style],
    );

    const groupClassName = useMemo(
      () => `${styles.buttonGroup} ${className}`,
      [className],
    );

    return (
      <div
        ref={setContainerRef}
        className={groupClassName}
        style={groupStyle}
        onKeyDown={handleKeyDown}
        onFocus={handleFocusIn}
        onBlur={handleFocusOut}
      >
        {children}
      </div>
    );
  }
));
