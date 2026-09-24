/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

export interface TextSwitcherStateOptions {
  text?: string;
  duration: number;
  noAnimationFirstView: boolean;
  animated: boolean;
}

export interface TextSwitcherState {
  displayedText?: string;
  containerOpacity: number;
}

export function useTextSwitcher({
  text,
  duration,
  noAnimationFirstView,
  animated,
}: TextSwitcherStateOptions): TextSwitcherState {
  const skipInitialAnimation = !animated || noAnimationFirstView;
  const [displayedText, setDisplayedText] = useState<string | undefined>(
    skipInitialAnimation ? text : undefined,
  );
  const [containerOpacity, setContainerOpacity] = useState<number>(
    skipInitialAnimation && text ? 1 : 0,
  );

  const isFirstViewRef = useRef(true);
  const isAnimatingRef = useRef(false);
  const hasQueuedTextRef = useRef(false);
  const queuedTextRef = useRef<string | undefined>(undefined);
  const fadeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const displayedTextRef = useRef(displayedText);
  const containerOpacityRef = useRef(containerOpacity);

  useLayoutEffect(() => {
    displayedTextRef.current = displayedText;
  }, [displayedText]);

  useLayoutEffect(() => {
    containerOpacityRef.current = containerOpacity;
  }, [containerOpacity]);

  useEffect(() => {
    return () => {
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
      }
    };
  }, []);

  const swapContentWithAnimation = useCallback(
    (newText: string | undefined) => {
      if (isAnimatingRef.current) {
        hasQueuedTextRef.current = true;
        queuedTextRef.current = newText;
        return;
      }

      isAnimatingRef.current = true;

      const currentDisplayedText = displayedTextRef.current;
      const currentContainerOpacity = containerOpacityRef.current;
      const hasOldContent =
        currentDisplayedText != null && currentDisplayedText !== '';
      const hasNewContent = newText != null && newText !== '';

      const completeAnimation = () => {
        isAnimatingRef.current = false;
        fadeTimeoutRef.current = null;

        if (hasQueuedTextRef.current) {
          const queued = queuedTextRef.current;
          hasQueuedTextRef.current = false;
          queuedTextRef.current = undefined;
          swapContentWithAnimation(queued);
        }
      };

      if (hasOldContent || currentContainerOpacity > 0.01) {
        setContainerOpacity(0);

        fadeTimeoutRef.current = setTimeout(() => {
          if (hasNewContent) {
            setDisplayedText(newText);
            requestAnimationFrame(() => {
              setContainerOpacity(1);
              fadeTimeoutRef.current = setTimeout(completeAnimation, duration);
            });
          } else {
            setDisplayedText(newText);
            completeAnimation();
          }
        }, duration);
      } else {
        setDisplayedText(newText);
        requestAnimationFrame(() => {
          setContainerOpacity(hasNewContent ? 1 : 0);
          fadeTimeoutRef.current = setTimeout(completeAnimation, duration);
        });
      }
    },
    [duration],
  );

  useLayoutEffect(() => {
    const shouldAnimate =
      animated && (!isFirstViewRef.current || !noAnimationFirstView);

    if (shouldAnimate) {
      swapContentWithAnimation(text);
    } else {
      hasQueuedTextRef.current = false;
      queuedTextRef.current = undefined;
      setDisplayedText(text);
      setContainerOpacity(text ? 1 : 0);
    }

    isFirstViewRef.current = false;
  }, [animated, noAnimationFirstView, swapContentWithAnimation, text]);

  return {
    displayedText,
    containerOpacity,
  };
}
