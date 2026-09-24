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
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
  type PointerEvent,
} from 'react';
import { useComposedRef } from '@wearables-ui-toolkit/foundation/utils/useComposedRef';
import {
  TextColor,
  TextStyle,
  TextView,
} from '@wearables-ui-toolkit/foundation/components/TextView';
import { Scrim, ScrimPosition } from './Scrim';
import {
  ProgressIndicator,
  ProgressIndicatorSize,
} from './ProgressIndicator';
import { Tooltip, TooltipPosition } from './Tooltip';
import {
  ScrubberTimestampPosition,
  type ScrubberProps,
} from './Scrubber.types';
import {
  SCRUBBER_MAX_VALUE,
  SCRUBBER_MIN_VALUE,
  clampScrubberValue,
  formatScrubberTime,
  getScrubberAriaValueText,
  getScrubberElapsedSeconds,
  getScrubberKeyboardValue,
  getScrubberPointerValue,
  getScrubberTooltipText,
  normalizeScrubberDuration,
} from './private/ScrubberLayout';
import styles from './Scrubber.module.css';

export { ScrubberTimestampPosition } from './Scrubber.types';
export type { ScrubberProps } from './Scrubber.types';

const DEFAULT_STYLE: CSSProperties = {};
const SCRIM_STYLE: CSSProperties = {
  top: 'auto',
  right: 0,
  bottom: 0,
  left: 0,
  height: 120,
  background:
    'linear-gradient(to bottom, var(--uit-color-background-flat) 0%, var(--uit-color-background-inset) 27%, var(--uit-color-background-inset) 100%)',
  zIndex: 0,
};

function elementUsesRtl(element: HTMLElement): boolean {
  return getComputedStyle(element).direction === 'rtl';
}

function ScrubberTimestamps({
  elapsed,
  total,
  position,
}: {
  elapsed: string;
  total: string;
  position: ScrubberTimestampPosition;
}) {
  const positionClassName =
    position === ScrubberTimestampPosition.TOP
      ? styles.timestampsTop
      : styles.timestampsBottom;
  return (
    <div
      className={`${styles.timestamps} ${positionClassName}`}
      aria-hidden="true"
    >
      <TextView
        className={styles.timestamp}
        textStyle={TextStyle.META3}
        textColor={TextColor.SECONDARY}
      >
        {elapsed}
      </TextView>
      <TextView
        className={styles.timestamp}
        textStyle={TextStyle.META3}
        textColor={TextColor.SECONDARY}
      >
        {total}
      </TextView>
    </div>
  );
}

export const Scrubber = memo(forwardRef<HTMLDivElement, ScrubberProps>(
  function Scrubber(
    {
      value,
      durationSeconds = 0,
      showTooltip = false,
      hideScrim = false,
      timestampPosition = ScrubberTimestampPosition.BOTTOM,
      onValueChange,
      onValueChanged,
      disabled = false,
      className = '',
      style = DEFAULT_STYLE,
      tabIndex = 0,
      onFocus: onFocusProp,
      onBlur: onBlurProp,
      onKeyDown: onKeyDownProp,
      onKeyUp: onKeyUpProp,
      onPointerDown: onPointerDownProp,
      onPointerMove: onPointerMoveProp,
      onPointerUp: onPointerUpProp,
      onPointerCancel: onPointerCancelProp,
      onLostPointerCapture: onLostPointerCaptureProp,
      'aria-label': ariaLabel = 'Media position',
      ...rest
    },
    ref,
  ) {
    const rootRef = useRef<HTMLDivElement>(null);
    const trackRef = useRef<HTMLDivElement>(null);
    const handleRef = useRef<HTMLDivElement>(null);
    const setRootRef = useComposedRef(ref, rootRef);
    const activePointerIdRef = useRef<number | null>(null);
    const pointerGeometryRef = useRef<{
      trackLeft: number;
      trackWidth: number;
      rtl: boolean;
    } | null>(null);
    const latestInteractionValueRef = useRef(clampScrubberValue(value));
    const [isFocused, setIsFocused] = useState(false);
    const [isPointerActive, setIsPointerActive] = useState(false);

    const clampedValue = clampScrubberValue(value);
    useLayoutEffect(() => {
      if (activePointerIdRef.current == null) {
        latestInteractionValueRef.current = clampedValue;
      }
    }, [clampedValue]);
    const duration = normalizeScrubberDuration(durationSeconds);
    const elapsedText = formatScrubberTime(
      getScrubberElapsedSeconds(clampedValue, duration),
    );
    const totalText = formatScrubberTime(duration);
    const tooltipText = getScrubberTooltipText(clampedValue, duration);
    const ariaValueText = getScrubberAriaValueText(clampedValue, duration);
    const interactionActive = !disabled && (isFocused || isPointerActive);

    const rootStyle = useMemo(
      () => ({
        ...style,
        '--uit-scrubber-offset': `${clampedValue}cqw`,
        '--uit-scrubber-value': clampedValue,
      }) as CSSProperties,
      [clampedValue, style],
    );

    const emitPointerValue = useCallback(
      (clientX: number) => {
        const geometry = pointerGeometryRef.current;
        if (geometry == null) {
          return;
        }
        const nextValue = getScrubberPointerValue({
          clientX,
          ...geometry,
        });
        if (nextValue == null) {
          return;
        }
        latestInteractionValueRef.current = nextValue;
        onValueChange?.(nextValue);
      },
      [onValueChange],
    );

    const finishPointerInteraction = useCallback(
      (event: PointerEvent<HTMLDivElement>) => {
        if (activePointerIdRef.current !== event.pointerId) {
          return;
        }
        activePointerIdRef.current = null;
        pointerGeometryRef.current = null;
        setIsPointerActive(false);
        onValueChanged?.(latestInteractionValueRef.current);
        if (
          typeof event.currentTarget.hasPointerCapture === 'function' &&
          event.currentTarget.hasPointerCapture(event.pointerId)
        ) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
      },
      [onValueChanged],
    );

    const handleFocus = useCallback(
      (event: FocusEvent<HTMLDivElement>) => {
        onFocusProp?.(event);
        setIsFocused(true);
      },
      [onFocusProp],
    );

    const handleBlur = useCallback(
      (event: FocusEvent<HTMLDivElement>) => {
        onBlurProp?.(event);
        setIsFocused(false);
      },
      [onBlurProp],
    );

    const handleKeyDown = useCallback(
      (event: KeyboardEvent<HTMLDivElement>) => {
        onKeyDownProp?.(event);
        if (event.defaultPrevented || disabled) {
          return;
        }
        const nextValue = getScrubberKeyboardValue({
          value: latestInteractionValueRef.current,
          key: event.key,
          shiftKey: event.shiftKey,
          rtl: elementUsesRtl(event.currentTarget),
        });
        if (nextValue == null) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        if (nextValue === latestInteractionValueRef.current) {
          return;
        }
        latestInteractionValueRef.current = nextValue;
        onValueChange?.(nextValue);
        onValueChanged?.(nextValue);
      },
      [disabled, onKeyDownProp, onValueChange, onValueChanged],
    );

    const handlePointerDown = useCallback(
      (event: PointerEvent<HTMLDivElement>) => {
        onPointerDownProp?.(event);
        if (
          event.defaultPrevented ||
          disabled ||
          event.button !== 0 ||
          activePointerIdRef.current != null
        ) {
          return;
        }
        event.preventDefault();
        const track = trackRef.current;
        if (track == null) {
          return;
        }
        const trackRect = track.getBoundingClientRect();
        pointerGeometryRef.current = {
          trackLeft: trackRect.left,
          trackWidth: trackRect.width,
          rtl: elementUsesRtl(event.currentTarget),
        };
        activePointerIdRef.current = event.pointerId;
        setIsPointerActive(true);
        event.currentTarget.focus();
        event.currentTarget.setPointerCapture?.(event.pointerId);
        emitPointerValue(event.clientX);
      },
      [disabled, emitPointerValue, onPointerDownProp],
    );

    const handlePointerMove = useCallback(
      (event: PointerEvent<HTMLDivElement>) => {
        onPointerMoveProp?.(event);
        if (
          event.defaultPrevented ||
          activePointerIdRef.current !== event.pointerId
        ) {
          return;
        }
        emitPointerValue(event.clientX);
      },
      [emitPointerValue, onPointerMoveProp],
    );

    const handlePointerUp = useCallback(
      (event: PointerEvent<HTMLDivElement>) => {
        onPointerUpProp?.(event);
        finishPointerInteraction(event);
      },
      [finishPointerInteraction, onPointerUpProp],
    );

    const handlePointerCancel = useCallback(
      (event: PointerEvent<HTMLDivElement>) => {
        onPointerCancelProp?.(event);
        finishPointerInteraction(event);
      },
      [finishPointerInteraction, onPointerCancelProp],
    );

    const handleLostPointerCapture = useCallback(
      (event: PointerEvent<HTMLDivElement>) => {
        onLostPointerCaptureProp?.(event);
        if (activePointerIdRef.current === event.pointerId) {
          activePointerIdRef.current = null;
          pointerGeometryRef.current = null;
          setIsPointerActive(false);
          onValueChanged?.(latestInteractionValueRef.current);
        }
      },
      [onLostPointerCaptureProp, onValueChanged],
    );

    const rootClassName = `${styles.scrubber} ${className}`.trim();
    const timestamps = duration > 0
      ? (
          <ScrubberTimestamps
            elapsed={elapsedText}
            total={totalText}
            position={timestampPosition}
          />
        )
      : null;

    return (
      <div
        {...rest}
        ref={setRootRef}
        className={rootClassName}
        style={rootStyle}
        role="slider"
        tabIndex={disabled ? -1 : tabIndex}
        aria-label={ariaLabel}
        aria-orientation="horizontal"
        aria-valuemin={SCRUBBER_MIN_VALUE}
        aria-valuemax={SCRUBBER_MAX_VALUE}
        aria-valuenow={clampedValue}
        aria-valuetext={ariaValueText}
        aria-disabled={disabled || undefined}
        data-focused={!disabled && isFocused ? 'true' : 'false'}
        data-pressed={!disabled && isPointerActive ? 'true' : 'false'}
        data-disabled={disabled ? 'true' : 'false'}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onKeyUp={onKeyUpProp}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onLostPointerCapture={handleLostPointerCapture}
      >
        {!hideScrim && (
          <Scrim
            position={ScrimPosition.BOTTOM}
            className={styles.scrim}
            style={SCRIM_STYLE}
            data-active={interactionActive ? 'true' : 'false'}
          />
        )}
        <div className={styles.content}>
          {timestampPosition === ScrubberTimestampPosition.TOP && timestamps}
          <div ref={trackRef} className={styles.trackArea}>
            <ProgressIndicator
              value={clampedValue}
              maximumValue={SCRUBBER_MAX_VALUE}
              size={ProgressIndicatorSize.DEFAULT}
              announceUpdatesForAccessibility={false}
              aria-hidden="true"
            />
            <div ref={handleRef} className={styles.handleAnchor} aria-hidden="true">
              <div className={styles.ring} />
              <div className={styles.dot} />
            </div>
          </div>
          {timestampPosition === ScrubberTimestampPosition.BOTTOM && timestamps}
        </div>
        {showTooltip && (
          <Tooltip
            anchorRef={handleRef}
            text={tooltipText}
            isVisible={interactionActive}
            position={TooltipPosition.ANCHORED}
            shouldAutoDismiss={false}
            showTooltipTail
            tracksAnchorScale
          />
        )}
      </div>
    );
  },
));
