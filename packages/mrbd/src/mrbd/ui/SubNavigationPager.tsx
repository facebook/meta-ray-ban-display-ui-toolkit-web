/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * SubNavigationPager component for Meta Ray-Ban Display
 *
 * Combines a SubNavigation tab bar with a Pager page container.
 * SubNavigation items correspond to Pager pages:
 * - Selecting a tab switches the page
 * - Swiping/navigating pages updates the active tab
 * - Left/Right arrow keys on SubNavigation switch tabs AND pages
 * - Back returns to home page; the shared desktop Back aliases (Escape,
 *   Backspace, BrowserBack, GoBack) are the fallback, forwarded to Pager
 * - SubNavigation can auto-hide
 *
 * Layout (stacked layers):
 * 1. Pager (fills the container) — page content
 * 2. Scrim overlay — gradient that fades in when SubNavigation is focused
 * 3. SubNavigation (top-center) — tab bar
 */

import {
  forwardRef,
  memo,
  useState,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  Children,
  type CSSProperties,
  type KeyboardEvent,
} from 'react';
import { Pager, PagerOrientation } from '@wearables-ui-toolkit/foundation/components/Pager';
import { FOCUSABLE_SELECTOR } from '@wearables-ui-toolkit/foundation/base/FocusNavigationEvents';
import { useComposedRef } from '@wearables-ui-toolkit/foundation/utils/useComposedRef';
import { SubNavigation } from './SubNavigation';
import type { SubNavigationHandle } from './SubNavigation';
import {
  getSubNavigationScrimStyle,
  getSubNavigationPagerClassName,
  getSubNavigationWrapperStyle,
  shouldNavigateSubNavigationHome,
} from './private/SubNavigationPagerLayout';
import type { SubNavigationPagerProps } from './SubNavigationPager.types';
import styles from './SubNavigationPager.module.css';

export type { SubNavigationPagerProps } from './SubNavigationPager.types';

const DEFAULT_STYLE: CSSProperties = {};

// ============================================================================
// Component
// ============================================================================

/**
 * SubNavigationPager
 * A Pager with a built-in SubNavigation header.
 *
 * The SubNavigation items map 1:1 to Pager pages. Selecting a tab
 * switches the page, and navigating pages updates the active tab.
 *
 * When the SubNavigation gains focus, a scrim gradient fades in behind it
 * to improve readability against page content.
 */
export const SubNavigationPager = memo(forwardRef<HTMLDivElement, SubNavigationPagerProps>(
  function SubNavigationPager(
    {
      items,
      children,
      useBackButtonForHome = true,
      homeIndex = -1,
      autoHide = false,
      subNavigationDisabled = false,
      enableTopPadding = true,
      onPageChange,
      navigationLocked = false,
      onNavigationAttemptWhileLocked,
      currentPageIndex: controlledIndex,
      defaultPageIndex = 0,
      className = '',
      style = DEFAULT_STYLE,
      ariaLabel,
    },
    ref
  ) {
    const pages = Children.toArray(children);
    if (items.length !== pages.length) {
      throw new Error(
        `SubNavigationPager requires one item per page; received ${items.length} items and ${pages.length} pages.`,
      );
    }

    // Internal page index state
    const isControlled = controlledIndex !== undefined;
    const [internalIndex, setInternalIndex] = useState(
      controlledIndex ?? defaultPageIndex,
    );

    // Track SubNavigation focus state for scrim visibility
    const [subNavFocused, setSubNavFocused] = useState(false);

    // Imperative handle to the SubNavigation, used to restore focus to the tab
    // bar after a subnav-driven page change (the Pager focuses the new page's
    // content on every controlled-index change).
    const subNavigationRef = useRef<SubNavigationHandle>(null);
    const rootRef = useRef<HTMLDivElement>(null);
    // Set when a page change originates from the SubNavigation (tab click / arrow
    // navigation) so focus stays on the tab bar. While armed, the incoming page
    // is prevented from stealing focus, letting the user swipe through
    // consecutive pages without focus dropping into page content.
    const subNavOriginatedChangeRef = useRef(false);
    const subNavFocusGuardReleaseFrameRef = useRef<number | null>(null);
    const clearSubNavFocusGuardReleaseFrame = useCallback(() => {
      if (subNavFocusGuardReleaseFrameRef.current != null) {
        window.cancelAnimationFrame(subNavFocusGuardReleaseFrameRef.current);
        subNavFocusGuardReleaseFrameRef.current = null;
      }
    }, []);
    const releaseSubNavFocusGuardAfterPageSettles = useCallback(() => {
      clearSubNavFocusGuardReleaseFrame();
      subNavFocusGuardReleaseFrameRef.current = window.requestAnimationFrame(() => {
        subNavFocusGuardReleaseFrameRef.current = window.requestAnimationFrame(() => {
          subNavFocusGuardReleaseFrameRef.current = null;
          subNavOriginatedChangeRef.current = false;
        });
      });
    }, [clearSubNavFocusGuardReleaseFrame]);

    // ---- Sync controlled index ----
    // When controlledIndex prop changes, update internal state
    const activeIndex = controlledIndex ?? internalIndex;
    useLayoutEffect(() => {
      if (controlledIndex !== undefined) {
        setInternalIndex(controlledIndex);
      }
    }, [controlledIndex]);

    // ---- SubNavigation tab selection -> Pager page change ----
    // Selecting a tab shows the corresponding page.
    const handleActiveChange = useCallback(
      (index: number) => {
        if (navigationLocked) {
          onNavigationAttemptWhileLocked?.();
          return;
        }
        const prevIndex = activeIndex;
        // Arm the focus guard only when the tab bar currently owns focus. A tab
        // selection made while focus is elsewhere (e.g. programmatic) should not
        // pull focus onto the tab bar.
        clearSubNavFocusGuardReleaseFrame();
        const subNavElement = subNavigationRef.current?.getElement();
        subNavOriginatedChangeRef.current =
          subNavElement != null && subNavElement.contains(document.activeElement);
        if (subNavOriginatedChangeRef.current) {
          releaseSubNavFocusGuardAfterPageSettles();
        }
        if (!isControlled) {
          setInternalIndex(index);
        }
        onPageChange?.(index, prevIndex, true);
      },
      [
        activeIndex,
        clearSubNavFocusGuardReleaseFrame,
        isControlled,
        navigationLocked,
        onNavigationAttemptWhileLocked,
        onPageChange,
        releaseSubNavFocusGuardAfterPageSettles,
      ]
    );

    useLayoutEffect(() => {
      if (subNavOriginatedChangeRef.current) {
        releaseSubNavFocusGuardAfterPageSettles();
      }
    }, [activeIndex, releaseSubNavFocusGuardAfterPageSettles]);

    // ---- Pager page change -> SubNavigation active tab update ----
    // A page change updates the active SubNavigation tab.
    const handlePageChange = useCallback(
      (newIndex: number, prevIndex: number, animated: boolean) => {
        if (!isControlled) {
          setInternalIndex(newIndex);
        }
        onPageChange?.(newIndex, prevIndex, animated);
      },
      [isControlled, onPageChange]
    );

    // ---- SubNavigation focus -> scrim visibility ----
    // SubNavigation focus changes drive the scrim visibility.
    const handleSubNavFocus = useCallback(() => {
      setSubNavFocused(true);
    }, []);

    const handleSubNavBlur = useCallback(() => {
      setSubNavFocused(false);
    }, []);

    const handleKeyDown = useCallback(
      (event: KeyboardEvent<HTMLDivElement>) => {
        const subNavElement = subNavigationRef.current?.getElement();
        if (
          event.key === 'ArrowDown' &&
          subNavElement != null &&
          subNavElement.contains(document.activeElement)
        ) {
          const activePage = rootRef.current?.querySelector(
            `[data-page-index="${activeIndex}"]`,
          );
          const contentTarget = activePage?.querySelector<HTMLElement>(
            FOCUSABLE_SELECTOR,
          );
          if (contentTarget != null) {
            event.preventDefault();
            event.stopPropagation();
            subNavOriginatedChangeRef.current = false;
            clearSubNavFocusGuardReleaseFrame();
            contentTarget.focus({ preventScroll: true });
            return;
          }
        }
        if (shouldNavigateSubNavigationHome({
          event,
          useBackButtonForHome,
          homeIndex,
          activeIndex,
        })) {
          event.preventDefault();
          event.stopPropagation();
          handleActiveChange(homeIndex);
        }
      },
      [
        activeIndex,
        clearSubNavFocusGuardReleaseFrame,
        handleActiveChange,
        homeIndex,
        useBackButtonForHome,
      ]
    );

    // ---- Keep focus on the SubNavigation after a subnav-driven page change ----
    // The Pager focuses the incoming page's content whenever its controlled index
    // changes. That focus grab happens asynchronously (an extra state update after
    // the controlled prop settles), so a one-shot layout effect can't reliably
    // run after it. Instead, arm a focusin guard on subnav-driven changes: the
    // single focusin that lands inside the Pager (the page stealing focus) is
    // redirected back to the tab bar, then the guard disarms. This keeps focus on
    // the tab bar while the incoming page settles, letting the user swipe through
    // consecutive pages. Pager-driven changes (paging from within page content)
    // don't arm the guard, so those still focus the new page.
    useLayoutEffect(() => {
      const rootElement = rootRef.current;
      if (rootElement == null) {
        return;
      }
      const handleFocusIn = (event: FocusEvent) => {
        if (!subNavOriginatedChangeRef.current) {
          return;
        }
        const subNavElement = subNavigationRef.current?.getElement();
        if (subNavElement == null) {
          return;
        }
        const target = event.target;
        // Only redirect focus that landed inside a page (i.e. not on the tab bar
        // itself), so we never yank focus the user deliberately moved to the tabs.
        if (target instanceof Node && !subNavElement.contains(target)) {
          subNavOriginatedChangeRef.current = false;
          clearSubNavFocusGuardReleaseFrame();
          subNavElement.focus({ preventScroll: true });
        }
      };
      rootElement.addEventListener('focusin', handleFocusIn, true);
      return () => {
        rootElement.removeEventListener('focusin', handleFocusIn, true);
        clearSubNavFocusGuardReleaseFrame();
      };
    }, [clearSubNavFocusGuardReleaseFrame]);

    // ---- Scrim styles ----
    // Scrim alpha animates with a spring-like transition.
    const scrimStyle = useMemo(
      () => getSubNavigationScrimStyle(subNavFocused),
      [subNavFocused],
    );

    // ---- SubNavigation wrapper styles ----
    const subNavWrapperStyle = useMemo(
      () => getSubNavigationWrapperStyle(enableTopPadding),
      [enableTopPadding],
    );

    // Container class
    const containerClassName = useMemo(
      () => getSubNavigationPagerClassName(
        styles.subNavigationPager,
        className,
      ),
      [className],
    );

    const setRootRef = useComposedRef(ref, rootRef);

    return (
      <div
        ref={setRootRef}
        className={containerClassName}
        style={style}
        role="group"
        aria-label={ariaLabel ?? 'Navigation pager'}
        data-page-count={pages.length}
        data-current-page={activeIndex}
        onKeyDownCapture={handleKeyDown}
      >
        {/* Layer 1: Pager (fills the container) */}
        <Pager
          orientation={PagerOrientation.HORIZONTAL}
          currentPageIndex={activeIndex}
          useBackButtonForHome={useBackButtonForHome}
          homeIndex={homeIndex}
          onPageChange={handlePageChange}
          navigationLocked={navigationLocked}
          onNavigationAttemptWhileLocked={onNavigationAttemptWhileLocked}
          tabIndex={-1}
        >
          {children}
        </Pager>

        {/* Layer 2: ScrimView overlay — gradient fades in when SubNavigation is focused */}
        <div
          className={styles.scrimView}
          style={scrimStyle}
          aria-hidden="true"
        />

        {/* Layer 3: SubNavigation centered at the top. */}
        {!subNavigationDisabled && (
          <div
            className={styles.subNavigationWrapper}
            style={subNavWrapperStyle}
            onFocus={handleSubNavFocus}
            onBlur={handleSubNavBlur}
          >
            <SubNavigation
              ref={subNavigationRef}
              items={items}
              active={activeIndex}
              autoHide={autoHide}
              onActiveChange={handleActiveChange}
            />
          </div>
        )}
      </div>
    );
  }
));
