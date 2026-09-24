/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { flushSync } from 'react-dom';
import type {
  FocusOwner,
  InvalidFocusDirection,
  PartialFocusHandoffDetail,
  PartialFocusHandoffPhase,
  PartialFocusHandoffRect,
} from './FocusCoordinator.types';
import {
  INITIAL_FOCUS_EXCLUDED_ATTRIBUTE,
  PARTIAL_FOCUS_HANDOFF_EVENT,
} from './FocusNavigationEvents';

export {
  FOCUS_NAVIGATION_HANDLED_EVENT,
  FORCE_FOCUS_SYNC_EVENT,
  INITIAL_FOCUS_EXCLUDED_ATTRIBUTE,
  INVALID_FOCUS_DIRECTION_EVENT,
  PARTIAL_FOCUS_HANDOFF_EVENT,
} from './FocusNavigationEvents';
export { PartialFocusSupportedAxis } from './FocusCoordinator.types';
const INITIAL_FOCUS_EXCLUDED_SELECTOR =
  `[${INITIAL_FOCUS_EXCLUDED_ATTRIBUTE}="true"]`;

export type {
  FocusOwner,
  InvalidFocusDirection,
  InvalidFocusDirectionDetail,
  PartialFocusHandoffDetail,
  PartialFocusHandoffPhase,
  PartialFocusHandoffRect,
} from './FocusCoordinator.types';

const FOCUS_HANDOFF_RELATED_TARGET_FALLBACK_MS = 120;
const NAVIGATION_FOCUS_RETENTION_MS = 750;
const PAGE_TRANSITION_ELEMENT_SELECTOR = '[data-page-transition-key]';
const PAGE_TRANSITION_ACTIVE_SELECTOR = '[data-page-transition-active="true"]';
const EXITING_PAGE_SELECTOR = '[data-page-transition-phase="exiting"]';

let activeFocusOwner: FocusOwner | null = null;
const focusOwners = new Map<HTMLElement, FocusOwner>();
let focusListenersAttached = false;
const autoFocusFirstRoots = new Map<HTMLElement, number>();
let initialFocusRafId: number | null = null;
let initialFocusRequestId = 0;
let lastBlurredInteractableElement: HTMLElement | null = null;
let lastBlurredInteractableTimestamp = 0;
let pendingFocusClearRafId: number | null = null;
/**
 * Ceiling on how far retargeting may push the current hold.
 *
 * Two requirements pull against each other here, and this is the point where
 * they are reconciled:
 *
 * - A late claim must still get a usable window. Without a restart, an owner
 *   claimed near the tail of the hold is killed by the previous target's
 *   already-pending expiry — a real on-device bug, pinned by the Pager tests
 *   named `restarts the retention window when a late owner claim retargets it`
 *   and `keeps the retention window alive when a late page swap retargets it`.
 * - The hold must not survive indefinitely. Restarting on every claim with no
 *   ceiling turns continuous keyboard navigation into a rolling window: focus
 *   parked on a non-focusable ancestor keeps being treated as a boundary
 *   artifact and restored, so content can never deliberately release focus.
 *
 * One extension satisfies both: a late claim gets a fresh full window, and the
 * hold still ends at a bounded time after the navigation that opened it.
 * Do not replace this with a strict `now + NAVIGATION_FOCUS_RETENTION_MS`
 * ceiling — that reintroduces the killed-late-claim bug the Pager tests cover.
 */
const NAVIGATION_FOCUS_RETENTION_MAX_MS = NAVIGATION_FOCUS_RETENTION_MS * 2;

let navigationFocusRetentionUntil = 0;
let navigationFocusRetentionElement: HTMLElement | null = null;
let navigationFocusRetentionTargetLocked = false;
let navigationFocusRetentionTimeoutId: number | null = null;
let navigationFocusRetentionRequestId = 0;
/**
 * Absolute end of the current hold, fixed when it opens. Retargeting restarts
 * the per-target window but may never push past this.
 */
let navigationFocusRetentionHardDeadline = 0;

/**
 * Keeps the current focus owner's visual state while an embedded browser
 * temporarily focuses its document root during same-document navigation.
 */
export function preserveFocusedInteractableDuringNavigation(
  element: HTMLElement | null = null,
): () => void {
  navigationFocusRetentionRequestId += 1;
  const requestId = navigationFocusRetentionRequestId;
  navigationFocusRetentionElement = element;
  navigationFocusRetentionTargetLocked = element != null;
  // A fresh hold sets the ceiling; later retargets restart within it.
  navigationFocusRetentionHardDeadline =
    performance.now() + NAVIGATION_FOCUS_RETENTION_MAX_MS;
  scheduleNavigationFocusRetentionExpiry(requestId);
  return () => {
    if (navigationFocusRetentionRequestId === requestId) {
      if (navigationFocusRetentionTimeoutId != null) {
        window.clearTimeout(navigationFocusRetentionTimeoutId);
        navigationFocusRetentionTimeoutId = null;
      }
      navigationFocusRetentionUntil = 0;
      navigationFocusRetentionHardDeadline = 0;
      navigationFocusRetentionElement = null;
      navigationFocusRetentionTargetLocked = false;
    }
  };
}

function isNavigationFocusRetentionWindowActive(): boolean {
  return (
    navigationFocusRetentionUntil > 0 &&
    performance.now() <= navigationFocusRetentionUntil
  );
}

/**
 * Opens (or reopens) the retention window and schedules its expiry. The expiry
 * is keyed on `requestId` so a newer hold started while this one is pending
 * wins: the stale timeout observes the bumped id and leaves state alone.
 */
function scheduleNavigationFocusRetentionExpiry(requestId: number): void {
  if (navigationFocusRetentionTimeoutId != null) {
    window.clearTimeout(navigationFocusRetentionTimeoutId);
  }
  const now = performance.now();
  // Never extend past the original hold's ceiling. Retargeting exists so a new
  // target is not killed by the previous target's pending expiry — not to buy
  // the hold more total time.
  const cap =
    navigationFocusRetentionHardDeadline > 0
      ? navigationFocusRetentionHardDeadline
      : now + NAVIGATION_FOCUS_RETENTION_MAX_MS;
  navigationFocusRetentionUntil = Math.min(
    now + NAVIGATION_FOCUS_RETENTION_MS,
    cap,
  );
  const delay = Math.max(0, navigationFocusRetentionUntil - now);
  navigationFocusRetentionTimeoutId = window.setTimeout(() => {
    if (navigationFocusRetentionRequestId === requestId) {
      navigationFocusRetentionUntil = 0;
      navigationFocusRetentionHardDeadline = 0;
      navigationFocusRetentionElement = null;
      navigationFocusRetentionTargetLocked = false;
      navigationFocusRetentionTimeoutId = null;
    }
  }, delay);
}

function isNavigationFocusTargetReachable(element: HTMLElement): boolean {
  return (
    element.isConnected &&
    element.closest('[inert], [aria-hidden="true"], [hidden]') == null
  );
}

function isFocusParkedOnContainerAncestor(
  target: HTMLElement,
  activeElement: Element | null = document.activeElement,
): boolean {
  return (
    activeElement instanceof HTMLElement &&
    activeElement !== target &&
    activeElement !== document.body &&
    activeElement !== document.documentElement &&
    activeElement.tabIndex < 0 &&
    activeElement.contains(target)
  );
}

function isFocusAtApplicationBoundaryForTarget(
  target: HTMLElement,
  activeElement: Element | null = document.activeElement,
): boolean {
  return (
    activeElement === document.body ||
    activeElement === document.documentElement ||
    isFocusParkedOnContainerAncestor(target, activeElement)
  );
}

function isNavigationFocusRetentionActive(): boolean {
  if (!isNavigationFocusRetentionWindowActive()) {
    return false;
  }

  const target = navigationFocusRetentionElement;
  return (
    target == null ||
    (
      isNavigationFocusTargetReachable(target) &&
      (
        target === activeFocusOwner?.element ||
        target === document.activeElement ||
        isFocusAtApplicationBoundaryForTarget(target)
      )
    )
  );
}

/**
 * Moves a generic same-document focus hold to a structural target that just
 * received focus, such as a Pager page with no focusable descendants.
 */
export function retargetNavigationFocusRetention(element: HTMLElement): void {
  if (
    !isNavigationFocusRetentionWindowActive() ||
    navigationFocusRetentionTargetLocked ||
    !isNavigationFocusTargetReachable(element)
  ) {
    return;
  }

  navigationFocusRetentionElement = element;
  // Retargeting starts a fresh hold for the new target. Without this the new
  // target inherits the original deadline, so a retarget near the tail of the
  // window is defeated by the already-pending expiry: it clears the window
  // first, and the queued restore then bails on an inactive retention, leaving
  // an empty page unfocused.
  //
  // The request id is deliberately NOT bumped. It identifies the hold's owner,
  // and the caller of `preserveFocusedInteractableDuringNavigation` still holds
  // a cleanup keyed to it; bumping would silently turn that cleanup into a
  // no-op and strand the hold until it timed out. Rescheduling under the same
  // id keeps both the caller's cleanup and the expiry correct.
  scheduleNavigationFocusRetentionExpiry(navigationFocusRetentionRequestId);
}

export function directionForArrowKey(key: string): InvalidFocusDirection | null {
  switch (key) {
    case 'ArrowUp':
      return 'up';
    case 'ArrowDown':
      return 'down';
    case 'ArrowLeft':
      return 'left';
    case 'ArrowRight':
      return 'right';
    default:
      return null;
  }
}

export function getFocusOwner(element: HTMLElement): FocusOwner | undefined {
  return focusOwners.get(element);
}

/**
 * Register/unregister an owner that wants the coordinator's automatic initial
 * focus of the top-left interactable. Refcounted: auto-focus stays on while any
 * owner is registered, so a provider unmounting does not disable it for a still-
 * mounted provider. Off by default so the coordinator does not fight native
 * focus; threaded from FocusNavigationProvider's `autoFocusFirst` prop. Returns
 * a cleanup that releases this owner exactly once.
 */
export function registerAutoFocusFirstOwner(root: HTMLElement): () => void {
  autoFocusFirstRoots.set(root, (autoFocusFirstRoots.get(root) ?? 0) + 1);
  scheduleInitialFocusIfNeeded();
  let released = false;
  return () => {
    if (released) {
      return;
    }
    released = true;
    const ownerCount = autoFocusFirstRoots.get(root) ?? 0;
    if (ownerCount <= 1) {
      autoFocusFirstRoots.delete(root);
    } else {
      autoFocusFirstRoots.set(root, ownerCount - 1);
    }
  };
}

export function isInitialFocusEligibleElement(element: HTMLElement): boolean {
  return element.closest(INITIAL_FOCUS_EXCLUDED_SELECTOR) == null;
}

export function rememberBlurredInteractableElement(element: HTMLElement): void {
  lastBlurredInteractableElement = element;
  lastBlurredInteractableTimestamp = performance.now();
}

export function dispatchPartialFocusHandoff(
  element: HTMLElement,
  phase: PartialFocusHandoffPhase,
  otherElement: HTMLElement | null,
  animated: boolean = true,
): void {
  element.dispatchEvent(
    new CustomEvent<PartialFocusHandoffDetail>(PARTIAL_FOCUS_HANDOFF_EVENT, {
      detail: {
        phase,
        otherRect: otherElement == null ? null : rectForHandoff(otherElement),
        animated,
      },
    }),
  );
}

export function claimFocusedInteractable(nextOwner: FocusOwner): void {
  cancelPendingFocusClear();

  if (
    isNavigationFocusRetentionWindowActive() &&
    !navigationFocusRetentionTargetLocked &&
    isNavigationFocusTargetReachable(nextOwner.element)
  ) {
    navigationFocusRetentionElement = nextOwner.element;
    // Same contract as `retargetNavigationFocusRetention`: moving the hold to a
    // new target restarts its window. Without this the new owner inherits the
    // original deadline, so a claim late in the window is undone by the
    // already-pending expiry before the hold can protect it.
    scheduleNavigationFocusRetentionExpiry(navigationFocusRetentionRequestId);
  }

  if (activeFocusOwner?.element === nextOwner.element) {
    activeFocusOwner = nextOwner;
    return;
  }

  const previousElement =
    activeFocusOwner?.element ?? recentBlurredInteractableElement(nextOwner.element);
  activeFocusOwner?.clearFocus();
  activeFocusOwner = nextOwner;

  if (
    previousElement != null &&
    previousElement.isConnected &&
    previousElement !== nextOwner.element &&
    shouldAnimatePartialFocusHandoff(previousElement, nextOwner)
  ) {
    dispatchPartialFocusHandoff(previousElement, 'outgoing', nextOwner.element);
    dispatchPartialFocusHandoff(nextOwner.element, 'incoming', previousElement);
  } else {
    if (
      previousElement != null &&
      previousElement.isConnected &&
      previousElement !== nextOwner.element
    ) {
      dispatchPartialFocusHandoff(previousElement, 'reset', null, false);
    }
    dispatchPartialFocusHandoff(nextOwner.element, 'reset', null, false);
  }
}

export function releaseFocusedInteractable(element: HTMLElement): void {
  if (activeFocusOwner?.element === element) {
    cancelPendingFocusClear();
    activeFocusOwner = null;
  }
}

export function shouldRetainFocusedInteractableOnBlur(
  element: HTMLElement,
  nextTarget: EventTarget | null,
): boolean {
  if (activeFocusOwner?.element !== element) {
    return false;
  }

  const targetElement = elementFromFocusTarget(nextTarget);
  if (
    isNavigationFocusRetentionActive() &&
    isNavigationFocusTargetReachable(element) &&
    (
      navigationFocusRetentionElement == null ||
      navigationFocusRetentionElement === element
    ) &&
    (
      targetElement == null ||
      isFocusAtApplicationBoundaryForTarget(element, targetElement)
    )
  ) {
    return true;
  }
  if (targetElement == null) {
    return element.closest(PAGE_TRANSITION_ELEMENT_SELECTOR) != null;
  }

  if (
    targetElement === element ||
    activeElementHasFocusOwner(targetElement) ||
    targetElement.getAttribute('role') != null
  ) {
    return false;
  }

  return (
    isPageTransitionActive() ||
    targetElement.closest(PAGE_TRANSITION_ELEMENT_SELECTOR) != null ||
    targetElement.querySelector(PAGE_TRANSITION_ELEMENT_SELECTOR) != null
  );
}

function attachFocusListeners(): void {
  if (focusListenersAttached) return;
  focusListenersAttached = true;
  document.addEventListener('focusin', reconcileFocusedInteractable);
  document.addEventListener('focusout', reconcileFocusedInteractable);
}

function detachFocusListeners(): void {
  if (!focusListenersAttached) return;
  focusListenersAttached = false;
  document.removeEventListener('focusin', reconcileFocusedInteractable);
  document.removeEventListener('focusout', reconcileFocusedInteractable);
}

function cancelPendingFocusClear(): void {
  if (pendingFocusClearRafId == null) {
    return;
  }

  window.cancelAnimationFrame(pendingFocusClearRafId);
  pendingFocusClearRafId = null;
}

function activeElementHasFocusOwner(activeElement: HTMLElement): boolean {
  for (const owner of focusOwners.values()) {
    if (owner.element === activeElement || owner.element.contains(activeElement)) {
      return true;
    }
  }

  return false;
}

function isPageTransitionActive(): boolean {
  return document.querySelector(PAGE_TRANSITION_ACTIVE_SELECTOR) != null;
}

function isUnownedPageTransitionFocusElement(activeElement: HTMLElement): boolean {
  return (
    isPageTransitionActive() &&
    !activeElementHasFocusOwner(activeElement) &&
    activeElement.getAttribute('role') == null
  );
}

function isFocusEffectivelyEmpty(): boolean {
  const active = document.activeElement;
  if (active == null || active === document.body || active === document.documentElement) {
    return true;
  }

  if (!(active instanceof HTMLElement)) {
    return false;
  }

  const navigationTarget =
    navigationFocusRetentionElement ?? activeFocusOwner?.element ?? null;
  if (
    isNavigationFocusRetentionActive() &&
    navigationTarget != null &&
    !activeElementHasFocusOwner(active) &&
    isFocusAtApplicationBoundaryForTarget(navigationTarget, active)
  ) {
    return true;
  }

  if (isUnownedPageTransitionFocusElement(active)) {
    return true;
  }

  return active.tabIndex < 0 && !activeElementHasFocusOwner(active);
}

function getActiveAutoFocusRoot(): HTMLElement | null {
  const activeElement = document.activeElement;
  let activeRoot: HTMLElement | null = null;
  if (activeElement instanceof Element) {
    for (const root of autoFocusFirstRoots.keys()) {
      if (
        root.contains(activeElement) &&
        (activeRoot == null || activeRoot.contains(root))
      ) {
        activeRoot = root;
      }
    }
  }

  if (activeRoot != null) {
    return activeRoot;
  }
  return Array.from(autoFocusFirstRoots.keys()).find(root => root.isConnected) ?? null;
}

function findTopLeftFocusOwner(): FocusOwner | null {
  const root = getActiveAutoFocusRoot();
  if (root == null) {
    return null;
  }
  let best: FocusOwner | null = null;
  let bestTop = Infinity;
  let bestLeft = Infinity;

  for (const owner of focusOwners.values()) {
    if (!owner.element.isConnected) continue;
    if (!root.contains(owner.element)) continue;
    if (!owner.initialFocusEligible || !isInitialFocusEligibleElement(owner.element)) continue;
    // Skip elements on exiting pages — they are about to be removed and
    // should not receive initial focus.
    if (owner.element.closest('[data-page-transition-phase="exiting"]') != null) continue;
    const rect = owner.element.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) continue;

    if (
      rect.top < bestTop - 1 ||
      (Math.abs(rect.top - bestTop) <= 1 && rect.left < bestLeft - 1)
    ) {
      best = owner;
      bestTop = rect.top;
      bestLeft = rect.left;
    }
  }

  return best;
}

function isFocusOnExitingPage(): boolean {
  const active = document.activeElement;
  if (!(active instanceof HTMLElement)) return false;
  return active.closest('[data-page-transition-phase="exiting"]') != null;
}

/**
 * Whether the active owner's focus loss is a transition artifact the
 * coordinator should undo, rather than a real focus exit.
 *
 * While a page transition is running — or the owner sits on the page being
 * torn down — any empty focus is an artifact of the swap and is recovered.
 *
 * Outside a transition the test is deliberately narrower. A same-document
 * navigation can park focus on a non-focusable ancestor such as the
 * application root, which is recoverable. Focus deliberately moved to
 * `document.body` (a background click, an explicit `blur()`) is a real exit:
 * recovering it would mean that content inside a `PageTransition` page — which
 * is most application content — could never release focus at all.
 */
function shouldRetainTransitionFocusOwner(): boolean {
  if (activeFocusOwner == null || !activeFocusOwner.element.isConnected) {
    return false;
  }

  if (
    isPageTransitionActive() ||
    activeFocusOwner.element.closest(EXITING_PAGE_SELECTOR) != null
  ) {
    return isFocusEffectivelyEmpty();
  }

  return (
    activeFocusOwner.element.closest(PAGE_TRANSITION_ELEMENT_SELECTOR) != null &&
    isFocusParkedOnContainerAncestor(activeFocusOwner.element)
  );
}

function navigationFocusRetentionTargetsOwner(owner: FocusOwner): boolean {
  return (
    navigationFocusRetentionElement == null ||
    navigationFocusRetentionElement === owner.element
  );
}

function shouldRetainNavigationFocusOwner(): boolean {
  return (
    isNavigationFocusRetentionActive() &&
    activeFocusOwner != null &&
    isNavigationFocusTargetReachable(activeFocusOwner.element) &&
    navigationFocusRetentionTargetsOwner(activeFocusOwner) &&
    isFocusAtApplicationBoundaryForTarget(activeFocusOwner.element)
  );
}

function restoreFocusToRetainedOwner(
  owner: FocusOwner,
  retainForNavigation: boolean,
  retainForTransition: boolean,
): void {
  queueMicrotask(() => {
    const canRestoreForNavigation =
      retainForNavigation && shouldRetainNavigationFocusOwner();
    const canRestoreForTransition =
      retainForTransition && shouldRetainTransitionFocusOwner();
    if (
      activeFocusOwner !== owner ||
      document.activeElement === owner.element ||
      (!canRestoreForNavigation && !canRestoreForTransition)
    ) {
      return;
    }

    owner.element.focus({ preventScroll: true });
  });
}

function restoreFocusToRetargetedNavigationElement(): void {
  const target = navigationFocusRetentionElement;
  if (
    target == null ||
    target === activeFocusOwner?.element ||
    !isNavigationFocusRetentionActive() ||
    !isFocusAtApplicationBoundaryForTarget(target)
  ) {
    return;
  }

  queueMicrotask(() => {
    if (
      navigationFocusRetentionElement !== target ||
      !isNavigationFocusRetentionActive() ||
      document.activeElement === target ||
      !isFocusAtApplicationBoundaryForTarget(target)
    ) {
      return;
    }

    target.focus({ preventScroll: true });
  });
}

function clearFocusedOwner(owner: FocusOwner): void {
  owner.clearFocus();
  if (activeFocusOwner === owner) {
    activeFocusOwner = null;
  }
}

function scheduleFocusedOwnerClear(owner: FocusOwner): void {
  if (pendingFocusClearRafId != null) {
    return;
  }

  pendingFocusClearRafId = window.requestAnimationFrame(() => {
    pendingFocusClearRafId = null;

    if (activeFocusOwner !== owner || document.activeElement === owner.element) {
      return;
    }

    const retainForNavigation = shouldRetainNavigationFocusOwner();
    const retainForTransition = shouldRetainTransitionFocusOwner();
    if (retainForNavigation || retainForTransition) {
      restoreFocusToRetainedOwner(
        owner,
        retainForNavigation,
        retainForTransition,
      );
      scheduleInitialFocusIfNeeded();
      return;
    }

    if (!isFocusEffectivelyEmpty()) {
      reconcileFocusedInteractable();
      return;
    }

    clearFocusedOwner(owner);
  });
}

function scheduleInitialFocusIfNeeded(): void {
  // Auto initial focus is opt-in. When disabled (default) the coordinator never
  // claims document focus on its own, leaving native focus order intact.
  if (autoFocusFirstRoots.size === 0) {
    return;
  }

  // Cancel any pending check so we always use the latest registration state.
  // Multiple components may register in rapid succession (or after lazy load);
  // we want the check to run after all of them have settled.
  initialFocusRequestId += 1;
  const requestId = initialFocusRequestId;
  if (initialFocusRafId != null) {
    window.cancelAnimationFrame(initialFocusRafId);
    initialFocusRafId = null;
  }

  const runInitialFocus = (): boolean => {
    if (requestId !== initialFocusRequestId) return false;

    // If something on the *active* page already has focus (e.g. PageTransition
    // set it, or user clicked an element), respect that and do nothing.
    // Focus on an exiting page is treated as stale — we should claim focus for
    // the incoming page instead.
    if (!isFocusEffectivelyEmpty() && !isFocusOnExitingPage()) return false;

    // If there is already an active focus owner whose element is still
    // connected and not on an exiting page, nothing to do.
    if (
      activeFocusOwner != null &&
      activeFocusOwner.element.isConnected &&
      activeFocusOwner.element.closest('[data-page-transition-phase="exiting"]') == null
    ) {
      return false;
    }

    const topLeft = findTopLeftFocusOwner();
    if (topLeft == null) return false;

    // If the target element is already the active element, skip the redundant
    // .focus() call. This avoids a visible focus flicker (focus → blur → focus)
    // that occurs when PageTransition's focus restoration and FocusCoordinator's
    // auto-focus both target the same element.
    if (document.activeElement === topLeft.element) return true;

    flushSync(() => {
      claimFocusedInteractable(topLeft);
      topLeft.applyFocus(true);
    });
    topLeft.element.focus({ preventScroll: true });
    // The focusin listener reconciles browser focus after the visual state has
    // already been applied, so the first painted focused frame is not default.
    return true;
  };

  queueMicrotask(() => {
    if (runInitialFocus() && initialFocusRafId != null) {
      window.cancelAnimationFrame(initialFocusRafId);
      initialFocusRafId = null;
    }
  });

  initialFocusRafId = window.requestAnimationFrame(() => {
    initialFocusRafId = null;
    runInitialFocus();
  });
}

export function registerFocusOwner(owner: FocusOwner): void {
  focusOwners.set(owner.element, owner);
  attachFocusListeners();
  reconcileFocusedInteractable();
  scheduleInitialFocusIfNeeded();
}

export function unregisterFocusOwner(element: HTMLElement): void {
  const wasActive = activeFocusOwner?.element === element;
  focusOwners.delete(element);
  releaseFocusedInteractable(element);
  if (focusOwners.size === 0) {
    detachFocusListeners();
  }
  reconcileFocusedInteractable();

  // When the previously focused element unregisters (e.g. page unmounts after
  // a transition), schedule an auto-focus check so the new page's top-left
  // element receives focus.
  if (wasActive && focusOwners.size > 0) {
    scheduleInitialFocusIfNeeded();
  }
}

function elementFromFocusTarget(target: EventTarget | null): HTMLElement | null {
  return target instanceof HTMLElement ? target : null;
}

function recentBlurredInteractableElement(current: HTMLElement): HTMLElement | null {
  if (
    lastBlurredInteractableElement != null &&
    lastBlurredInteractableElement !== current &&
    performance.now() - lastBlurredInteractableTimestamp <
      FOCUS_HANDOFF_RELATED_TARGET_FALLBACK_MS
  ) {
    return lastBlurredInteractableElement;
  }

  return null;
}

function shouldAnimatePartialFocusHandoff(
  previousElement: HTMLElement,
  nextOwner: FocusOwner,
): boolean {
  const nextElement = nextOwner.element;
  if (
    previousElement.closest(EXITING_PAGE_SELECTOR) != null ||
    nextElement.closest(EXITING_PAGE_SELECTOR) != null
  ) {
    return false;
  }

  const previousPage = previousElement.closest(PAGE_TRANSITION_ELEMENT_SELECTOR);
  const nextPage = nextElement.closest(PAGE_TRANSITION_ELEMENT_SELECTOR);

  return previousPage == null || nextPage == null || previousPage === nextPage;
}

function rectForHandoff(element: HTMLElement): PartialFocusHandoffRect {
  const rect = element.getBoundingClientRect();
  return {
    left: rect.left,
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    width: rect.width,
    height: rect.height,
    x: rect.x,
    y: rect.y,
  };
}

function reconcileFocusedInteractable(): void {
  const activeElement = document.activeElement;
  restoreFocusToRetargetedNavigationElement();
  const activeOwner =
    activeElement instanceof HTMLElement ? focusOwners.get(activeElement) : undefined;

  if (activeOwner != null) {
    cancelPendingFocusClear();
    const wasAlreadyClaimed = activeFocusOwner?.element === activeOwner.element;
    claimFocusedInteractable(activeOwner);
    activeOwner.applyFocus(!wasAlreadyClaimed);
    return;
  }

  if (activeFocusOwner != null && activeFocusOwner.element !== activeElement) {
    const retainForNavigation = shouldRetainNavigationFocusOwner();
    const retainForTransition = shouldRetainTransitionFocusOwner();
    if (retainForNavigation || retainForTransition) {
      restoreFocusToRetainedOwner(
        activeFocusOwner,
        retainForNavigation,
        retainForTransition,
      );
      scheduleInitialFocusIfNeeded();
      return;
    }

    if (isFocusEffectivelyEmpty()) {
      scheduleFocusedOwnerClear(activeFocusOwner);
      return;
    }

    cancelPendingFocusClear();
    clearFocusedOwner(activeFocusOwner);
  }
}

/**
 * Returns true when the given element is the document's active element AND
 * the FocusCoordinator has already claimed it as the active focus owner.
 * PageTransition uses this to avoid redundant blur/focus cycles when
 * restoring focus — if the coordinator already recognises the element,
 * re-focusing would only cause a visible flicker.
 */
export function isFocusAlreadySyncedForElement(element: HTMLElement): boolean {
  return (
    document.activeElement === element &&
    activeFocusOwner != null &&
    activeFocusOwner.element === element
  );
}

export function focusElementFromTarget(target: EventTarget | null): HTMLElement | null {
  return elementFromFocusTarget(target);
}
