/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, expect, it } from 'vitest';
import {
  INITIAL_CHECKLIST_STATE,
  checklistReducer,
  findChecklist,
  isCompleted,
  remainingCount,
  visibleItems,
} from './checklist';

const travel = findChecklist('travel')!;

describe('checklistReducer', () => {
  it('toggles one item without affecting others', () => {
    const completed = checklistReducer(INITIAL_CHECKLIST_STATE, {
      type: 'toggle',
      listId: 'travel',
      itemId: 'charger',
    });
    expect(isCompleted(completed, 'travel', 'charger')).toBe(true);
    expect(isCompleted(completed, 'travel', 'passport')).toBe(true);
    expect(isCompleted(completed, 'groceries', 'eggs')).toBe(true);

    const reopened = checklistReducer(completed, {
      type: 'toggle',
      listId: 'travel',
      itemId: 'charger',
    });
    expect(isCompleted(reopened, 'travel', 'charger')).toBe(false);
    expect(reopened.completed).toEqual(INITIAL_CHECKLIST_STATE.completed);
  });

  it('restores the initial state on reset', () => {
    const changed = checklistReducer(
      checklistReducer(INITIAL_CHECKLIST_STATE, {
        type: 'setShowCompleted',
        showCompleted: false,
      }),
      { type: 'toggle', listId: 'home', itemId: 'plants' },
    );

    expect(checklistReducer(changed, { type: 'reset' })).toEqual(
      INITIAL_CHECKLIST_STATE,
    );
  });
});

describe('checklist selectors', () => {
  it('counts the items left in a list', () => {
    expect(remainingCount(INITIAL_CHECKLIST_STATE, travel)).toBe(3);
  });

  it('hides completed items only when the setting is off', () => {
    expect(visibleItems(INITIAL_CHECKLIST_STATE, travel)).toHaveLength(4);

    const hidingCompleted = checklistReducer(INITIAL_CHECKLIST_STATE, {
      type: 'setShowCompleted',
      showCompleted: false,
    });
    expect(
      visibleItems(hidingCompleted, travel).map(item => item.id),
    ).toEqual(['charger', 'tickets', 'adapter']);
  });
});
