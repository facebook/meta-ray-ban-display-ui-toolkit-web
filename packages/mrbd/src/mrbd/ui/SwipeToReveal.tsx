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
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { useSpringAnimation } from '@wearables-ui-toolkit/foundation/motion/useSpringAnimation';
import { useComposedRef } from '@wearables-ui-toolkit/foundation/utils/useComposedRef';
import { Button } from './Button';
import { ButtonGroup, ButtonGroupAlignment } from './ButtonGroup';
import type {
  SwipeToRevealAction,
  SwipeToRevealProps,
} from './SwipeToReveal.types';
import styles from './SwipeToReveal.module.css';

export type {
  SwipeToRevealAction,
  SwipeToRevealProps,
} from './SwipeToReveal.types';

const REVEAL_SPRING = {
  stiffness: 250,
  damping: 30,
  mass: 1,
} as const;

function focusFirstDescendant(container: HTMLElement | null): void {
  const descendant = container?.querySelector<HTMLElement>(
    'button:not([disabled]), [role="button"], [href], [tabindex]:not([tabindex="-1"])',
  );
  (descendant ?? container)?.focus();
}

/**
 * Gives one focusable child a trailing tray containing up to three actions.
 * Right reveals the tray; Left from its primary action, vertical navigation,
 * or Back hides it. Focus always remains on the child or an action button.
 */
export const SwipeToReveal = memo(forwardRef<HTMLDivElement, SwipeToRevealProps>(
  function SwipeToReveal(
    {
      children,
      actions,
      className = '',
      onKeyDownCapture,
      onKeyUpCapture,
      ...htmlProps
    },
    ref,
  ) {
    const rootRef = useRef<HTMLDivElement>(null);
    const setRootRef = useComposedRef(ref, rootRef);
    const slotRef = useRef<HTMLDivElement>(null);
    const trayRef = useRef<HTMLDivElement>(null);
    const isRevealedRef = useRef(false);
    const pendingRightRevealRef = useRef(false);
    const pendingLeftHideRef = useRef(false);
    const [isRevealed, setIsRevealedState] = useState(false);
    const [isTrayVisible, setIsTrayVisible] = useState(false);
    const [announcement, setAnnouncement] = useState('');

    const slotAnimation = useSpringAnimation({
      config: REVEAL_SPRING,
      initialValue: 0,
      onChange: value => {
        if (slotRef.current != null) {
          slotRef.current.style.transform = `translate3d(${value}px, 0, 0)`;
        }
      },
    });

    const trayAnimation = useSpringAnimation({
      config: REVEAL_SPRING,
      initialValue: 0,
      onChange: value => {
        if (trayRef.current != null) {
          trayRef.current.style.opacity = String(value);
        }
      },
      onRest: value => {
        if (value === 0 && !isRevealedRef.current) {
          setIsTrayVisible(false);
        }
      },
    });

    const setRevealed = useCallback((
      revealed: boolean,
      restoreSlotFocus = true,
    ) => {
      pendingRightRevealRef.current = false;
      pendingLeftHideRef.current = false;
      if (isRevealedRef.current === revealed) {
        return;
      }

      isRevealedRef.current = revealed;
      setIsRevealedState(revealed);
      setAnnouncement(revealed ? 'Actions shown' : 'Actions hidden');
      if (revealed) {
        setIsTrayVisible(true);
      }

      const trayWidth = trayRef.current?.offsetWidth ?? 0;
      slotAnimation.setTarget(revealed ? -trayWidth : 0);
      trayAnimation.setTarget(revealed ? 1 : 0);

      if (!revealed && restoreSlotFocus) {
        focusFirstDescendant(slotRef.current);
      }
    }, [slotAnimation, trayAnimation]);

    useLayoutEffect(() => {
      if (isRevealed) {
        focusFirstDescendant(trayRef.current);
      }
    }, [isRevealed]);

    useLayoutEffect(() => {
      if (!isRevealedRef.current) {
        return;
      }
      slotAnimation.setTarget(-(trayRef.current?.offsetWidth ?? 0));
    }, [actions, slotAnimation]);

    const handleKeyDownCapture = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
      onKeyDownCapture?.(event);
      if (event.defaultPrevented) {
        return;
      }

      if (
        event.key === 'ArrowRight' &&
        !isRevealedRef.current &&
        slotRef.current?.contains(event.target as Node)
      ) {
        pendingRightRevealRef.current = true;
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      if (event.key === 'ArrowLeft' && isRevealedRef.current) {
        const firstAction = trayRef.current?.querySelector<HTMLElement>('[role="button"]');
        pendingLeftHideRef.current = firstAction === event.target;
        if (pendingLeftHideRef.current) {
          event.preventDefault();
          event.stopPropagation();
        }
        return;
      }

      if (
        (event.key === 'ArrowUp' || event.key === 'ArrowDown') &&
        isRevealedRef.current
      ) {
        setRevealed(false);
        return;
      }

      if (
        (event.key === 'Escape' || event.key === 'BrowserBack') &&
        isRevealedRef.current
      ) {
        event.preventDefault();
        event.stopPropagation();
      }
    }, [onKeyDownCapture, setRevealed]);

    const handleKeyUpCapture = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
      onKeyUpCapture?.(event);
      if (event.defaultPrevented) {
        return;
      }

      if (event.key === 'ArrowRight' && pendingRightRevealRef.current) {
        pendingRightRevealRef.current = false;
        event.preventDefault();
        event.stopPropagation();
        setRevealed(true);
        return;
      }

      if (event.key === 'ArrowLeft' && pendingLeftHideRef.current) {
        pendingLeftHideRef.current = false;
        event.preventDefault();
        event.stopPropagation();
        setRevealed(false);
        return;
      }

      if (
        (event.key === 'Escape' || event.key === 'BrowserBack') &&
        isRevealedRef.current
      ) {
        event.preventDefault();
        event.stopPropagation();
        setRevealed(false);
      }
    }, [onKeyUpCapture, setRevealed]);

    const rootClassName = `${styles.root} ${className}`;
    const trayClassName = isTrayVisible
      ? styles.actionTray
      : `${styles.actionTray} ${styles.actionTrayHidden}`;
    const visibleActions = actions
      .filter((action): action is SwipeToRevealAction => action != null)
      .slice(0, 3);

    return (
      <div
        {...htmlProps}
        ref={setRootRef}
        className={rootClassName}
        onKeyDownCapture={handleKeyDownCapture}
        onKeyUpCapture={handleKeyUpCapture}
      >
        <div
          ref={trayRef}
          className={trayClassName}
          aria-hidden={!isRevealed}
        >
          <ButtonGroup alignment={ButtonGroupAlignment.START}>
            {visibleActions.map((action, index) => (
              <Button
                key={`${index}-${action.contentDescription}`}
                icon={action.icon}
                aria-label={action.contentDescription}
                onClick={action.onClick}
                tabIndex={isRevealed ? 0 : -1}
              />
            ))}
          </ButtonGroup>
        </div>
        <div ref={slotRef} className={styles.slot} tabIndex={-1}>
          {children}
        </div>
        <span className={styles.announcement} role="status" aria-live="polite">
          {announcement}
        </span>
      </div>
    );
  },
));
