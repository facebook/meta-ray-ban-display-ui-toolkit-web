/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { UITCommonProps } from '@wearables-ui-toolkit/foundation/base/CommonProps';

export interface SwitchProps extends Omit<UITCommonProps, 'onChange'> {
  /** Whether the switch is on */
  checked?: boolean;

  /** Whether to animate state changes */
  animated?: boolean;
}

/**
 * In-package-only props.
 *
 * The public `Switch` is a visual-only `checked` building block with no
 * interaction or accessibility surface — it is not intended to be used on its
 * own. The parent owns interactivity, and the switch becomes checkable only when
 * a click handler is supplied.
 *
 * `presentational` renders the switch as a decorative element — it drops its
 * `role`, `aria-checked`, and tab stop so a parent that already owns the switch
 * role/state (e.g. ListItem) does not expose a duplicate nested widget or extra
 * focus stop to screen readers.
 *
 * `onChange` opts the component into interactive mode: when provided (and not
 * `presentational`) the component reports `role="switch"` / `aria-checked` with a
 * tab stop and self-toggles on click/Enter/Space. The public surface never sets
 * this.
 *
 * Set these via the `SwitchInternal` component (not barrel-exported).
 */
export interface SwitchInternalProps extends SwitchProps {
  /** Callback when the switch is toggled. Enables interactive mode. */
  onChange?: (checked: boolean) => void;

  /**
   * Disabled visual/interaction gate for parent composition (e.g. ListItem's
   * presentational switch).
   */
  disabled?: boolean;

  presentational?: boolean;
}
