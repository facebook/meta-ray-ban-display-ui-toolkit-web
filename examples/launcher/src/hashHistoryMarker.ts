/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { preserveFocusedInteractableDuringNavigation } from '@wearables-ui-toolkit/mrbd';

/**
 * Shared same-document history marker used by the launcher sample.
 *
 * Both launcher history modules mark a state in the URL hash, push it so Back
 * has something to consume, and pop it when the state closes. They differ only
 * in three parameters, so the mechanics live here once:
 *
 * - `prefix` — the hash namespace (`#uit-launcher-page=` vs `#uit-launcher-mode=`).
 * - `stateKey` — page history also records the marker in `history.state`, so a
 *   deep link can be told apart from an entry this module pushed. Transient
 *   modes deliberately record nothing: they are identified by hash alone.
 * - `mintMissingEntry` — page history mints the entry a deep link never pushed
 *   before popping, so Back stays inside the document. Transient modes do not,
 *   because a visible mode that finds its marker missing or foreign is required
 *   to clear locally and keep the parent page's hash rather than move history.
 *
 * Keeping `stateKey` and `mintMissingEntry` optional is what makes this a
 * refactor: with them unset the behavior is exactly the transient module's, and
 * with them set exactly the page module's.
 */
export interface HashHistoryMarkerOptions<TValue extends string> {
  prefix: string;
  isValidValue: (value: string) => value is TValue;
  stateKey?: string;
  mintMissingEntry?: boolean;
}

export interface HashHistoryMarker<TValue extends string> {
  hashFor: (value: TValue) => string;
  getActive: () => TValue | null;
  isActive: (value: TValue) => boolean;
  push: (value: TValue) => void;
  replace: (value: TValue) => void;
  pop: (value: TValue) => boolean;
  /**
   * Testing hook: resets the pushed-entry count to zero. Production code never
   * calls this — the count lives for the document lifetime, matching the
   * history entries it accounts for. Tests reset it in beforeEach because the
   * module singleton outlives any single test while jsdom history does not.
   */
  resetPushedEntryCountForTesting: () => void;
}

export function createHashHistoryMarker<TValue extends string>({
  prefix,
  isValidValue,
  stateKey,
  mintMissingEntry = false,
}: HashHistoryMarkerOptions<TValue>): HashHistoryMarker<TValue> {
  const hashFor = (value: TValue): string => `${prefix}${value}`;

  // Counts entries this module pushed in-document. A replaceState stamps the
  // state key onto whatever entry is current — including the document's first
  // entry after a deep link — so the key alone cannot prove this module pushed
  // anything poppable. The counter distinguishes "pushed then replaced" (>0)
  // from "deep-linked then replaced sideways" (0, mint required).
  let pushedEntryCount = 0;

  // The value whose traversal is in flight, or null when none is.
  //
  // `pop` returns synchronously but the hash only changes when the browser
  // delivers `popstate`, so a second Back arriving inside that gap still sees
  // the old hash and would traverse a second entry — consuming one more than
  // the user asked for and, from the last page, leaving the document. The URL
  // cannot answer "is a pop already in flight", so it is tracked explicitly.
  //
  // It stores the VALUE rather than a boolean so an in-flight `pop(a)` only
  // suppresses a repeat of `pop(a)`. A different page's pop is a distinct
  // intent and must not be swallowed.
  //
  // Module scope, not per-call: the two presses are separate events with no
  // shared closure. Cleared on `popstate` — see the sibling tests
  // `traverses once when two Back presses arrive before popstate` and
  // `accepts the next pop once popstate has been delivered`.
  let popInFlightValue: TValue | null = null;

  // Registered once per marker, for the lifetime of the module. These markers
  // are module singletons created at import time (one per prefix), so there is
  // no instance to tear down and no accumulation: a removal hook would have no
  // caller. `window` is referenced unconditionally throughout this module, so
  // no SSR guard is used here either — adding one only here would imply an
  // SSR-safety this module does not have.
  window.addEventListener('popstate', () => {
    popInFlightValue = null;
  });

  const getActive = (): TValue | null => {
    const raw = window.location.hash.startsWith(prefix)
      ? window.location.hash.slice(prefix.length)
      : null;
    return raw != null && isValidValue(raw) ? raw : null;
  };

  const isActive = (value: TValue): boolean => getActive() === value;

  // With no state key this returns the current state untouched, which is what
  // the transient module has always passed to pushState.
  const nextState = (value: TValue): unknown => {
    const currentState = window.history.state;
    if (stateKey == null) {
      return currentState;
    }
    return {
      ...(currentState != null && typeof currentState === 'object'
        ? currentState
        : {}),
      [stateKey]: value,
    };
  };

  const push = (value: TValue): void => {
    if (isActive(value)) {
      return;
    }
    preserveFocusedInteractableDuringNavigation();
    window.history.pushState(nextState(value), '', hashFor(value));
    // Only page history maintains the count: transient modes pass neither
    // stateKey nor mintMissingEntry, so their counter stays 0 forever and the
    // mint gate below can never read it. That keeps the transient behavior
    // byte-identical to before the counter existed.
    if (mintMissingEntry) {
      pushedEntryCount += 1;
    }
  };

  const replace = (value: TValue): void => {
    if (isActive(value)) {
      return;
    }
    preserveFocusedInteractableDuringNavigation();
    window.history.replaceState(nextState(value), '', hashFor(value));
  };

  const wasPushedByThisModule = (value: TValue): boolean => {
    if (stateKey == null) {
      return true;
    }
    const currentState = window.history.state;
    return (
      currentState != null &&
      typeof currentState === 'object' &&
      (currentState as Record<string, unknown>)[stateKey] === value
    );
  };

  const mintEntryForDeepLink = (value: TValue): void => {
    const currentState = window.history.state;
    const clearedState =
      currentState != null && typeof currentState === 'object'
        ? (() => {
            const copy = { ...(currentState as Record<string, unknown>) };
            if (stateKey != null) {
              delete copy[stateKey];
            }
            return copy;
          })()
        : null;
    window.history.replaceState(
      clearedState,
      '',
      `${window.location.pathname}${window.location.search}`,
    );
    window.history.pushState(nextState(value), '', hashFor(value));
    // The mint is a real push: without this, the next pop sees a stale count
    // and mints again, leaking one entry per Back.
    if (mintMissingEntry) {
      pushedEntryCount += 1;
    }
  };

  const pop = (value: TValue): boolean => {
    if (!isActive(value)) {
      return false;
    }
    if (popInFlightValue === value) {
      // A traversal for this same value is already under way; the hash has not
      // caught up yet. Claim the request so the caller still treats Back as
      // handled, but do not traverse a second entry.
      return true;
    }
    preserveFocusedInteractableDuringNavigation();
    if (mintMissingEntry && (pushedEntryCount === 0 || !wasPushedByThisModule(value))) {
      // Deep link: the hash arrived with the document, so this module never
      // pushed an entry and `history.back()` would leave the launcher. Mint the
      // entry the page would have been opened from so the pop stays inside the
      // document and the normal popstate flow drives the UI back.
      //
      // Reviewers have asked twice whether this branch over-counts: taken with
      // a FOREIGN marker while `pushedEntryCount > 0`, it mints (+1) without
      // decrementing for the foreign entry `history.back()` then consumes, so
      // the count can exceed the entries this module owns and suppress a later
      // mint. The arithmetic is correct — and the state is unreachable here.
      //
      // "Foreign" requires someone to replaceState our `stateKey` away while
      // leaving our hash in place. Nothing does: `replace` above writes
      // `nextState(value)` (our own marker), `mintEntryForDeepLink` clears the
      // key only to push immediately after, and `transientModeHistory` passes
      // no `stateKey` at all, so `wasPushedByThisModule` is unconditionally
      // true for it. Adding the decrement would trade the no-re-mint invariant
      // — which fixed a real one-entry-per-Back leak — against a state only an
      // external actor rewriting our history state can produce.
      mintEntryForDeepLink(value);
    } else if (mintMissingEntry && pushedEntryCount > 0) {
      // Consumed one of our own pushed entries. The floor matters: a pop that
      // finds a foreign marker must not drive the count negative, or a genuine
      // push afterwards looks unpushed.
      pushedEntryCount -= 1;
    }
    popInFlightValue = value;
    window.history.back();
    return true;
  };

  return { hashFor, getActive, isActive, push, replace, pop,
    resetPushedEntryCountForTesting: () => {
      pushedEntryCount = 0;
      popInFlightValue = null;
    },
  };
}
