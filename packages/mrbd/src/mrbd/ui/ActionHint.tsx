/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * ActionHint component for Meta Ray-Ban Display
 *
 * Pill-shaped hint label with optional icon.
 * Uses ContainerMaterial (actionHintMaterial) for background.
 * Non-interactive — purely informational.
 *
 * Example: "Preview with AI", "Tap to open"
 */

import {
  forwardRef,
  memo,
  useMemo,
  type CSSProperties,
} from 'react';
import { StaticContainer } from '@wearables-ui-toolkit/foundation';
import { IconImage } from '@wearables-ui-toolkit/foundation/components/IconImage';
import { MaterialLibrary } from '@wearables-ui-toolkit/foundation/material/MaterialLibrary';
import {
  CornerRadius,
  RoundedRectangleShapeProvider,
} from '@wearables-ui-toolkit/foundation/material/ShapeProvider';
import {
  getActionHintClassName,
  getActionHintContainerStyle,
  getActionHintIconStyle,
} from './private/ActionHintLayout';
import type { ActionHintProps } from './ActionHint.types';
import styles from './ActionHint.module.css';

export type { ActionHintProps } from './ActionHint.types';

const DEFAULT_STYLE: CSSProperties = {};
const DEFAULT_ACTION_HINT_SHAPE_PROVIDER =
  new RoundedRectangleShapeProvider(CornerRadius.XSMALL);

// ============================================================================
// Constants
// ============================================================================

/**
 * Sizing:
 * - iconSize: 24px (--uit-icon-medium)
 * - spacingSmallMed: 12px (--uit-spacing-sm-med)
 * - spacingSmall: 8px (--uit-spacing-small)
 * - icon right margin: 8px (spacingSmall)
 * - container padding: spacingSmallMed horizontal, spacingSmall vertical
 * - text style: the meta3 text style (TextAppearance.META3), 18px, 400 weight, 24px line height
 * - corner radius: XSMALL (16px)
 */
/**
 * ActionHint component
 * Pill-shaped hint label with optional icon.
 *
 * Usage:
 * ```tsx
 * <ActionHint text="Preview with AI" icon={alertIcon} />
 * <ActionHint text="Tap to open" />
 * ```
 */
export const ActionHint = memo(forwardRef<HTMLDivElement, ActionHintProps>(
  function ActionHint(
    {
      text = '',
      icon,
      className = '',
      style = DEFAULT_STYLE,
      shapeProvider = DEFAULT_ACTION_HINT_SHAPE_PROVIDER,
      ...staticContainerProps
    },
    ref
  ) {
    /**
     * ActionHint material with cornerRadius = XSMALL (16px).
     *
     * The material has two layers:
     *   1. Linear gradient from a 15% white overlay to transparent white
     *   2. RadialGradientGlowStroke at 10% alpha
     */
    const hasIcon = icon != null;
    const containerStyle = useMemo(
      () => getActionHintContainerStyle(style),
      [style],
    );
    const classNames = useMemo(
      () => getActionHintClassName(styles.actionHint, className),
      [className],
    );
    const iconStyle = useMemo(() => getActionHintIconStyle(), []);
    const material = useMemo(() => MaterialLibrary.actionHint(), []);

    return (
      <StaticContainer
        ref={ref}
        className={classNames}
        style={containerStyle}
        material={material}
        shapeProvider={shapeProvider}
        {...staticContainerProps}
      >
        <div className={styles.content}>
          {hasIcon && (
            <div
              className={styles.icon}
              style={iconStyle}
            >
              <IconImage source={icon} />
            </div>
          )}
          <span className={styles.text}>{text}</span>
        </div>
      </StaticContainer>
    );
  }
));
