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
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { VisualState } from '../base/Interactions';
import type { ContainerMaterial } from '../material/ContainerMaterial';
import type { ShapeProvider } from '../material/ShapeProvider';
import { MaterialLibrary } from '../material/MaterialLibrary';
import { Container } from './Container';
import styles from './IconWithContainerMaterial.module.css';

const DEFAULT_STYLE: CSSProperties = {};
const DEFAULT_ICON_INSET_PERCENT = 20;
const ICON_CONTENT_SCALE = () => 1;

export interface IconWithContainerMaterialProps extends HTMLAttributes<HTMLDivElement> {
  icon: ReactNode;
  material?: ContainerMaterial;
  shapeProvider?: ShapeProvider;
  visualState?: VisualState;
  padding?: number;
  renderAtIntrinsicSize?: boolean;
  intrinsicIconSize?: number;
}

/**
 * Draws a container material background, an icon inset by 20% by default,
 * and the material foreground layers as one surface.
 */
export const IconWithContainerMaterial = memo(forwardRef<
  HTMLDivElement,
  IconWithContainerMaterialProps
>(function IconWithContainerMaterial({
  icon,
  material: materialProp,
  shapeProvider,
  visualState = VisualState.DEFAULT,
  padding,
  renderAtIntrinsicSize = false,
  intrinsicIconSize = 24,
  className = '',
  style = DEFAULT_STYLE,
  ...rest
}, ref) {
  const material = useMemo(
    () => materialProp ?? MaterialLibrary.default(),
    [materialProp],
  );
  const iconSlotStyle: CSSProperties = useMemo(
    () => {
      if (renderAtIntrinsicSize) {
        return {
          width: intrinsicIconSize,
          height: intrinsicIconSize,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
        };
      }

      return padding == null
        ? {
            inset: `${DEFAULT_ICON_INSET_PERCENT}%`,
          }
        : {
            inset: padding,
          };
    },
    [intrinsicIconSize, padding, renderAtIntrinsicSize],
  );
  const rootClassName = useMemo(
    () => `${styles.root} ${className}`,
    [className],
  );

  return (
    <Container
      {...rest}
      ref={ref}
      material={material}
      shapeProvider={shapeProvider}
      visualStateOverride={visualState}
      width="100%"
      height="100%"
      contentScaleForStateFn={ICON_CONTENT_SCALE}
      interactive={false}
      focusable={false}
      pressable={false}
      clickable={false}
      tabIndex={-1}
      className={rootClassName}
      style={style}
    >
      <div className={styles.iconSlot} style={iconSlotStyle}>
        {icon}
      </div>
    </Container>
  );
}));
