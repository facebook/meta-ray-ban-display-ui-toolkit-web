/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
  ComponentPropsWithRef,
  ComponentPropsWithoutRef,
  ElementType,
  ReactElement,
} from 'react';
import type { IconSource } from '@wearables-ui-toolkit/foundation/components/IconImage';
import type { ContainerProps } from '@wearables-ui-toolkit/foundation/components/Container';
import type { ContainerImplementationProps } from '@wearables-ui-toolkit/foundation/components/Container.types';

export interface VerticalMenuButtonOwnProps {
  /** Button label. */
  text: string;

  /** Optional decorative leading icon. */
  icon?: IconSource;
}

export type VerticalMenuButtonProps<T extends ElementType = 'button'> =
  VerticalMenuButtonOwnProps & Omit<
    ContainerProps<T>,
    keyof VerticalMenuButtonOwnProps |
      'ariaLabel' |
      'children' |
      'height' |
      'material' |
      'role' |
      'width'
  >;

export type VerticalMenuButtonImplementationProps =
  VerticalMenuButtonOwnProps & Omit<
    ContainerImplementationProps,
    keyof VerticalMenuButtonOwnProps |
      'ariaLabel' |
      'children' |
      'height' |
      'material' |
      'role' |
      'width'
  > & {
    type?: ComponentPropsWithoutRef<'button'>['type'];
  };

export interface VerticalMenuButtonComponent {
  (
    props: VerticalMenuButtonProps<'button'> & {
      ref?: ComponentPropsWithRef<'button'>['ref'];
    },
  ): ReactElement | null;
  <T extends ElementType>(
    props: VerticalMenuButtonProps<T> & {
      as: T;
      ref?: ComponentPropsWithRef<T>['ref'];
    },
  ): ReactElement | null;
}
