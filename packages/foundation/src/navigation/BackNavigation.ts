/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useEffect, useLayoutEffect, useRef } from 'react';

export type BackNavigationHandler = () => boolean | void;

const BACK_NAVIGATION_KEYS = new Set([
  'Escape',
  'Backspace',
  'BrowserBack',
  'GoBack',
]);

// Input types that do not accept text entry. Backspace in these is not typing,
// so it stays a Back alias. Every other type — text, search, email, password,
// and any future type — is treated as text entry, which is the safe default:
// suppressing Back is recoverable, swallowing a keystroke mid-word is not.
const NON_TEXT_INPUT_TYPES = new Set([
  'button',
  'checkbox',
  'color',
  'file',
  'hidden',
  'image',
  'radio',
  'range',
  'reset',
  'submit',
]);

function isTextEntryElement(element: Element | null): boolean {
  if (element instanceof HTMLTextAreaElement) {
    return true;
  }
  if (element instanceof HTMLInputElement) {
    return !NON_TEXT_INPUT_TYPES.has(element.type);
  }
  return false;
}

function isContentEditableTarget(element: HTMLElement): boolean {
  // `isContentEditable` is inherited, so it also covers descendants of an
  // editable host. jsdom does not implement it, hence the attribute walk below.
  if (element.isContentEditable) {
    return true;
  }
  const host = element.closest?.('[contenteditable]');
  // A bare `contenteditable` and `contenteditable=""` both mean true per the
  // HTML spec; only an explicit "false" opts out.
  return host != null && host.getAttribute('contenteditable') !== 'false';
}

function isEditableBackTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  // `closest` includes the element itself, so one call covers both a focused
  // field and a target nested inside one.
  const field = target.closest?.('input, textarea') ?? null;
  return isTextEntryElement(field) || isContentEditableTarget(target);
}

/**
 * Shared Back-alias predicate. `Backspace` is ignored while the event target is
 * text entry — a text-accepting input, a textarea, or a contenteditable
 * subtree — so typing never navigates. Non-text inputs (checkbox, radio, range,
 * button, submit, …) are controls, not fields, so Backspace remains Back there.
 * Escape/BrowserBack/GoBack remain aliases everywhere.
 */
export function isBackNavigationKey(
  event: Pick<KeyboardEvent, 'key'> & { readonly target?: EventTarget | null },
): boolean {
  if (!BACK_NAVIGATION_KEYS.has(event.key)) {
    return false;
  }
  if (event.key === 'Backspace' && isEditableBackTarget(event.target ?? null)) {
    return false;
  }
  return true;
}

interface TransientBackNavigationOptions {
  /** Root used to prefer the owner that currently contains document focus. */
  focusRootRef?: { readonly current: HTMLElement | null };
  /**
   * Whether keyboard Back aliases should invoke the transient handler outside
   * its subtree. The option retains its established name for compatibility.
   */
  handleEscape?: boolean;
  /** Higher-priority layers handle Back before lower-priority layers. */
  priority?: number;
  /** Whether disarming should restore the focus captured when the entry armed. */
  restoreFocus?: boolean;
}

interface TransientBackOwner {
  id: number;
  getHandler: () => (() => boolean | void) | undefined;
  getFocusRoot: () => HTMLElement | null;
  handleKeyboardBack: boolean;
  priority: number;
  restoreFocus: boolean;
  returnFocusTargetRef: { current: HTMLElement | null };
}

const TRANSIENT_BACK_STATE_KEY = '__uitTransientBackEntry';
const CLEANUP_FOCUS_POPSTATE_TIMEOUT_MS = 1000;
const RETIRED_ENTRY_SKIP_TIMEOUT_MS = 1000;
const MAX_MINTED_TRANSIENT_BACK_ENTRY_IDS = 64;
let nextTransientBackEntryId = 0;
let nextTransientBackOwnerId = 0;
let activeTransientBackEntryId: string | null = null;
let rearmAfterRetiredEntrySkip = false;
let retiredEntrySkipTimeoutId: number | null = null;
// Keep a bounded registry of entries actually minted by this module. This
// distinguishes retired transient entries from copied/foreign state without
// retaining one id for the lifetime of every popup opened in the session.
const mintedTransientBackEntryIds = new Set<string>();
let reconcileTimeoutId: number | null = null;
let cleanupFocusTarget: HTMLElement | null = null;
let cleanupPopStateListener: (() => void) | null = null;
let cleanupPopStateTimeoutId: number | null = null;
let transientPopStateListenerAttached = false;
let transientKeyDownListenerAttached = false;
const transientBackOwners: TransientBackOwner[] = [];

function rememberMintedTransientBackEntry(entryId: string): void {
  mintedTransientBackEntryIds.add(entryId);
  if (mintedTransientBackEntryIds.size > MAX_MINTED_TRANSIENT_BACK_ENTRY_IDS) {
    const oldestEntryId = mintedTransientBackEntryIds.values().next().value;
    if (oldestEntryId != null) {
      mintedTransientBackEntryIds.delete(oldestEntryId);
    }
  }
}

function getTransientBackEntryId(state: unknown): string | null {
  if (state == null || typeof state !== 'object') {
    return null;
  }
  const entryId = (state as Record<string, unknown>)[TRANSIENT_BACK_STATE_KEY];
  return typeof entryId === 'string' ? entryId : null;
}

function getTopTransientBackOwner(
  requireKeyboardBack: boolean = false,
): TransientBackOwner | undefined {
  const activeElement = document.activeElement;
  return transientBackOwners.reduce<TransientBackOwner | undefined>(
    (topOwner, owner) => {
      if (requireKeyboardBack && !owner.handleKeyboardBack) {
        return topOwner;
      }
      if (topOwner == null || owner.priority > topOwner.priority) {
        return owner;
      }
      if (owner.priority < topOwner.priority) {
        return topOwner;
      }

      const ownerRoot = owner.getFocusRoot();
      const topRoot = topOwner.getFocusRoot();
      const ownerContainsFocus =
        activeElement instanceof Node && ownerRoot?.contains(activeElement) === true;
      const topContainsFocus =
        activeElement instanceof Node && topRoot?.contains(activeElement) === true;
      if (ownerContainsFocus !== topContainsFocus) {
        return ownerContainsFocus ? owner : topOwner;
      }
      if (
        ownerRoot != null &&
        topRoot != null &&
        ownerRoot !== topRoot
      ) {
        // Nested owners always prefer the innermost reachable surface, even
        // while focus is temporarily at the application boundary.
        if (topRoot.contains(ownerRoot)) {
          return owner;
        }
        if (ownerRoot.contains(topRoot)) {
          return topOwner;
        }
      }
      return owner.id > topOwner.id ? owner : topOwner;
    },
    undefined,
  );
}

function restoreCleanupFocus(focusTarget: HTMLElement): void {
  if (!focusTarget.isConnected) {
    return;
  }
  window.requestAnimationFrame(() => {
    if (!focusTarget.isConnected) {
      return;
    }
    const activeElement = document.activeElement;
    const focusIsAtApplicationBoundary =
      activeElement == null ||
      activeElement === document.body ||
      activeElement === document.documentElement ||
      (
        activeElement instanceof HTMLElement &&
        activeElement.tabIndex < 0 &&
        activeElement.contains(focusTarget)
      );
    if (focusIsAtApplicationBoundary) {
      focusTarget.focus({ preventScroll: true });
    }
  });
}

function cancelCleanupFocusRestoration(): void {
  cleanupFocusTarget = null;
  if (cleanupPopStateListener != null) {
    window.removeEventListener('popstate', cleanupPopStateListener);
    cleanupPopStateListener = null;
  }
  if (cleanupPopStateTimeoutId != null) {
    window.clearTimeout(cleanupPopStateTimeoutId);
    cleanupPopStateTimeoutId = null;
  }
}

function waitToRestoreCleanupFocus(focusTarget: HTMLElement): void {
  cancelCleanupFocusRestoration();
  const listener = () => {
    cleanupPopStateListener = null;
    if (cleanupPopStateTimeoutId != null) {
      window.clearTimeout(cleanupPopStateTimeoutId);
      cleanupPopStateTimeoutId = null;
    }
    restoreCleanupFocus(focusTarget);
  };
  cleanupPopStateListener = listener;
  window.addEventListener('popstate', listener, { once: true });
  cleanupPopStateTimeoutId = window.setTimeout(
    cancelCleanupFocusRestoration,
    CLEANUP_FOCUS_POPSTATE_TIMEOUT_MS,
  );
}

function pushTransientBackEntry(): void {
  if (transientBackOwners.length === 0 || rearmAfterRetiredEntrySkip) {
    return;
  }
  if (activeTransientBackEntryId != null) {
    if (
      getTransientBackEntryId(window.history.state) ===
      activeTransientBackEntryId
    ) {
      return;
    }
    activeTransientBackEntryId = null;
  }
  const entryId = `${Date.now()}-${++nextTransientBackEntryId}`;
  rememberMintedTransientBackEntry(entryId);
  const currentState = window.history.state;
  const nextState =
    currentState != null && typeof currentState === 'object'
      ? { ...currentState }
      : {};
  nextState[TRANSIENT_BACK_STATE_KEY] = entryId;
  History.prototype.pushState.call(
    window.history,
    nextState,
    '',
    window.location.href,
  );
  activeTransientBackEntryId = entryId;
}

function reconcileTransientBackEntry(): void {
  reconcileTimeoutId = null;
  if (transientBackOwners.length > 0) {
    pushTransientBackEntry();
    return;
  }

  const entryId = activeTransientBackEntryId;
  if (entryId == null) {
    cleanupFocusTarget = null;
    return;
  }
  activeTransientBackEntryId = null;
  if (getTransientBackEntryId(window.history.state) !== entryId) {
    cleanupFocusTarget = null;
    return;
  }

  const focusTarget = cleanupFocusTarget;
  cleanupFocusTarget = null;
  if (focusTarget != null) {
    waitToRestoreCleanupFocus(focusTarget);
  }
  window.history.back();
}

function scheduleTransientBackReconciliation(): void {
  if (reconcileTimeoutId != null) {
    window.clearTimeout(reconcileTimeoutId);
  }
  reconcileTimeoutId = window.setTimeout(reconcileTransientBackEntry, 0);
}

function finishRetiredEntrySkip(): void {
  rearmAfterRetiredEntrySkip = false;
  if (retiredEntrySkipTimeoutId != null) {
    window.clearTimeout(retiredEntrySkipTimeoutId);
    retiredEntrySkipTimeoutId = null;
  }
  scheduleTransientBackReconciliation();
}

function scheduleRetiredEntrySkipFallback(): void {
  if (retiredEntrySkipTimeoutId != null) {
    window.clearTimeout(retiredEntrySkipTimeoutId);
  }
  retiredEntrySkipTimeoutId = window.setTimeout(
    finishRetiredEntrySkip,
    RETIRED_ENTRY_SKIP_TIMEOUT_MS,
  );
}

function handleTransientPopState(event: PopStateEvent): void {
  const destinationEntryId = getTransientBackEntryId(event.state);
  // Only ignore a traversal onto the live entry while no owner is
  // registered (a retire-then-reconcile window). When an owner is live,
  // arriving onto the entry means foreign code pushed history above it
  // and Back is now returning: run the handler to dismiss instead of
  // swallowing the press. A forward traversal onto the live id cannot
  // occur, since popping the entry nulls or rotates the active id.
  if (
    activeTransientBackEntryId != null &&
    destinationEntryId === activeTransientBackEntryId &&
    transientBackOwners.length === 0
  ) {
    return;
  }

  const destinationIsRetiredEntry =
    destinationEntryId != null &&
    destinationEntryId !== activeTransientBackEntryId &&
    mintedTransientBackEntryIds.has(destinationEntryId);
  if (destinationIsRetiredEntry) {
    if (activeTransientBackEntryId != null) {
      // A newer owner armed before an asynchronous cleanup traversal reached
      // this retired entry. Its new entry is now ahead in history; defer
      // re-arming until the stale entry has been skipped so the old traversal
      // cannot dismiss the new owner.
      activeTransientBackEntryId = null;
      rearmAfterRetiredEntrySkip = true;
      scheduleRetiredEntrySkipFallback();
    }
    window.history.back();
    return;
  }

  if (rearmAfterRetiredEntrySkip) {
    finishRetiredEntrySkip();
    return;
  }

  if (activeTransientBackEntryId == null) {
    return;
  }

  activeTransientBackEntryId = null;
  const handled = getTopTransientBackOwner()?.getHandler()?.();
  if (handled === false) {
    pushTransientBackEntry();
  } else {
    scheduleTransientBackReconciliation();
  }
}

function handleTransientKeyDown(event: KeyboardEvent): void {
  if (
    !isBackNavigationKey(event) ||
    event.repeat ||
    event.defaultPrevented ||
    (event as KeyboardEvent & { __uitForwardedPopupBack?: boolean })
      .__uitForwardedPopupBack === true
  ) {
    return;
  }
  const owner = getTopTransientBackOwner(true);
  if (owner == null) {
    return;
  }

  const handled = owner.getHandler()?.();
  if (handled !== false) {
    event.preventDefault();
  }
}

function ensureTransientListeners(): void {
  if (!transientPopStateListenerAttached) {
    transientPopStateListenerAttached = true;
    window.addEventListener('popstate', handleTransientPopState);
  }
  if (!transientKeyDownListenerAttached) {
    transientKeyDownListenerAttached = true;
    document.addEventListener('keydown', handleTransientKeyDown);
  }
}

function removeTransientKeyDownListenerIfIdle(): void {
  if (transientBackOwners.length === 0 && transientKeyDownListenerAttached) {
    transientKeyDownListenerAttached = false;
    document.removeEventListener('keydown', handleTransientKeyDown);
  }
}

function registerTransientBackOwner(owner: TransientBackOwner): () => void {
  cancelCleanupFocusRestoration();
  transientBackOwners.push(owner);
  ensureTransientListeners();
  if (reconcileTimeoutId != null) {
    window.clearTimeout(reconcileTimeoutId);
    reconcileTimeoutId = null;
  }
  pushTransientBackEntry();

  return () => {
    const ownerIndex = transientBackOwners.indexOf(owner);
    if (ownerIndex !== -1) {
      transientBackOwners.splice(ownerIndex, 1);
    }
    removeTransientKeyDownListenerIfIdle();
    if (
      transientBackOwners.length === 0 &&
      owner.restoreFocus &&
      owner.returnFocusTargetRef.current?.isConnected
    ) {
      cleanupFocusTarget = owner.returnFocusTargetRef.current;
    }
    scheduleTransientBackReconciliation();
  };
}

/**
 * Handles unclaimed keyboard Back aliases at the application boundary.
 *
 * Return `false` when the host cannot navigate back. Any other return value
 * claims the event and prevents the browser's default handling.
 */
export function useBackNavigation(handler: BackNavigationHandler): void {
  const handlerRef = useRef(handler);
  useLayoutEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        !isBackNavigationKey(event) ||
        event.repeat ||
        event.defaultPrevented
      ) {
        return;
      }

      if (handlerRef.current() !== false) {
        event.preventDefault();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
}

/**
 * Shares one same-URL browser-history entry across mounted temporary layers so
 * system Back dismisses only the highest-priority layer before route history.
 */
export function useTransientBackNavigation(
  handler: (() => boolean | void) | undefined,
  returnFocusTarget?: HTMLElement | null,
  {
    focusRootRef,
    handleEscape: handleKeyboardBack = true,
    priority = 0,
    restoreFocus = true,
  }: TransientBackNavigationOptions = {},
): void {
  const handlerRef = useRef(handler);
  const returnFocusTargetRef = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    handlerRef.current = handler;
    if (returnFocusTarget != null) {
      returnFocusTargetRef.current = returnFocusTarget;
    }
  }, [handler, returnFocusTarget]);

  useEffect(() => {
    if (handler == null || typeof window === 'undefined') {
      return undefined;
    }

    const activeElement = document.activeElement;
    if (
      restoreFocus &&
      returnFocusTarget == null &&
      activeElement instanceof HTMLElement &&
      activeElement !== document.body &&
      activeElement.tabIndex >= 0
    ) {
      returnFocusTargetRef.current = activeElement;
    }

    return registerTransientBackOwner({
      id: ++nextTransientBackOwnerId,
      getHandler: () => handlerRef.current,
      getFocusRoot: () => focusRootRef?.current ?? null,
      handleKeyboardBack,
      priority,
      restoreFocus,
      returnFocusTargetRef,
    });
  }, [focusRootRef, handleKeyboardBack, handler != null, priority, restoreFocus]);
}
