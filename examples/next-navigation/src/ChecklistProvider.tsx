/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use client';

import {
  createContext,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';
import {
  INITIAL_CHECKLIST_STATE,
  checklistReducer,
  type ChecklistAction,
  type ChecklistState,
} from './checklist';

interface ChecklistContextValue {
  dispatch: (action: ChecklistAction) => void;
  state: ChecklistState;
}

const ChecklistContext = createContext<ChecklistContextValue | null>(null);

/**
 * Owns checklist state above the page transition so it survives navigation and
 * the outgoing page keeps rendering current values while it animates out.
 */
export function ChecklistProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(
    checklistReducer,
    INITIAL_CHECKLIST_STATE,
  );
  const value = useMemo(() => ({ dispatch, state }), [state]);
  return (
    <ChecklistContext.Provider value={value}>
      {children}
    </ChecklistContext.Provider>
  );
}

export function useChecklist(): ChecklistContextValue {
  const context = useContext(ChecklistContext);
  if (context == null) {
    throw new Error('useChecklist must be used within ChecklistProvider.');
  }
  return context;
}
