/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
  CSSProperties,
  HTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import type { IconSource } from '@wearables-ui-toolkit/foundation/components/IconImage';
import type { ContainerMaterial } from '@wearables-ui-toolkit/foundation/material/ContainerMaterial';

export const InputTextViewSize = {
  FULL: 'full',
  SHRINK_WHEN_EMPTY: 'shrink_when_empty',
} as const;
export type InputTextViewSize =
  (typeof InputTextViewSize)[keyof typeof InputTextViewSize];

export type InputTextViewInputProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  | 'value'
  | 'defaultValue'
  | 'placeholder'
  | 'rows'
  | 'cols'
  | 'onChange'
  | 'className'
  | 'style'
>;

/** Props for the visible text-entry surface. */
export interface InputTextViewProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'onChange'
> {
  /** Controlled text value. */
  text?: string;

  /** Initial text value for uncontrolled usage. */
  defaultText?: string;

  /** Placeholder shown when text is empty. */
  hint?: string;

  /** Sizing behavior of the input surface. */
  size?: InputTextViewSize;

  /** Container material. Defaults to the text-input material. */
  material?: ContainerMaterial;

  /** Shows a loader in the input surface's accessory slot. */
  showLoader?: boolean;

  /** Accessible label announced for the loader. */
  loadingLabel?: string;

  /** Optional action icon. Defaults to a paper airplane. */
  actionIcon?: IconSource;

  /** Optional material for the separate action button. */
  actionButtonMaterial?: ContainerMaterial;

  /** Accessible label for the action button. */
  actionLabel?: string;

  /**
   * Whether the separate action button is shown. Enter submission remains
   * available when `onSend` is set. The visible button is disabled while empty.
   */
  showActionButton?: boolean;

  /** Called when the action button or an unmodified Enter key submits text. */
  onSend?: (text: string) => void;

  /** Called when text changes. */
  onTextChange?: (text: string) => void;

  /** Standard attributes forwarded to the underlying textarea. */
  inputProps?: InputTextViewInputProps;

  /** Additional CSS class. */
  className?: string;

  /** Additional inline styles. */
  style?: CSSProperties;
}
