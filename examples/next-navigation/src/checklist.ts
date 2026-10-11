/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export interface ChecklistItem {
  id: string;
  note: string;
  title: string;
}

export interface Checklist {
  id: string;
  items: readonly ChecklistItem[];
  title: string;
}

export const CHECKLISTS: readonly Checklist[] = [
  {
    id: 'groceries',
    title: 'Groceries',
    items: [
      { id: 'milk', title: 'Milk', note: 'Half gallon, two percent' },
      { id: 'eggs', title: 'Eggs', note: 'One dozen, large' },
      { id: 'bread', title: 'Bread', note: 'Whole wheat loaf' },
      { id: 'apples', title: 'Apples', note: 'Six, any crisp variety' },
      { id: 'coffee', title: 'Coffee', note: 'Medium roast, whole bean' },
      { id: 'spinach', title: 'Spinach', note: 'One bag, washed' },
      { id: 'rice', title: 'Rice', note: 'Jasmine, two pounds' },
      { id: 'lemons', title: 'Lemons', note: 'Three for the weekend' },
    ],
  },
  {
    id: 'travel',
    title: 'Travel',
    items: [
      { id: 'passport', title: 'Passport', note: 'Check the expiry date' },
      { id: 'charger', title: 'Charger', note: 'Glasses case and cable' },
      { id: 'tickets', title: 'Tickets', note: 'Saved to the phone wallet' },
      { id: 'adapter', title: 'Adapter', note: 'Type G plug' },
    ],
  },
  {
    id: 'home',
    title: 'Home',
    items: [
      { id: 'plants', title: 'Water plants', note: 'Kitchen and balcony' },
      { id: 'filter', title: 'Air filter', note: 'Replace the hallway filter' },
      { id: 'recycling', title: 'Recycling', note: 'Out by Thursday night' },
    ],
  },
];

export interface ChecklistState {
  /** Completed items, keyed by `itemKey`. */
  completed: Readonly<Record<string, true>>;
  showCompleted: boolean;
}

export type ChecklistAction =
  | { type: 'toggle'; listId: string; itemId: string }
  | { type: 'setShowCompleted'; showCompleted: boolean }
  | { type: 'reset' };

export const INITIAL_CHECKLIST_STATE: ChecklistState = {
  completed: { 'groceries/eggs': true, 'travel/passport': true },
  showCompleted: true,
};

export function itemKey(listId: string, itemId: string): string {
  return `${listId}/${itemId}`;
}

export function findChecklist(listId: string): Checklist | undefined {
  return CHECKLISTS.find(list => list.id === listId);
}

export function findChecklistItem(
  listId: string,
  itemId: string,
): ChecklistItem | undefined {
  return findChecklist(listId)?.items.find(item => item.id === itemId);
}

export function isCompleted(
  state: ChecklistState,
  listId: string,
  itemId: string,
): boolean {
  return state.completed[itemKey(listId, itemId)] === true;
}

export function remainingCount(state: ChecklistState, list: Checklist): number {
  return list.items.filter(item => !isCompleted(state, list.id, item.id))
    .length;
}

export function visibleItems(
  state: ChecklistState,
  list: Checklist,
): readonly ChecklistItem[] {
  return state.showCompleted
    ? list.items
    : list.items.filter(item => !isCompleted(state, list.id, item.id));
}

export function checklistReducer(
  state: ChecklistState,
  action: ChecklistAction,
): ChecklistState {
  switch (action.type) {
    case 'toggle': {
      const key = itemKey(action.listId, action.itemId);
      const { [key]: wasCompleted, ...rest } = state.completed;
      return {
        ...state,
        completed: wasCompleted ? rest : { ...state.completed, [key]: true },
      };
    }
    case 'setShowCompleted':
      return { ...state, showCompleted: action.showCompleted };
    case 'reset':
      return INITIAL_CHECKLIST_STATE;
  }
}
