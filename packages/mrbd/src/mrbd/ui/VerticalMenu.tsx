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
  useMemo,
  useRef,
  type FocusEvent,
  type KeyboardEvent,
} from 'react';
import { TooltipPosition } from '@wearables-ui-toolkit/foundation/base/TooltipPopup';
import type { TooltipContentInjectedProps } from '@wearables-ui-toolkit/foundation/base/TooltipPopup.types';
import { useComposedRef } from '@wearables-ui-toolkit/foundation/utils/useComposedRef';
import { StaticContainer } from '@wearables-ui-toolkit/foundation';
import { MaterialLibrary } from '@wearables-ui-toolkit/foundation/material/MaterialLibrary';
import {
  CornerRadius,
  RoundedRectangleShapeProvider,
} from '@wearables-ui-toolkit/foundation/material/ShapeProvider';
import {
  VerticalMenuCorner,
  VerticalMenuDismissReason,
  type VerticalMenuAnchorProps,
  type VerticalMenuProps,
} from './VerticalMenu.types';
import styles from './VerticalMenu.module.css';

export {
  VerticalMenuCorner,
  VerticalMenuDismissReason,
} from './VerticalMenu.types';
export type {
  VerticalMenuAnchorProps,
  VerticalMenuProps,
} from './VerticalMenu.types';

const VERTICAL_MENU_WIDTH = 220;
const VERTICAL_MENU_ANCHOR_INSET = VERTICAL_MENU_WIDTH / 2;
// The anchor's release animation can briefly clear browser focus after the
// popup has already become visible, so keep the menu focus guard alive through
// the complete handoff instead of checking only the first paint.
const AUTO_FOCUS_SETTLE_FRAMES = 30;
const MENU_ITEM_SELECTOR =
  '[data-uit-vertical-menu-button], [role="menuitem"]';
const DEFAULT_VERTICAL_MENU_SHAPE_PROVIDER =
  new RoundedRectangleShapeProvider(CornerRadius.MEDIUM);

function createVerticalMenuAnchorProps(
  corner: VerticalMenuCorner,
): VerticalMenuAnchorProps {
  const alignsRight =
    corner === VerticalMenuCorner.ABOVE_RIGHT ||
    corner === VerticalMenuCorner.BELOW_RIGHT;
  const appearsBelow =
    corner === VerticalMenuCorner.BELOW_LEFT ||
    corner === VerticalMenuCorner.BELOW_RIGHT;

  return {
    tooltipFocusable: true,
    tooltipPosition: appearsBelow
      ? TooltipPosition.ANCHORED_BOTTOM
      : TooltipPosition.ANCHORED,
    tooltipShowTail: false,
    tooltipTargetRectProvider: (anchor) => {
      const centerX = alignsRight
        ? anchor.offsetWidth - VERTICAL_MENU_ANCHOR_INSET
        : VERTICAL_MENU_ANCHOR_INSET;
      return {
        left: centerX,
        right: centerX,
        top: 0,
        bottom: anchor.offsetHeight,
      };
    },
  };
}

const VERTICAL_MENU_ANCHOR_PROPS: Record<
  VerticalMenuCorner,
  VerticalMenuAnchorProps
> = {
  [VerticalMenuCorner.ABOVE_LEFT]: createVerticalMenuAnchorProps(
    VerticalMenuCorner.ABOVE_LEFT,
  ),
  [VerticalMenuCorner.ABOVE_RIGHT]: createVerticalMenuAnchorProps(
    VerticalMenuCorner.ABOVE_RIGHT,
  ),
  [VerticalMenuCorner.BELOW_LEFT]: createVerticalMenuAnchorProps(
    VerticalMenuCorner.BELOW_LEFT,
  ),
  [VerticalMenuCorner.BELOW_RIGHT]: createVerticalMenuAnchorProps(
    VerticalMenuCorner.BELOW_RIGHT,
  ),
};

export function getVerticalMenuAnchorProps(
  corner: VerticalMenuCorner,
): VerticalMenuAnchorProps {
  return VERTICAL_MENU_ANCHOR_PROPS[corner];
}

function getMenuItems(menu: HTMLElement): HTMLElement[] {
  return Array.from(menu.querySelectorAll<HTMLElement>(MENU_ITEM_SELECTOR)).filter(
    item => {
      const style = getComputedStyle(item);
      return (
        item.closest('[role="menu"]') === menu &&
        item.closest('[inert], [aria-hidden="true"]') == null &&
        !item.matches(':disabled') &&
        item.getAttribute('aria-disabled') !== 'true' &&
        item.tabIndex >= 0 &&
        style.display !== 'none'
      );
    },
  );
}

const VerticalMenuImpl = forwardRef<HTMLDivElement, VerticalMenuProps>(
  function VerticalMenu(
    {
      children,
      onDismissRequest,
      autoFocusFirstItem = true,
      onBlurCapture: onBlurCaptureProp,
      onKeyDownCapture: onKeyDownCaptureProp,
      className = '',
      contentClassName = '',
      'aria-label': ariaLabel = 'Menu',
      ...publicProps
    },
    ref,
  ) {
    const {
      focusSearchOrigin,
      isPositioned: popupPositioned,
      maxWidth: _maxWidth,
      tailCenterX: _tailCenterX,
      tailDirection: _tailDirection,
      ...rest
    } = publicProps as typeof publicProps & Partial<TooltipContentInjectedProps>;
    const menuRef = useRef<HTMLDivElement>(null);
    const autoFocusHandoffActiveRef = useRef(false);
    const setMenuRef = useComposedRef(ref, menuRef);
    const material = useMemo(
      () => MaterialLibrary.defaultStatic({ withDropShadow: true }),
      [],
    );

    useEffect(() => {
      if (!autoFocusFirstItem || popupPositioned === false) {
        return undefined;
      }
      const menu = menuRef.current;
      if (menu == null) {
        return undefined;
      }
      autoFocusHandoffActiveRef.current = true;
      let frameId: number | null = null;
      let completedFrames = 0;
      const settleFocus = () => {
        if (!autoFocusHandoffActiveRef.current) {
          return;
        }
        if (!menu.contains(document.activeElement)) {
          getMenuItems(menu)[0]?.focus({ preventScroll: true });
        }
        completedFrames += 1;
        if (completedFrames < AUTO_FOCUS_SETTLE_FRAMES) {
          frameId = requestAnimationFrame(settleFocus);
        }
      };
      frameId = requestAnimationFrame(settleFocus);
      return () => {
        autoFocusHandoffActiveRef.current = false;
        if (frameId != null) {
          cancelAnimationFrame(frameId);
        }
      };
    }, [autoFocusFirstItem, popupPositioned]);

    const handleBlurCapture = useCallback(
      (event: FocusEvent<HTMLDivElement>) => {
        onBlurCaptureProp?.(event);
        const nextTarget = event.relatedTarget;
        if (
          !(nextTarget instanceof Node) ||
          event.currentTarget.contains(nextTarget)
        ) {
          return;
        }
        const menu = event.currentTarget;
        const focusFellBackToApplicationBoundary =
          nextTarget instanceof HTMLElement &&
          nextTarget.tabIndex < 0 &&
          (
            nextTarget.contains(menu) ||
            (focusSearchOrigin != null && nextTarget.contains(focusSearchOrigin))
          );
        if (!focusFellBackToApplicationBoundary) {
          autoFocusHandoffActiveRef.current = false;
        }
      },
      [focusSearchOrigin, onBlurCaptureProp],
    );

    const handleKeyDownCapture = useCallback(
      (event: KeyboardEvent<HTMLDivElement>) => {
        onKeyDownCaptureProp?.(event);
        if (event.defaultPrevented) {
          return;
        }

        if (event.key === 'Escape') {
          if (onDismissRequest == null) {
            return;
          }
          event.preventDefault();
          event.stopPropagation();
          autoFocusHandoffActiveRef.current = false;
          onDismissRequest(VerticalMenuDismissReason.ESCAPE);
          return;
        }
        if (
          event.key !== 'ArrowUp' &&
          event.key !== 'ArrowDown' &&
          event.key !== 'Home' &&
          event.key !== 'End'
        ) {
          return;
        }

        const menu = menuRef.current;
        if (menu == null) {
          return;
        }
        const items = getMenuItems(menu);
        const currentIndex = items.findIndex(
          (item) => item === document.activeElement || item.contains(document.activeElement),
        );
        if (currentIndex < 0) {
          return;
        }

        if (event.key === 'Home') {
          const firstItem = items[0];
          if (firstItem != null) {
            event.preventDefault();
            event.stopPropagation();
            firstItem.focus();
          }
          return;
        }
        if (event.key === 'End') {
          const lastItem = items[items.length - 1];
          if (lastItem != null) {
            event.preventDefault();
            event.stopPropagation();
            lastItem.focus();
          }
          return;
        }
        const offset = event.key === 'ArrowDown' ? 1 : -1;
        const nextItem = items[currentIndex + offset];
        if (nextItem != null) {
          event.preventDefault();
          event.stopPropagation();
          nextItem.focus();
          return;
        }
        if (onDismissRequest != null) {
          event.preventDefault();
          event.stopPropagation();
          autoFocusHandoffActiveRef.current = false;
          onDismissRequest(VerticalMenuDismissReason.NAVIGATION);
        }
      },
      [onDismissRequest, onKeyDownCaptureProp],
    );

    return (
      <StaticContainer
        {...rest}
        ref={setMenuRef}
        className={`${styles.menu} ${className}`.trim()}
        contentClassName={`${styles.content} ${contentClassName}`.trim()}
        width={VERTICAL_MENU_WIDTH}
        height="auto"
        material={material}
        shapeProvider={rest.shapeProvider ?? DEFAULT_VERTICAL_MENU_SHAPE_PROVIDER}
        clipContent={false}
        role="menu"
        aria-label={ariaLabel}
        onBlurCapture={handleBlurCapture}
        onKeyDownCapture={handleKeyDownCapture}
      >
        {children}
      </StaticContainer>
    );
  },
);

export const VerticalMenu = memo(VerticalMenuImpl);
