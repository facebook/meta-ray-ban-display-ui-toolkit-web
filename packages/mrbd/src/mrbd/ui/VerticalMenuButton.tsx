/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  forwardRef,
  memo,
  useMemo,
  type ForwardRefExoticComponent,
  type RefAttributes,
} from 'react';
import { Container } from '@wearables-ui-toolkit/foundation/components/Container';
import type { ContainerImplementationProps } from '@wearables-ui-toolkit/foundation/components/Container.types';
import { VisualState } from '@wearables-ui-toolkit/foundation/base/Interactions';
import { IconImage } from '@wearables-ui-toolkit/foundation/components/IconImage';
import {
  TextStyle,
  TextView,
} from '@wearables-ui-toolkit/foundation/components/TextView';
import { MaterialLibrary } from '@wearables-ui-toolkit/foundation/material/MaterialLibrary';
import {
  CornerRadius,
  RoundedRectangleShapeProvider,
} from '@wearables-ui-toolkit/foundation/material/ShapeProvider';
import type {
  VerticalMenuButtonComponent,
  VerticalMenuButtonImplementationProps,
} from './VerticalMenuButton.types';
import styles from './VerticalMenuButton.module.css';

export type { VerticalMenuButtonProps } from './VerticalMenuButton.types';

const ContainerInternal = Container as unknown as ForwardRefExoticComponent<
  ContainerImplementationProps &
    { type?: 'button' | 'reset' | 'submit' } &
    RefAttributes<HTMLElement>
>;
const DEFAULT_VERTICAL_MENU_BUTTON_SHAPE_PROVIDER =
  new RoundedRectangleShapeProvider(CornerRadius.SMALL);

const VerticalMenuButtonImpl = forwardRef<
  HTMLElement,
  VerticalMenuButtonImplementationProps
>(function VerticalMenuButton(
  {
    text,
    icon,
    as: RootComponent = 'button',
    type: rootType,
    className = '',
    'aria-label': ariaLabel,
    ...containerProps
  },
  ref,
) {
    const material = useMemo(
      () => MaterialLibrary.default({
        hideGlowForStates: [VisualState.DEFAULT],
      }),
    [],
  );

  return (
    <ContainerInternal
      {...containerProps}
      as={RootComponent}
      ref={ref}
      type={RootComponent === 'button' ? rootType ?? 'button' : rootType}
      className={`${styles.button} ${className}`.trim()}
      width="100%"
      height="auto"
      material={material}
      shapeProvider={
        containerProps.shapeProvider ?? DEFAULT_VERTICAL_MENU_BUTTON_SHAPE_PROVIDER
      }
      role="menuitem"
      aria-label={ariaLabel ?? text}
      data-uit-vertical-menu-button=""
    >
      <div className={styles.content}>
        {icon != null && <IconImage source={icon} className={styles.icon} />}
        <TextView className={styles.text} textStyle={TextStyle.META2}>
          {text}
        </TextView>
      </div>
    </ContainerInternal>
  );
});

export const VerticalMenuButton = memo(
  VerticalMenuButtonImpl,
) as VerticalMenuButtonComponent;
