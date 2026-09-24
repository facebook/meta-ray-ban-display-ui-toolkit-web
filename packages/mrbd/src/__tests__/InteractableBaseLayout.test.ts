/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, expect, it } from 'vitest';
import {
  getInteractableBaseSemantics,
  getInteractableBaseStyle,
} from '@wearables-ui-toolkit/foundation/base/InteractableBaseLayout';

describe('InteractableBaseLayout', () => {
  it('derives button semantics for clickable interactables', () => {
    expect(
      getInteractableBaseSemantics({
        isFocusable: true,
        isClickable: true,
        isDisabled: false,
        hasInteractionState: true,
        tabIndex: 2,
      }),
    ).toEqual({
      role: 'button',
      tabIndex: 2,
      ariaDisabled: false,
    });
  });

  it('preserves explicit semantics and omits disabled state for static content', () => {
    expect(
      getInteractableBaseSemantics({
        isFocusable: false,
        isClickable: false,
        isDisabled: true,
        hasInteractionState: false,
        tabIndex: 0,
        role: 'article',
      }),
    ).toEqual({
      role: 'article',
      tabIndex: undefined,
      ariaDisabled: undefined,
    });
  });

  it('keeps tooltip anchors positioned like the component root', () => {
    expect(
      getInteractableBaseStyle({
        isClickable: true,
        isDisabled: false,
        hasTooltip: true,
        style: { width: 120 },
      }),
    ).toMatchObject({
      cursor: 'pointer',
      opacity: 'var(--uit-enabled-opacity)',
      position: 'relative',
      width: 120,
    });
  });

  it('uses disabled pointer styling without changing custom style values', () => {
    expect(
      getInteractableBaseStyle({
        isClickable: true,
        isDisabled: true,
        hasTooltip: false,
        style: { cursor: 'crosshair', height: 72 },
      }),
    ).toMatchObject({
      cursor: 'crosshair',
      opacity: 'var(--uit-disabled-opacity)',
      position: undefined,
      height: 72,
    });
  });
});
