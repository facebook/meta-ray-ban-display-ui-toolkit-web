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
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
  type Ref,
} from 'react';
import {
  TextColor,
  TextStyle,
  TextView,
} from '@wearables-ui-toolkit/foundation/components/TextView';
import { DEFAULT_READ_MORE_TEXT_VIEW_MAX_LINES } from './private/ReadMoreTextViewMetrics';
import styles from './ReadMoreTextView.module.css';

export interface ReadMoreTextViewProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onChange'> {
  /** Text content rendered inside the clamped text view. */
  children?: ReactNode;

  /** Maximum visible lines before the read-more affordance appears. */
  maxLines?: number;

  /** Text appearance used by both the content and read-more label. */
  textStyle?: TextStyle;

  /** Semantic text color used by the content. */
  textColor?: TextColor;

  /** Additional class applied to the clamped text element. */
  textClassName?: string;

  /** Inline styles applied to the clamped text element. */
  textStyleOverride?: CSSProperties;

  /** Localized read-more label. */
  readMoreLabel: string;

  /**
   * Called when the read-more affordance visibility changes. The unchanged
   * initial hidden state is not reported.
   */
  onReadMoreVisibilityChange?: (isShowingReadMore: boolean) => void;
}

/**
 * Imperative handle for {@link ReadMoreTextView}.
 *
 * Exposes whether the read-more affordance is currently shown.
 */
export interface ReadMoreTextViewHandle {
  /** Returns whether the read-more affordance is currently shown (text overflowing). */
  isShowingReadMore: () => boolean;

  /**
   * The root DOM element of the text view, for consumers that need direct
   * access to the underlying `HTMLDivElement`. Null before mount / after
   * unmount.
   */
  getElement: () => HTMLDivElement | null;
}

const DEFAULT_STYLE: CSSProperties = {};
const OVERFLOW_EPSILON_PX = 1;

function isElementOverflowing(element: HTMLElement): boolean {
  // Vertical (line-count) overflow only: the content height exceeds the clamped
  // height. Horizontal scrollWidth is not an overflow signal for the read-more
  // clamp.
  return element.scrollHeight > element.clientHeight + OVERFLOW_EPSILON_PX;
}

export const ReadMoreTextView = memo(forwardRef<ReadMoreTextViewHandle, ReadMoreTextViewProps>(
  function ReadMoreTextView(
    {
      children,
      maxLines = DEFAULT_READ_MORE_TEXT_VIEW_MAX_LINES,
      textStyle = TextStyle.META1,
      textColor = TextColor.SECONDARY,
      textClassName = '',
      textStyleOverride = DEFAULT_STYLE,
      readMoreLabel,
      onReadMoreVisibilityChange,
      className = '',
      style = DEFAULT_STYLE,
      ...htmlProps
    },
    ref,
  ) {
    const rootRef = useRef<HTMLDivElement | null>(null);
    const textRef = useRef<HTMLElement | null>(null);
    const readMoreAffordanceRef = useRef<HTMLSpanElement | null>(null);
    const [isShowingReadMore, setIsShowingReadMore] = useState(false);
    const [readMoreAffordanceWidth, setReadMoreAffordanceWidth] = useState(0);
    const isShowingReadMoreRef = useRef(isShowingReadMore);
    const visibilityChangeCallbackRef = useRef(onReadMoreVisibilityChange);
    const lastNotifiedVisibilityRef = useRef(false);
    isShowingReadMoreRef.current = isShowingReadMore;
    visibilityChangeCallbackRef.current = onReadMoreVisibilityChange;

    useImperativeHandle(
      ref,
      (): ReadMoreTextViewHandle => ({
        isShowingReadMore: () => isShowingReadMoreRef.current,
        getElement: () => rootRef.current,
      }),
      [],
    );

    useLayoutEffect(() => {
      const textElement = textRef.current;
      if (textElement == null) {
        setIsShowingReadMore(false);
        return;
      }

      const updateOverflow = () => {
        const nextIsOverflowing = isElementOverflowing(textElement);
        setIsShowingReadMore(previous =>
          previous === nextIsOverflowing ? previous : nextIsOverflowing
        );
      };

      updateOverflow();
      if (typeof ResizeObserver === 'undefined') {
        return;
      }

      const observer = new ResizeObserver(updateOverflow);
      observer.observe(textElement);
      return () => observer.disconnect();
    }, [
      children,
      maxLines,
      textStyle,
      textStyleOverride,
    ]);

    useLayoutEffect(() => {
      if (lastNotifiedVisibilityRef.current === isShowingReadMore) {
        return;
      }
      lastNotifiedVisibilityRef.current = isShowingReadMore;
      visibilityChangeCallbackRef.current?.(isShowingReadMore);
    }, [isShowingReadMore]);

    useLayoutEffect(() => {
      const affordanceElement = readMoreAffordanceRef.current;
      if (!isShowingReadMore || affordanceElement == null) {
        setReadMoreAffordanceWidth(0);
        return;
      }

      const updateAffordanceWidth = () => {
        const nextWidth = affordanceElement.getBoundingClientRect().width;
        setReadMoreAffordanceWidth(previous =>
          previous === nextWidth ? previous : nextWidth
        );
      };

      updateAffordanceWidth();
      if (typeof ResizeObserver === 'undefined') {
        return;
      }

      const observer = new ResizeObserver(updateAffordanceWidth);
      observer.observe(affordanceElement);
      return () => observer.disconnect();
    }, [isShowingReadMore, readMoreLabel, textStyle]);

    const rootClassName = useMemo(
      () => `${styles.root} ${className}`,
      [className],
    );
    const textClass = useMemo(
      () =>
        `${styles.text} ${
          isShowingReadMore ? styles.textWithReadMore : ''
        } ${textClassName}`,
      [isShowingReadMore, textClassName],
    );
    const rootStyle = useMemo<CSSProperties>(
      () => ({
        ...style,
        '--uit-read-more-text-view-affordance-width': `${readMoreAffordanceWidth}px`,
      } as CSSProperties),
      [readMoreAffordanceWidth, style],
    );
    const textStyleWithClamp = useMemo<CSSProperties>(
      () => ({
        '--uit-read-more-text-view-max-lines': maxLines,
        paddingBlock: 0,
        ...textStyleOverride,
      } as CSSProperties),
      [maxLines, textStyleOverride],
    );

    return (
      <div
        ref={rootRef}
        className={rootClassName}
        style={rootStyle}
        {...htmlProps}
      >
        <TextView
          ref={textRef as Ref<HTMLSpanElement>}
          as="p"
          className={textClass}
          style={textStyleWithClamp}
          textStyle={textStyle}
          textColor={textColor}
        >
          {children}
        </TextView>
        {isShowingReadMore && (
          <span
            ref={readMoreAffordanceRef}
            className={styles.readMoreAffordance}
            aria-hidden="true"
          >
            <TextView
              as="span"
              className={styles.readMoreText}
              textStyle={textStyle}
              textColor={TextColor.PLACEHOLDER}
            >
              {readMoreLabel}
            </TextView>
          </span>
        )}
      </div>
    );
  },
));

export { DEFAULT_READ_MORE_TEXT_VIEW_MAX_LINES } from './private/ReadMoreTextViewMetrics';
