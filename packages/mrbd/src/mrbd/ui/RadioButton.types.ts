/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { UITCommonProps } from '@wearables-ui-toolkit/foundation/base/CommonProps';

export interface RadioButtonProps extends Omit<UITCommonProps, 'onChange'> {
  /** Whether the radio button is checked */
  checked?: boolean;
}

/**
 * In-package-only props.
 *
 * The public `RadioButton` is a visual-only `checked` building block with no
 * interaction or accessibility surface — it is not intended to be used on its
 * own. Its `checked` state is driven solely by the parent; there is no click
 * handler or callback.
 *
 * `presentational` renders the radio button as a decorative element — it drops
 * its `role`, `aria-checked`, and tab stop so a parent that already owns the
 * radio role/state (e.g. ListItem) does not expose a duplicate nested widget or
 * extra focus stop to screen readers.
 *
 * `onChange` opts the component into interactive mode: when provided (and not
 * `presentational`) the component reports `role="radio"` / `aria-checked` with a
 * tab stop and self-toggles on click/Enter/Space — the node is only a checkable
 * radio when a parent attached interaction. The public surface never sets this.
 *
 * Set these via the `RadioButtonInternal` component (not barrel-exported).
 */
export interface RadioButtonInternalProps extends RadioButtonProps {
  /** Callback when the radio button is toggled. Enables interactive mode. */
  onChange?: (checked: boolean) => void;

  /**
   * Disabled visual/interaction gate for parent composition (e.g. ListItem's
   * presentational radio).
   */
  disabled?: boolean;

  presentational?: boolean;
}
