/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * SubNavigation component for Meta Ray-Ban Display
 *
 * Tab-like navigation bar. Extends Container with item-based navigation.
 * Left/Right arrow keys switch active tab. Active item's label peeks out
 * when the SubNavigation is focused.
 *
 * No touch on Meta Ray-Ban Display -- all interaction via d-pad/trackpad.
 */

import {
  forwardRef,
  memo,
  useState,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  type CSSProperties,
  type KeyboardEvent,
} from 'react';
import { Container } from '@wearables-ui-toolkit/foundation/components/Container';
import { MaterialLibrary } from '@wearables-ui-toolkit/foundation/material/MaterialLibrary';
import { State, InteractionState } from '@wearables-ui-toolkit/foundation/base/Interactions';
import {
  getSubNavigationAdjacentIndex,
  getSubNavigationAriaLabel,
  getSubNavigationContainerStyle,
  getSubNavigationContentScale,
  getSubNavigationLiveAnnouncement,
  isSubNavigationFocused,
} from './private/SubNavigationLayout';
import { SubNavItemView } from './private/SubNavigationItemView';
import type {
  SubNavigationHandle,
  SubNavigationProps,
} from './SubNavigation.types';
import { useSubNavigationAutoHide } from './private/useSubNavigationAutoHide';
import styles from './SubNavigation.module.css';

export type {
  SubNavigationHandle,
  SubNavigationItem,
  SubNavigationProps,
} from './SubNavigation.types';

const EMPTY_SUB_NAVIGATION_STYLE: CSSProperties = {};

// Visually-hidden but screen-reader-available styling for the polite live region.
const SR_ONLY_STYLE: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

// ============================================================================
// Component
// ============================================================================

/**
 * SubNavigation component
 * Tab-like navigation bar with animated active indicator.
 *
 * Key handling:
 * - ArrowLeft: navigate to previous item
 * - ArrowRight: navigate to next item
 */
export const SubNavigation = memo(forwardRef<SubNavigationHandle, SubNavigationProps>(
  function SubNavigation(
    {
      items,
      active = -1,
      autoHide = false,
      onActiveChange,
      onFocusChange,
      material: materialProp,
      disabled = false,
      initialFocusEligible = false,
      style = EMPTY_SUB_NAVIGATION_STYLE,
      className = '',
      onKeyDown: onKeyDownProp,
      ...containerProps
    },
    ref
  ) {
    const rootRef = useRef<HTMLDivElement>(null);
    const [internalState, setInternalState] = useState<State>(State.DEFAULT);
    const isFocused = useMemo(
      () => isSubNavigationFocused(internalState),
      [internalState],
    );
    const {
      animated: visibilityAnimated,
      visible,
      setVisible,
    } = useSubNavigationAutoHide(autoHide, isFocused);

    // ---- Focus change callback ----

    const onFocusChangeRef = useRef(onFocusChange);
    onFocusChangeRef.current = onFocusChange;
    const prevIsFocusedRef = useRef(isFocused);
    useEffect(() => {
      if (prevIsFocusedRef.current !== isFocused) {
        prevIsFocusedRef.current = isFocused;
        onFocusChangeRef.current?.(isFocused);
      }
    }, [isFocused]);

    useImperativeHandle(
      ref,
      (): SubNavigationHandle => ({
        setVisible: (newVisible: boolean, animated: boolean = true) => {
          setVisible(newVisible, animated);
        },
        getElement: () => rootRef.current,
      }),
      [setVisible],
    );

    const material = useMemo(
      () => materialProp ?? MaterialLibrary.default(),
      [materialProp],
    );

    // ---- State change from Container ----

    const handleStateChange = useCallback((_prev: InteractionState, next: InteractionState) => {
      setInternalState(next.state);
    }, []);

    // ---- Navigation ----

    const navigatePrevious = useCallback((): boolean => {
      const prevIndex = getSubNavigationAdjacentIndex(active, items.length, 'previous');
      if (prevIndex != null) {
        onActiveChange?.(prevIndex);
        return true;
      }
      return false;
    }, [active, items.length, onActiveChange]);

    const navigateNext = useCallback((): boolean => {
      const nextIndex = getSubNavigationAdjacentIndex(active, items.length, 'next');
      if (nextIndex != null) {
        onActiveChange?.(nextIndex);
        return true;
      }
      return false;
    }, [active, items.length, onActiveChange]);

    const handleKeyDown = useCallback(
      (event: KeyboardEvent<HTMLDivElement>) => {
        switch (event.key) {
          case 'ArrowLeft':
            if (navigatePrevious()) {
              event.preventDefault();
              event.stopPropagation();
            }
            break;
          case 'ArrowRight':
            if (navigateNext()) {
              event.preventDefault();
              event.stopPropagation();
            }
            break;
        }
        if (!event.defaultPrevented) {
          onKeyDownProp?.(event);
        }
      },
      [navigatePrevious, navigateNext, onKeyDownProp]
    );

    // ---- Content scale override (content scale is a constant 1) ----

    const contentScaleForState = useCallback(getSubNavigationContentScale, []);

    // ---- Visibility styles ----

    const containerStyle = useMemo(
      () => getSubNavigationContainerStyle(visible, style, visibilityAnimated),
      [style, visible, visibilityAnimated],
    );

    // ---- Accessibility ----

    const ariaLabel = useMemo(
      () => getSubNavigationAriaLabel(items, active),
      [items, active],
    );

    // Concise page announcement pushed via the polite live region on change.
    const liveAnnouncement = useMemo(
      () => getSubNavigationLiveAnnouncement(items, active),
      [items, active],
    );
    const [liveAnnouncementText, setLiveAnnouncementText] = useState('');
    const hasMountedLiveRegionRef = useRef(false);
    useEffect(() => {
      if (hasMountedLiveRegionRef.current) {
        setLiveAnnouncementText(liveAnnouncement ?? '');
      } else {
        hasMountedLiveRegionRef.current = true;
      }
    }, [liveAnnouncement]);

    const itemClickHandlers = useMemo(
      () => items.map((_, index) => () => onActiveChange?.(index)),
      [items, onActiveChange],
    );
    const rootClassName = useMemo(
      () => `${styles.subNavigation} ${className}`,
      [className],
    );
    const itemIdPrefix = useId();
    const activeDescendant = active >= 0 && active < items.length
      ? `${itemIdPrefix}-${active}`
      : undefined;

    return (
      <>
        <Container
          ref={rootRef}
          className={rootClassName}
          style={containerStyle}
          material={material}
          disabled={disabled}
          initialFocusEligible={initialFocusEligible}
          onStateChange={handleStateChange}
          onKeyDown={handleKeyDown}
          contentScaleForStateFn={contentScaleForState}
          role="tablist"
          ariaLabel={ariaLabel}
          aria-activedescendant={activeDescendant}
          aria-keyshortcuts="ArrowLeft ArrowRight"
          {...containerProps}
          data-uit-focus-revealable="true"
        >
          <div className={styles.navRow}>
            {items.map((item, index) => (
              <SubNavItemView
                key={`${item.label}-${index}`}
                id={`${itemIdPrefix}-${index}`}
                item={item}
                isActive={index === active}
                isParentFocused={isFocused}
                onClick={itemClickHandlers[index]}
              />
            ))}
          </div>
        </Container>
        {/*
          Polite live region: a stable visually-hidden node whose text updates
          on active change so assistive tech announces "Page N of M, label". The
          host aria-label (read on focus) carries the fuller description + swipe
          hints; arrow navigation is advertised via aria-keyshortcuts above.
        */}
        <div role="status" aria-live="polite" style={SR_ONLY_STYLE}>
          {liveAnnouncementText}
        </div>
      </>
    );
  }
));
