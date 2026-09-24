/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * ContextMenuItemView component for Meta Ray-Ban Display
 * Extends Container — individual interactive item within ContextMenu
 *
 * Features:
 * - 56px minimum size
 * - Pill-shaped corners (FULL radius)
 * - Focus/press material state transitions
 * - Enter/Space to activate (no touch on Meta Ray-Ban Display)
 * - Hides default idle/glow layers so the glow only appears on focus/press
 */

import {
  type CSSProperties,
  forwardRef,
  memo,
  useMemo,
} from 'react';
import { Container } from '@wearables-ui-toolkit/foundation/components/Container';
import { IconImage } from '@wearables-ui-toolkit/foundation/components/IconImage';
import { MaterialLibrary } from '@wearables-ui-toolkit/foundation/material/MaterialLibrary';
import {
  CornerRadius,
  RoundedRectangleShapeProvider,
} from '@wearables-ui-toolkit/foundation/material/ShapeProvider';
import { TextAppearance } from '@wearables-ui-toolkit/foundation/theme/TextAppearance';
import { ButtonItemIconSize } from './ButtonItemIconSize';
import {
  IconTintColor,
  getIconTintBlendMode,
  getIconTintCSSVariable,
} from './IconTintColor';
import { CONTEXT_MENU_ITEM_SIZE } from './private/ContextMenuItemMetrics';
import type {
  ButtonContextMenuItemViewProps,
  ContextMenuItemViewProps,
  EmojiContextMenuItemViewProps,
} from './ContextMenuItemView.types';
import styles from './ContextMenuItemView.module.css';

export type {
  ButtonContextMenuItemViewProps,
  ContextMenuItemViewProps,
  EmojiContextMenuItemViewProps,
} from './ContextMenuItemView.types';

const EMPTY_CONTEXT_MENU_ITEM_STYLE: CSSProperties = {};
const DEFAULT_CONTEXT_MENU_ITEM_SHAPE_PROVIDER =
  new RoundedRectangleShapeProvider(CornerRadius.FULL);

/**
 * ContextMenuItemView component
 * An interactive item for use in ContextMenu.
 * Minimum 56x56px, pill-shaped corners (FULL radius).
 *
 * Uses the default container material with the glow hidden in the DEFAULT
 * state — idle items draw directly on the menu surface and glow/focus material
 * only appears when FOCUSED or PRESSED.
 */
export const ContextMenuItemView = memo(forwardRef<HTMLDivElement, ContextMenuItemViewProps>(
  function ContextMenuItemView(
    {
      children,
      icon,
      label,
      onClick,
      material: materialProp,
      shapeProvider = DEFAULT_CONTEXT_MENU_ITEM_SHAPE_PROVIDER,
      style = EMPTY_CONTEXT_MENU_ITEM_STYLE,
      className = '',
      ...containerProps
    },
    ref
  ) {
    const material = useMemo(
      () => materialProp ?? MaterialLibrary.contextMenuItem(),
      [materialProp],
    );
    const containerStyle: CSSProperties = useMemo(
      () => ({
        minWidth: CONTEXT_MENU_ITEM_SIZE,
        minHeight: CONTEXT_MENU_ITEM_SIZE,
        ...style,
      }),
      [style],
    );

    // If children are provided, render them directly. Otherwise use the
    // convenience icon/label layout.
    const hasDirectChildren = children != null;
    const rootClassName = useMemo(
      () => `${styles.contextMenuItem} ${className}`,
      [className],
    );

    return (
      <Container
        ref={ref}
        className={rootClassName}
        style={containerStyle}
        material={material}
        shapeProvider={shapeProvider}
        onClick={onClick}
        role="menuitem"
        ariaLabel={label}
        {...containerProps}
      >
        {hasDirectChildren ? (
          children
        ) : (
          <div className={styles.itemContent}>
            {icon != null && (
              <div className={styles.itemIcon}>
                <IconImage source={icon} />
              </div>
            )}
            {label && (
              <span className={styles.itemLabel}>{label}</span>
            )}
          </div>
        )}
      </Container>
    );
  }
));

export const ButtonContextMenuItemView = memo(forwardRef<HTMLDivElement, ButtonContextMenuItemViewProps>(
  function ButtonContextMenuItemView(
    {
      icon,
      title,
      iconSize = ButtonItemIconSize.MEDIUM,
      iconTintColor = IconTintColor.PRIMARY,
      className = '',
      ariaLabel,
      ...itemProps
    },
    ref,
  ) {
    const hasIcon = icon != null;
    const hasTitle = title != null && title.length > 0;
    const rootClassName = useMemo(
      () => `${styles.buttonContextMenuItem} ${className}`,
      [className],
    );
    const isLargeIcon = iconSize === ButtonItemIconSize.LARGE;
    const contentClassName = useMemo(
      () => `${styles.buttonItemContent} ${
        hasIcon && hasTitle ? styles.buttonItemContentWithGap : ''
      } ${
        // The large icon tightens the container horizontal padding from 16px
        // to 12px.
        isLargeIcon ? styles.buttonItemContentLarge : ''
      }`,
      [hasIcon, hasTitle, isLargeIcon],
    );
    const iconClassName = useMemo(
      () => `${styles.buttonItemIcon} ${
        isLargeIcon ? styles.buttonItemIconLarge : ''
      }`,
      [isLargeIcon],
    );
    const iconStyle: CSSProperties = useMemo(
      () => ({
        color: getIconTintCSSVariable(iconTintColor),
        mixBlendMode: getIconTintBlendMode(iconTintColor),
      }),
      [iconTintColor],
    );
    const titleClassName = useMemo(
      () => `${TextAppearance.LABEL} ${styles.buttonItemTitle}`,
      [],
    );

    return (
      <ContextMenuItemView
        ref={ref}
        className={rootClassName}
        ariaLabel={ariaLabel ?? title}
        {...itemProps}
      >
        <div className={contentClassName}>
          {icon != null && (
            <div className={iconClassName} style={iconStyle}>
              <IconImage source={icon} />
            </div>
          )}
          {hasTitle && (
            <span className={titleClassName}>
              {title}
            </span>
          )}
        </div>
      </ContextMenuItemView>
    );
  },
));

export const EmojiContextMenuItemView = memo(forwardRef<HTMLDivElement, EmojiContextMenuItemViewProps>(
  function EmojiContextMenuItemView(
    {
      emoji,
      isEmojiSelected = false,
      className = '',
      ariaLabel,
      ...itemProps
    },
    ref,
  ) {
    const rootClassName = useMemo(
      () => `${styles.emojiContextMenuItem} ${className}`,
      [className],
    );
    const emojiClassName = useMemo(
      () => `${TextAppearance.LABEL} ${styles.emojiText}`,
      [],
    );

    return (
      <ContextMenuItemView
        ref={ref}
        className={rootClassName}
        ariaLabel={ariaLabel ?? emoji}
        {...itemProps}
      >
        <div className={styles.emojiItemContent}>
          <span className={emojiClassName}>{emoji}</span>
          {isEmojiSelected && <span className={styles.selectionDot} />}
        </div>
      </ContextMenuItemView>
    );
  },
));
