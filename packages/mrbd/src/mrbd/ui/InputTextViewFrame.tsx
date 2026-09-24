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
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ChangeEventHandler,
  type FocusEvent,
  type HTMLAttributes,
  type KeyboardEventHandler,
  type MouseEvent,
  type PointerEvent,
  type RefObject,
  type UIEvent,
} from 'react';
import { flushSync } from 'react-dom';
import {
  State,
  getDefaultContentScaleForState,
  type ContentScaleForStateFn,
  type InteractionState,
} from '@wearables-ui-toolkit/foundation/base/Interactions';
import { useComposedRef } from '@wearables-ui-toolkit/foundation/utils/useComposedRef';
import type { IconSource } from '@wearables-ui-toolkit/foundation/components/IconImage';
import { MaterialLibrary } from '@wearables-ui-toolkit/foundation/material/MaterialLibrary';
import type { ContainerMaterial } from '@wearables-ui-toolkit/foundation/material/ContainerMaterial';
import { setTextInputMaterialLoading } from '@wearables-ui-toolkit/foundation/material/TextInputContainerMaterial';
import { Container } from '@wearables-ui-toolkit/foundation/components/Container';
import { withPreRecordedFocusChange } from '@wearables-ui-toolkit/foundation/base/InteractableFastScrollTracker';
import {
  AnimationDurations,
  DEFAULT_MOTION_FRAME_TIME_MS,
} from '@wearables-ui-toolkit/foundation/motion/Animations';
import { usePrefersReducedMotion } from '@wearables-ui-toolkit/foundation/motion/usePrefersReducedMotion';
import {
  SCROLL_VIEW_NAVIGATION_REQUEST_EVENT,
  SCROLL_VIEW_SELECTOR,
  type FocusNavigationDirection,
} from '@wearables-ui-toolkit/foundation/base/FocusNavigationEvents';
import { Button, type ButtonHandle } from './Button';
import { IndeterminateLoader, IndeterminateLoaderSize } from './IndeterminateLoader';
import { getInputTextViewScrollState } from './InputTextViewLayout';
import type { InputTextViewScrollState } from './InputTextViewLayout.types';
import {
  INPUT_TEXT_VIEW_ACTION_BUTTON_GAP,
  INPUT_TEXT_VIEW_ACTION_BUTTON_SIZE,
  INPUT_TEXT_VIEW_HORIZONTAL_PADDING,
  INPUT_TEXT_VIEW_LINE_HEIGHT,
  INPUT_TEXT_VIEW_MAX_LINES,
  INPUT_TEXT_VIEW_MIN_HEIGHT,
  INPUT_TEXT_VIEW_SINGLE_LINE_VERTICAL_PADDING,
  INPUT_TEXT_VIEW_VERTICAL_PADDING,
} from './InputTextViewMetrics';
import type { InputTextViewInputProps } from './InputTextView.types';
import styles from './InputTextView.module.css';

const INITIAL_SCROLL_STATE: InputTextViewScrollState = {
  isScrollable: false,
  showTopFade: false,
  showBottomFade: false,
  scrollRatio: 0,
  viewportRatio: 1,
};

interface IntendedTextAreaScroll {
  direction: 'up' | 'down';
  top: number;
}

type InputTextViewFocusOwner = 'text' | 'action' | null;

type ScrollbarStyle = CSSProperties & {
  '--uit-input-text-view-scroll-ratio': number;
  '--uit-input-text-view-viewport-ratio': number;
};

interface ScrollViewNavigationRequestDetail {
  consumeBoundaryAlignment: true;
  direction: FocusNavigationDirection;
  handled: boolean;
  origin: Element;
}

interface InputTextViewFrameProps {
  rootProps: HTMLAttributes<HTMLDivElement>;
  className: string;
  style: CSSProperties;
  material: ContainerMaterial;
  containerWidth: CSSProperties['width'];
  textAreaRef: RefObject<HTMLTextAreaElement | null>;
  showAccessory: boolean;
  showActionButton: boolean;
  enterSubmissionEnabled: boolean;
  measureEmptyWidth: boolean;
  editAreaStyle: CSSProperties;
  value: string;
  hint: string;
  showLoader: boolean;
  loadingLabel: string;
  actionIcon: IconSource;
  actionLabel: string;
  actionButtonMaterial?: ContainerMaterial;
  inputProps: InputTextViewInputProps;
  onTextChange: (nextText: string) => void;
  onKeyDown: KeyboardEventHandler<HTMLTextAreaElement>;
  onSend: () => void;
}

function areScrollStatesEqual(
  first: InputTextViewScrollState,
  second: InputTextViewScrollState,
): boolean {
  return first.isScrollable === second.isScrollable &&
    first.showTopFade === second.showTopFade &&
    first.showBottomFade === second.showBottomFade &&
    first.scrollRatio === second.scrollRatio &&
    first.viewportRatio === second.viewportRatio;
}

function pixelValue(value: string, fallback: number): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function measureRenderedHintWidth(
  textArea: HTMLTextAreaElement,
  hint: string,
): number | null {
  const computedStyle = window.getComputedStyle(textArea);
  const ruler = document.createElement('span');
  Object.assign(ruler.style, {
    position: 'fixed',
    left: '-10000px',
    top: '0',
    visibility: 'hidden',
    whiteSpace: 'pre',
    fontFamily: computedStyle.fontFamily,
    fontSize: computedStyle.fontSize,
    fontStyle: computedStyle.fontStyle,
    fontWeight: computedStyle.fontWeight,
    fontStretch: computedStyle.fontStretch,
    letterSpacing: computedStyle.letterSpacing,
    direction: computedStyle.direction,
    unicodeBidi: computedStyle.unicodeBidi,
  });
  ruler.textContent = hint || ' ';
  document.body.appendChild(ruler);
  const measuredWidth = ruler.getBoundingClientRect().width;
  ruler.remove();
  return measuredWidth > 0
    ? Math.ceil(measuredWidth + INPUT_TEXT_VIEW_HORIZONTAL_PADDING * 2)
    : null;
}

function requestParentScrollForClippedTextArea(
  textArea: HTMLTextAreaElement,
  direction: 'up' | 'down',
): boolean {
  const scrollView = textArea.closest(SCROLL_VIEW_SELECTOR);
  if (!(scrollView instanceof HTMLElement)) {
    return false;
  }

  const textAreaRect = textArea.getBoundingClientRect();
  const scrollViewRect = scrollView.getBoundingClientRect();
  const viewportBottom = scrollViewRect.height > 0
    ? scrollViewRect.bottom
    : scrollViewRect.top + scrollView.clientHeight;
  const clippedAtTop = textAreaRect.top < scrollViewRect.top;
  const clippedAtBottom = textAreaRect.bottom > viewportBottom;
  const shouldRestoreInDirection =
    (direction === 'up' && clippedAtTop) ||
    (direction === 'down' && clippedAtBottom);
  if (!shouldRestoreInDirection) {
    return false;
  }

  const detail: ScrollViewNavigationRequestDetail = {
    consumeBoundaryAlignment: true,
    direction,
    handled: false,
    origin: textArea,
  };
  scrollView.dispatchEvent(new CustomEvent<ScrollViewNavigationRequestDetail>(
    SCROLL_VIEW_NAVIGATION_REQUEST_EVENT,
    { cancelable: true, detail },
  ));
  return detail.handled;
}

/** Internal frame for the text-entry surface. */
export const InputTextViewFrame = memo(forwardRef<HTMLDivElement, InputTextViewFrameProps>(
  function InputTextViewFrame(
    {
      rootProps,
      className,
      style,
      material,
      containerWidth,
      textAreaRef,
      showAccessory,
      showActionButton,
      enterSubmissionEnabled,
      measureEmptyWidth,
      editAreaStyle,
      value,
      hint,
      showLoader,
      loadingLabel,
      actionIcon,
      actionLabel,
      actionButtonMaterial: actionButtonMaterialProp,
      inputProps,
      onTextChange,
      onKeyDown,
      onSend,
    },
    ref,
  ) {
    const [focusOwner, setFocusOwner] = useState<InputTextViewFocusOwner>(null);
    const [isTextAreaPressed, setIsTextAreaPressed] = useState(false);
    const [isSingleLine, setIsSingleLine] = useState(true);
    const [measuredEmptyWidth, setMeasuredEmptyWidth] = useState<number | null>(null);
    const isSingleLineRef = useRef(true);
    const [scrollState, setScrollState] = useState(INITIAL_SCROLL_STATE);
    const rootRef = useRef<HTMLDivElement>(null);
    const setRootRef = useComposedRef(ref, rootRef);
    const actionButtonRef = useRef<ButtonHandle>(null);
    const intendedTextAreaScrollRef = useRef<IntendedTextAreaScroll | null>(null);
    const lastWrittenTextAreaScrollTopRef = useRef<number | null>(null);
    const textAreaScrollTimerRef = useRef<number | null>(null);
    const observedWidthRef = useRef<number | null>(null);
    const prefersReducedMotion = usePrefersReducedMotion();
    const actionButtonMaterial = useMemo(
      () => actionButtonMaterialProp ?? MaterialLibrary.outboundMessage(),
      [actionButtonMaterialProp],
    );
    const contentScaleForState = useCallback<ContentScaleForStateFn>(
      (state, containerSize) => {
        const parentWidth = rootRef.current?.getBoundingClientRect().width ?? 0;
        return getDefaultContentScaleForState(state, {
          ...containerSize,
          width: parentWidth > 0 ? parentWidth : containerSize.width,
        });
      },
      [],
    );
    const {
      onFocus: onInputFocus,
      onBlur: onInputBlur,
      onPointerDown: onInputPointerDown,
      onPointerUp: onInputPointerUp,
      onPointerCancel: onInputPointerCancel,
      onPointerLeave: onInputPointerLeave,
      onScroll: onInputScroll,
      onSelect: onInputSelect,
      disabled: inputDisabled,
      'aria-label': inputAriaLabel,
      enterKeyHint: inputEnterKeyHint,
      ...restInputProps
    } = inputProps;
    const interactionStateOverride = useMemo<InteractionState>(
      () => ({
        state: isTextAreaPressed
          ? State.PRESSED
          : focusOwner === 'text'
            ? State.FOCUSED
            : State.DEFAULT,
        isDisabled: inputDisabled ?? false,
      }),
      [focusOwner, inputDisabled, isTextAreaPressed],
    );
    const verticalPadding = isSingleLine
      ? INPUT_TEXT_VIEW_SINGLE_LINE_VERTICAL_PADDING
      : INPUT_TEXT_VIEW_VERTICAL_PADDING;
    const resolvedContainerWidth = measureEmptyWidth && measuredEmptyWidth != null
      ? measuredEmptyWidth
      : containerWidth;
    const resolvedEditAreaStyle = useMemo<CSSProperties>(
      () => ({
        ...editAreaStyle,
        lineHeight: `${INPUT_TEXT_VIEW_LINE_HEIGHT}px`,
        paddingTop: verticalPadding,
        paddingBottom: verticalPadding,
      }),
      [editAreaStyle, verticalPadding],
    );

    const updateScrollState = useCallback(() => {
      const textArea = textAreaRef.current;
      if (textArea == null) {
        return;
      }

      const nextState = getInputTextViewScrollState({
        scrollTop: textArea.scrollTop,
        scrollHeight: textArea.scrollHeight,
        clientHeight: textArea.clientHeight,
      });
      setScrollState(previous =>
        areScrollStatesEqual(previous, nextState) ? previous : nextState
      );
    }, [textAreaRef]);

    const cancelTextAreaScrollAnimation = useCallback(() => {
      if (textAreaScrollTimerRef.current != null) {
        window.clearTimeout(textAreaScrollTimerRef.current);
        textAreaScrollTimerRef.current = null;
      }
      lastWrittenTextAreaScrollTopRef.current = null;
    }, []);

    const syncTextAreaLayout = useCallback(() => {
      const textArea = textAreaRef.current;
      if (textArea == null) {
        return;
      }

      const lineHeight = INPUT_TEXT_VIEW_LINE_HEIGHT;
      const currentVerticalPadding = isSingleLineRef.current
        ? INPUT_TEXT_VIEW_SINGLE_LINE_VERTICAL_PADDING
        : INPUT_TEXT_VIEW_VERTICAL_PADDING;
      const maximumHeight =
        lineHeight * INPUT_TEXT_VIEW_MAX_LINES + INPUT_TEXT_VIEW_VERTICAL_PADDING * 2;
      const scrollTop = textArea.scrollTop;

      textArea.style.height = 'auto';
      const previousMinHeight = textArea.style.minHeight;
      textArea.style.minHeight = '0';
      const intrinsicScrollHeight = textArea.scrollHeight;
      textArea.style.minHeight = previousMinHeight;
      const contentHeight = Math.max(
        0,
        intrinsicScrollHeight - currentVerticalPadding * 2,
      );
      const nextIsSingleLine = contentHeight <= lineHeight + 1;
      const nextVerticalPadding = nextIsSingleLine
        ? INPUT_TEXT_VIEW_SINGLE_LINE_VERTICAL_PADDING
        : INPUT_TEXT_VIEW_VERTICAL_PADDING;
      const correctedScrollHeight = contentHeight + nextVerticalPadding * 2;
      const nextHeight = Math.min(
        Math.max(correctedScrollHeight, INPUT_TEXT_VIEW_MIN_HEIGHT),
        maximumHeight,
      );
      const renderedHeight = Math.ceil(nextHeight);
      textArea.style.paddingTop = `${nextVerticalPadding}px`;
      textArea.style.paddingBottom = `${nextVerticalPadding}px`;
      textArea.style.height = `${renderedHeight}px`;

      isSingleLineRef.current = nextIsSingleLine;
      setIsSingleLine(previous =>
        previous === nextIsSingleLine ? previous : nextIsSingleLine
      );
      const nextScrollTop = Math.min(
        scrollTop,
        Math.max(Math.ceil(correctedScrollHeight) - renderedHeight, 0),
      );
      textArea.scrollTop = nextScrollTop;
      const nextScrollState = getInputTextViewScrollState({
        scrollTop: nextScrollTop,
        scrollHeight: Math.ceil(correctedScrollHeight),
        clientHeight: renderedHeight,
      });
      setScrollState(previous =>
        areScrollStatesEqual(previous, nextScrollState) ? previous : nextScrollState
      );
    }, [textAreaRef]);

    const syncMeasuredEmptyWidth = useCallback(() => {
      if (!measureEmptyWidth) {
        setMeasuredEmptyWidth(null);
        return;
      }
      const textArea = textAreaRef.current;
      if (textArea == null) {
        return;
      }
      const measuredWidth = measureRenderedHintWidth(textArea, hint);
      if (measuredWidth != null) {
        const rootWidth = rootRef.current?.getBoundingClientRect().width ?? 0;
        const actionReservation = showActionButton
          ? INPUT_TEXT_VIEW_ACTION_BUTTON_SIZE + INPUT_TEXT_VIEW_ACTION_BUTTON_GAP
          : 0;
        const availableWidth = rootWidth - actionReservation;
        const nextWidth = availableWidth > 0
          ? Math.min(measuredWidth, availableWidth)
          : measuredWidth;
        setMeasuredEmptyWidth(previous => previous === nextWidth ? previous : nextWidth);
      }
    }, [hint, measureEmptyWidth, showActionButton, textAreaRef]);

    useLayoutEffect(() => {
      syncMeasuredEmptyWidth();
    }, [syncMeasuredEmptyWidth]);

    useEffect(() => {
      const fonts = document.fonts;
      if (fonts == null) {
        return;
      }
      let cancelled = false;
      const handleFontsChanged = () => {
        if (cancelled) {
          return;
        }
        cancelTextAreaScrollAnimation();
        intendedTextAreaScrollRef.current = null;
        syncMeasuredEmptyWidth();
        syncTextAreaLayout();
      };
      void fonts.ready.then(handleFontsChanged);
      fonts.addEventListener('loadingdone', handleFontsChanged);
      return () => {
        cancelled = true;
        fonts.removeEventListener('loadingdone', handleFontsChanged);
      };
    }, [cancelTextAreaScrollAnimation, syncMeasuredEmptyWidth, syncTextAreaLayout]);

    useLayoutEffect(() => {
      setTextInputMaterialLoading(
        material,
        showLoader && !prefersReducedMotion,
      );
      return () => setTextInputMaterialLoading(material, false);
    }, [material, prefersReducedMotion, showLoader]);

    useLayoutEffect(() => {
      cancelTextAreaScrollAnimation();
      intendedTextAreaScrollRef.current = null;
      syncTextAreaLayout();
    }, [
      cancelTextAreaScrollAnimation,
      hint,
      showAccessory,
      syncTextAreaLayout,
      value,
    ]);

    useLayoutEffect(() => {
      const textArea = textAreaRef.current;
      if (textArea == null || typeof ResizeObserver === 'undefined') {
        return;
      }

      observedWidthRef.current = textArea.getBoundingClientRect().width;
      const observer = new ResizeObserver(entries => {
        const width = entries[0]?.contentRect.width;
        if (width == null || width === observedWidthRef.current) {
          return;
        }
        observedWidthRef.current = width;
        cancelTextAreaScrollAnimation();
        intendedTextAreaScrollRef.current = null;
        syncMeasuredEmptyWidth();
        syncTextAreaLayout();
      });
      observer.observe(textArea);
      return () => observer.disconnect();
    }, [
      cancelTextAreaScrollAnimation,
      syncMeasuredEmptyWidth,
      syncTextAreaLayout,
      textAreaRef,
    ]);

    const animateTextAreaScroll = useCallback((
      textArea: HTMLTextAreaElement,
      targetScrollTop: number,
    ) => {
      cancelTextAreaScrollAnimation();
      const startScrollTop = textArea.scrollTop;
      lastWrittenTextAreaScrollTopRef.current = startScrollTop;
      if (prefersReducedMotion || startScrollTop === targetScrollTop) {
        textArea.scrollTop = targetScrollTop;
        lastWrittenTextAreaScrollTopRef.current = null;
        intendedTextAreaScrollRef.current = null;
        updateScrollState();
        return;
      }

      const frameCount = Math.max(
        1,
        Math.ceil(
          AnimationDurations.CONTAINER_STATE_CHANGE_FAST_FOCUS /
            DEFAULT_MOTION_FRAME_TIME_MS,
        ),
      );
      let frame = 0;
      const tick = () => {
        const lastWrittenScrollTop = lastWrittenTextAreaScrollTopRef.current;
        if (
          lastWrittenScrollTop == null ||
          Math.abs(textArea.scrollTop - lastWrittenScrollTop) > 1
        ) {
          textAreaScrollTimerRef.current = null;
          lastWrittenTextAreaScrollTopRef.current = null;
          intendedTextAreaScrollRef.current = null;
          updateScrollState();
          return;
        }
        frame += 1;
        const progress = Math.min(1, frame / frameCount);
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        textArea.scrollTop =
          startScrollTop + (targetScrollTop - startScrollTop) * easedProgress;
        lastWrittenTextAreaScrollTopRef.current = textArea.scrollTop;
        updateScrollState();
        if (progress < 1) {
          textAreaScrollTimerRef.current = window.setTimeout(
            tick,
            DEFAULT_MOTION_FRAME_TIME_MS,
          );
        } else {
          textAreaScrollTimerRef.current = null;
          lastWrittenTextAreaScrollTopRef.current = null;
          intendedTextAreaScrollRef.current = null;
        }
      };
      textAreaScrollTimerRef.current = window.setTimeout(
        tick,
        DEFAULT_MOTION_FRAME_TIME_MS,
      );
    }, [cancelTextAreaScrollAnimation, prefersReducedMotion, updateScrollState]);

    useEffect(() => () => {
      cancelTextAreaScrollAnimation();
      intendedTextAreaScrollRef.current = null;
    }, [cancelTextAreaScrollAnimation]);

    const focusTextArea = useCallback(() => {
      textAreaRef.current?.focus({ preventScroll: true });
    }, [textAreaRef]);
    const handleContainerClick = useCallback(() => {
      if (!inputDisabled) {
        focusTextArea();
      }
    }, [focusTextArea, inputDisabled]);
    const handleContainerFocus = useCallback((event: FocusEvent<HTMLElement>) => {
      if (event.target === event.currentTarget && !inputDisabled) {
        focusTextArea();
      }
    }, [focusTextArea, inputDisabled]);
    const handleTextAreaChange: ChangeEventHandler<HTMLTextAreaElement> = useCallback((event) => {
      onTextChange(event.currentTarget.value);
    }, [onTextChange]);
    const handleTextAreaFocus = useCallback((event: FocusEvent<HTMLTextAreaElement>) => {
      setFocusOwner('text');
      onInputFocus?.(event);
    }, [onInputFocus]);
    const handleTextAreaBlur = useCallback((event: FocusEvent<HTMLTextAreaElement>) => {
      cancelTextAreaScrollAnimation();
      intendedTextAreaScrollRef.current = null;
      if (event.relatedTarget !== actionButtonRef.current?.getElement()) {
        setFocusOwner(null);
      }
      setIsTextAreaPressed(false);
      onInputBlur?.(event);
    }, [cancelTextAreaScrollAnimation, onInputBlur]);
    const handleTextAreaPointerDown = useCallback((event: PointerEvent<HTMLTextAreaElement>) => {
      setIsTextAreaPressed(true);
      onInputPointerDown?.(event);
      if (!event.defaultPrevented) {
        event.preventDefault();
        event.currentTarget.focus({ preventScroll: true });
      }
    }, [onInputPointerDown]);
    const handleTextAreaPointerUp = useCallback((event: PointerEvent<HTMLTextAreaElement>) => {
      setIsTextAreaPressed(false);
      onInputPointerUp?.(event);
    }, [onInputPointerUp]);
    const handleTextAreaPointerCancel = useCallback((event: PointerEvent<HTMLTextAreaElement>) => {
      setIsTextAreaPressed(false);
      onInputPointerCancel?.(event);
    }, [onInputPointerCancel]);
    const handleTextAreaPointerLeave = useCallback((event: PointerEvent<HTMLTextAreaElement>) => {
      setIsTextAreaPressed(false);
      onInputPointerLeave?.(event);
    }, [onInputPointerLeave]);
    const handleTextAreaScroll = useCallback((event: UIEvent<HTMLTextAreaElement>) => {
      const lastWrittenScrollTop = lastWrittenTextAreaScrollTopRef.current;
      if (
        textAreaScrollTimerRef.current != null &&
        lastWrittenScrollTop != null &&
        Math.abs(event.currentTarget.scrollTop - lastWrittenScrollTop) > 1
      ) {
        cancelTextAreaScrollAnimation();
        intendedTextAreaScrollRef.current = null;
      }
      const intendedScroll = intendedTextAreaScrollRef.current;
      if (
        intendedScroll != null &&
        Math.abs(event.currentTarget.scrollTop - intendedScroll.top) <= 1
      ) {
        if (textAreaScrollTimerRef.current != null) {
          cancelTextAreaScrollAnimation();
        }
        intendedTextAreaScrollRef.current = null;
      }
      updateScrollState();
      onInputScroll?.(event);
    }, [cancelTextAreaScrollAnimation, onInputScroll, updateScrollState]);
    const handleTextAreaKeyDown: KeyboardEventHandler<HTMLTextAreaElement> = useCallback(
      (event) => {
        onKeyDown(event);
        if (event.defaultPrevented) {
          return;
        }

        const actionButton = actionButtonRef.current?.getElement();
        if (
          (event.key === 'ArrowLeft' || event.key === 'ArrowRight') &&
          value.length > 0 &&
          !inputDisabled &&
          actionButton != null
        ) {
          const actionDirectionKey = rootRef.current != null &&
              window.getComputedStyle(rootRef.current).direction === 'rtl'
            ? 'ArrowLeft'
            : 'ArrowRight';
          if (event.key !== actionDirectionKey) {
            return;
          }
          event.preventDefault();
          event.stopPropagation();
          withPreRecordedFocusChange(() => {
            actionButton.focus({ preventScroll: true });
          });
          return;
        }

        const textArea = event.currentTarget;
        const direction = event.key === 'ArrowUp'
          ? 'up'
          : event.key === 'ArrowDown'
            ? 'down'
            : null;
        if (direction == null) {
          return;
        }
        if (requestParentScrollForClippedTextArea(textArea, direction)) {
          cancelTextAreaScrollAnimation();
          intendedTextAreaScrollRef.current = null;
          event.preventDefault();
          event.stopPropagation();
          return;
        }

        const maximumScrollTop = Math.max(
          0,
          textArea.scrollHeight - textArea.clientHeight,
        );
        let intendedScroll = intendedTextAreaScrollRef.current;
        if (intendedScroll != null && intendedScroll.direction !== direction) {
          cancelTextAreaScrollAnimation();
          intendedTextAreaScrollRef.current = null;
          intendedScroll = null;
        }
        const baseScrollTop = intendedScroll?.top ?? textArea.scrollTop;
        const isScrollingUp = direction === 'up' && baseScrollTop > 0;
        const isScrollingDown =
          direction === 'down' && baseScrollTop < maximumScrollTop;
        if (!isScrollingUp && !isScrollingDown) {
          if (
            intendedScroll != null &&
            Math.abs(textArea.scrollTop - intendedScroll.top) > 1
          ) {
            event.preventDefault();
            event.stopPropagation();
          }
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        const computedStyle = window.getComputedStyle(textArea);
        const lineHeight = pixelValue(
          computedStyle.lineHeight,
          INPUT_TEXT_VIEW_LINE_HEIGHT,
        );
        const scrollDelta = isScrollingUp ? -lineHeight : lineHeight;
        const nextScrollTop = Math.min(
          maximumScrollTop,
          Math.max(0, baseScrollTop + scrollDelta),
        );
        intendedTextAreaScrollRef.current = {
          direction,
          top: nextScrollTop,
        };
        animateTextAreaScroll(textArea, nextScrollTop);
      },
      [
        animateTextAreaScroll,
        cancelTextAreaScrollAnimation,
        inputDisabled,
        onKeyDown,
        value.length,
      ],
    );
    const handleActionFocus = useCallback(() => {
      setFocusOwner('action');
    }, []);
    const handleActionBlur = useCallback((event: FocusEvent<HTMLDivElement>) => {
      setFocusOwner(
        event.relatedTarget === textAreaRef.current ? 'text' : null,
      );
    }, [textAreaRef]);
    const handleActionKeyDown: KeyboardEventHandler<HTMLDivElement> = useCallback(
      (event) => {
        if (
          inputDisabled ||
          (
            event.key !== 'ArrowLeft' &&
            event.key !== 'ArrowRight' &&
            event.key !== 'ArrowUp'
          )
        ) {
          return;
        }
        if (event.key !== 'ArrowUp') {
          const returnDirectionKey = rootRef.current != null &&
              window.getComputedStyle(rootRef.current).direction === 'rtl'
            ? 'ArrowRight'
            : 'ArrowLeft';
          if (event.key !== returnDirectionKey) {
            return;
          }
        }

        const textArea = textAreaRef.current;
        if (textArea == null || textArea.disabled) {
          return;
        }
        flushSync(() => {
          setFocusOwner('text');
        });
        withPreRecordedFocusChange(() => {
          textArea.focus({ preventScroll: true });
        });
        if (document.activeElement === textArea) {
          event.preventDefault();
          event.stopPropagation();
        }
      },
      [inputDisabled, textAreaRef],
    );
    const handleActionClick = useCallback((event: MouseEvent<HTMLDivElement>) => {
      event.stopPropagation();
      onSend();
    }, [onSend]);

    const rootClassName = useMemo(
      () => `${styles.inputTextView} ${className}`,
      [className],
    );
    const fadeClassName = scrollState.showTopFade && scrollState.showBottomFade
      ? styles.editAreaFadeBoth
      : scrollState.showTopFade
        ? styles.editAreaFadeTop
        : scrollState.showBottomFade
          ? styles.editAreaFadeBottom
          : '';
    const editAreaClassName = useMemo(
      () => [
        styles.editArea,
        showAccessory ? styles.editAreaWithAccessory : '',
        scrollState.isScrollable ? styles.editAreaScrollable : '',
        fadeClassName,
      ].filter(Boolean).join(' '),
      [fadeClassName, scrollState.isScrollable, showAccessory],
    );
    const scrollbarClassName = styles.scrollbar;
    const scrollbarStyle = useMemo<ScrollbarStyle>(
      () => ({
        '--uit-input-text-view-scroll-ratio': scrollState.scrollRatio,
        '--uit-input-text-view-viewport-ratio': scrollState.viewportRatio,
      }),
      [scrollState.scrollRatio, scrollState.viewportRatio],
    );

    return (
      <div
        {...rootProps}
        ref={setRootRef}
        className={rootClassName}
        style={style}
        data-uit-focus-section="true"
      >
        <Container
          className={styles.container}
          material={material}
          width={resolvedContainerWidth}
          clipContent
          interactionStateOverride={interactionStateOverride}
          contentScaleForStateFn={contentScaleForState}
          tabIndex={-1}
          role="group"
          onClick={handleContainerClick}
          onFocus={handleContainerFocus}
        >
          <div className={styles.content}>
            <textarea
              {...restInputProps}
              ref={textAreaRef}
              className={editAreaClassName}
              style={resolvedEditAreaStyle}
              value={value}
              placeholder={hint}
              rows={1}
              disabled={inputDisabled}
              enterKeyHint={inputEnterKeyHint ?? (enterSubmissionEnabled ? 'send' : undefined)}
              onChange={handleTextAreaChange}
              onFocus={handleTextAreaFocus}
              onBlur={handleTextAreaBlur}
              onPointerDown={handleTextAreaPointerDown}
              onPointerUp={handleTextAreaPointerUp}
              onPointerCancel={handleTextAreaPointerCancel}
              onPointerLeave={handleTextAreaPointerLeave}
              onScroll={handleTextAreaScroll}
              onSelect={onInputSelect}
              onKeyDown={handleTextAreaKeyDown}
              aria-label={inputAriaLabel ?? hint}
            />
            {scrollState.isScrollable && (
              <span
                className={scrollbarClassName}
                style={scrollbarStyle}
                data-uit-input-scrollbar=""
                aria-hidden="true"
              >
                <span className={styles.scrollbarThumb} />
              </span>
            )}
            {showAccessory && showLoader && (
              <span className={styles.accessoryWrapper}>
                <IndeterminateLoader
                  className={styles.loader}
                  size={IndeterminateLoaderSize.LARGE}
                  aria-label={loadingLabel}
                />
              </span>
            )}
          </div>
        </Container>
        {showActionButton && (
          <Button
            ref={actionButtonRef}
            className={styles.actionButton}
            width={INPUT_TEXT_VIEW_ACTION_BUTTON_SIZE}
            material={actionButtonMaterial}
            icon={actionIcon}
            disabled={inputDisabled || value.length === 0}
            tabIndex={inputDisabled || value.length === 0 ? -1 : 0}
            onFocus={handleActionFocus}
            onBlur={handleActionBlur}
            onKeyDown={handleActionKeyDown}
            onClick={handleActionClick}
            aria-label={actionLabel}
          />
        )}
      </div>
    );
  },
));
