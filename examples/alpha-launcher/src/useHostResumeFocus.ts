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
  useRef,
  type RefObject,
} from 'react';
import type { ButtonRailHandle } from '@wearables-ui-toolkit/mrbd/ButtonRail';
import type { LauncherPage } from './launcherTypes';

const HOST_RESUME_FOCUS_RESTORE_DELAY_MS = 300;

/**
 * Preserves rail focus while the web-app host temporarily owns input.
 *
 * Opening the host menu blurs the WebView. On Resume, the host uses the first
 * directional event to hand input back to the page. This hook restores the
 * previous button and handles that first event once, so focus does not restart
 * at the first button or move twice.
 */
export function useHostResumeFocus(
  activePage: LauncherPage | null,
  buttonRailRef: RefObject<ButtonRailHandle | null>,
) {
  const lastFocusedButtonRef = useRef<HTMLElement | null>(null);
  const didLoseHostFocusRef = useRef(false);
  const pendingResumeNavigationRef = useRef(false);
  const focusTimerRef = useRef(0);

  const restoreLastFocusedButton = useCallback((delay: number) => {
    window.clearTimeout(focusTimerRef.current);
    focusTimerRef.current = window.setTimeout(() => {
      const button = lastFocusedButtonRef.current;
      if (button == null || !button.isConnected) {
        return;
      }

      buttonRailRef.current?.skipAnimationForNextFocusMovement();
      button.focus({ preventScroll: true });
    }, delay);
  }, [buttonRailRef]);

  const rememberFocusedButton = useCallback((button: HTMLElement) => {
    lastFocusedButtonRef.current = button;
  }, []);

  useEffect(() => {
    const handleWindowBlur = () => {
      didLoseHostFocusRef.current = true;
    };

    const handleWindowFocus = () => {
      if (activePage != null || lastFocusedButtonRef.current == null) {
        return;
      }

      if (didLoseHostFocusRef.current) {
        didLoseHostFocusRef.current = false;
        pendingResumeNavigationRef.current = true;
      }
      restoreLastFocusedButton(HOST_RESUME_FOCUS_RESTORE_DELAY_MS);
    };

    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    return () => {
      window.clearTimeout(focusTimerRef.current);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [activePage, restoreLastFocusedButton]);

  useEffect(() => {
    const handleFirstNavigationAfterResume = (event: KeyboardEvent) => {
      if (
        activePage != null ||
        !pendingResumeNavigationRef.current ||
        (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')
      ) {
        return;
      }

      const rail = buttonRailRef.current?.getElement();
      const currentButton = lastFocusedButtonRef.current;
      if (rail == null || currentButton == null) {
        return;
      }

      const buttons = Array.from(rail.querySelectorAll<HTMLElement>(
        '[tabindex]:not([tabindex="-1"]):not([disabled])',
      ));
      const currentIndex = buttons.indexOf(currentButton);
      const nextIndex = event.key === 'ArrowRight'
        ? currentIndex + 1
        : currentIndex - 1;

      pendingResumeNavigationRef.current = false;
      event.preventDefault();
      event.stopPropagation();
      buttons[nextIndex]?.focus({ preventScroll: true });
    };

    document.addEventListener(
      'keydown',
      handleFirstNavigationAfterResume,
      true,
    );
    return () => document.removeEventListener(
      'keydown',
      handleFirstNavigationAfterResume,
      true,
    );
  }, [activePage, buttonRailRef]);

  return {
    rememberFocusedButton,
    restoreLastFocusedButton,
  };
}
