/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CSSProperties } from 'react';
import { Interpolators } from '@wearables-ui-toolkit/foundation/motion/Animations';
import { isBackNavigationKey } from '@wearables-ui-toolkit/foundation/navigation/BackNavigation';
import { SPRING_DURATION, SUBNAVIGATION_TOP_MARGIN } from './SubNavigationMetrics';

/**
 * Whether a key event on the SubNavigation strip should return to the home page.
 *
 * Delegates the alias set to `isBackNavigationKey` rather than testing
 * `Escape` alone. Page content reaches the inner `Pager`, which already honours
 * all four aliases — but keys pressed while the strip has focus are handled
 * only here, so testing `Escape` alone made `Backspace`/`BrowserBack`/`GoBack`
 * dead from the strip while working everywhere else.
 *
 * Taking the whole event (not just `key`) is what lets the shared predicate
 * apply its `Backspace`-in-text-entry exclusion too.
 */
export function shouldNavigateSubNavigationHome({
  event,
  useBackButtonForHome,
  homeIndex,
  activeIndex,
}: {
  event: Pick<KeyboardEvent, 'key'> & { readonly target?: EventTarget | null };
  useBackButtonForHome: boolean;
  homeIndex: number;
  activeIndex: number;
}): boolean {
  return (
    isBackNavigationKey(event) &&
    useBackButtonForHome &&
    homeIndex >= 0 &&
    activeIndex !== homeIndex
  );
}

export function getSubNavigationScrimStyle(isFocused: boolean): CSSProperties {
  return {
    opacity: isFocused ? 1 : 0,
    visibility: isFocused ? 'visible' : 'hidden',
    // Scrim fade uses the shared CONTAINER_SCALE spring approximation, matching
    // the rest of the component.
    transition: `opacity ${SPRING_DURATION}ms ${Interpolators.CONTAINER_SCALE}, visibility ${SPRING_DURATION}ms`,
  };
}

export function getSubNavigationWrapperStyle(
  enableTopPadding: boolean,
): CSSProperties {
  return {
    '--subnavigation-top-margin': enableTopPadding
      ? `${SUBNAVIGATION_TOP_MARGIN}px`
      : '0px',
  } as CSSProperties;
}

export function getSubNavigationPagerClassName(
  baseClassName: string,
  className: string,
): string {
  return [baseClassName, className].filter(Boolean).join(' ');
}
