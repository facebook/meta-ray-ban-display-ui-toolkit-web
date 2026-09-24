/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * ListItem component for Meta Ray-Ban Display
 *
 * An interactive list row extending Container. Supports a leading slot
 * (icon OR avatar -- avatar wins if both supplied), a text area (title +
 * subtitle with optional inline timestamp), and a trailing slot
 * (Switch | RadioButton | SliderBar | Tag | accessory icon |
 * timestamp/status indicator).
 *
 * Meta Ray-Ban Display has NO touch -- all interaction is via d-pad / trackpad.
 * Enter/Space toggles Switch/RadioButton; Left/Right arrows
 * adjust the SliderBar value.
 *
 * Layout:
 *   Container (material insets 8px all around, corner radius MEDIUM)
 *     contentView (horizontal flex row, vertically centered):
 *       margins: left 20px right 32px, padding: 8px vertical+horizontal
 *       min-height 120px
 *       ├── avatar (right margin 16px)
 *       ├── icon (32x32, left margin 16px, right margin 32px)
 *       └── title/accessory row (flex-grow: 1, horizontal)
 *             ├── [vertical column flex-grow: 1]: title + secondLine + slider
 *             ├── switch / radio button
 *             ├── trailing icon container (56x56, left margin 24px)
 *             ├── tag (left margin 16px, top-aligned)
 *             └── timestampStatusContainer (left margin 24px)
 */

import {
  forwardRef,
  memo,
  useState,
  useCallback,
  useMemo,
  type CSSProperties,
} from 'react';
import {
  Container,
  PartialFocusSupportedAxis,
} from '@wearables-ui-toolkit/foundation/components/Container';
import {
  CornerRadius,
  RoundedRectangleShapeProvider,
} from '@wearables-ui-toolkit/foundation/material/ShapeProvider';
import { State, InteractionState } from '@wearables-ui-toolkit/foundation/base/Interactions';
import { AvatarShape } from './Avatar';
import {
  SubtitleTextColor,
  TimestampPosition,
} from './ListItem.types';
import type {
  ListItemComponent,
  ListItemImplementationProps,
} from './ListItem.types';
import { TrailingTag, getTrailingTagLabel } from './TrailingTag';
import {
  clampListItemSliderValue,
  getListItemContentDescription,
  getListItemLayoutState,
} from './private/ListItemLayout';
import {
  resolveListItemMaterial,
} from './private/ListItemMaterials';
import { ListItemContent } from './private/ListItemContent';
import { useListItemInteractionHandlers } from './private/useListItemInteractionHandlers';
import styles from './ListItem.module.css';
export {
  SubtitleTextColor,
  TimestampPosition,
} from './ListItem.types';
export { TimestampTextColor } from './TimestampTextColor';
export { IconTintColor } from './IconTintColor';
export { TrailingTag } from './TrailingTag';
export type {
  ListItemProps,
  StatusIcon,
  StatusIndicator,
} from './ListItem.types';

const EMPTY_LIST_ITEM_STYLE: CSSProperties = {};
const LIST_ITEM_KEY_WRAPPER_STYLE: CSSProperties = { width: '100%' };
const DEFAULT_LIST_ITEM_SHAPE_PROVIDER =
  new RoundedRectangleShapeProvider(CornerRadius.MEDIUM);

// ============================================================================
// Component
// ============================================================================

/**
 * ListItem
 *
 * An interactive list row component — the primary building block for menus
 * and settings screens on Meta Ray-Ban Display. Extends Container so it gets the
 * full material treatment (focused gradient, glow stroke, etc.).
 *
 * Usage:
 * ```tsx
 * <VerticalList>
 *   <ListItem
 *     title="Wi-Fi"
 *     subtitle="Connected"
 *     showSwitch
 *     checked={isOn}
 *     onCheckedChange={setIsOn}
 *   />
 * </VerticalList>
 * ```
 */
const ListItemImpl = forwardRef<HTMLElement, ListItemImplementationProps>(
  function ListItem(
    {
      // Text
      contentClassName,
      title,
      titleContentDescription,
      subtitle,
      subtitleContentDescription,
      subtitleTextColor = SubtitleTextColor.SECONDARY,
      subtitleMaxLines = 1,
      timestamp,
      timestampContentDescription,
      timestampPosition = TimestampPosition.ACCESSORY,
      timestampTextColor,

      // Leading
      icon,
      iconTintColor,
      avatarSrc,
      avatarPrimaryContent,
      avatarSecondarySrc,
      avatarSecondaryContent,
      avatarBadgeSrc,
      avatarBadgeContent,
      avatarAlt = 'Avatar',
      avatarShape = AvatarShape.CIRCLE,
      avatarStatusIndicator,
      avatarStatusIndicatorIcon,
      avatarPlaceholderStyle,
      secondaryIcon,
      secondaryIconTintColor,

      // Trailing controls
      showSwitch = false,
      showRadioButton = false,
      showSlider = false,
      checked = false,
      onCheckedChange,

      // Slider
      sliderMinimumValue = 0,
      sliderMaximumValue = 1,
      sliderValue = 0,
      sliderIncrementPercentage = 0.1,
      onSliderValueChange,

      // Status
      statusIndicator,
      statusIndicatorIcons,
      statusIndicatorIconTintColor,

      // Accessory
      accessoryIcon,
      accessoryIconAlwaysVisible = true,
      accessoryIconTintColor,
      trailingTag = TrailingTag.NONE,

      // Interaction
      onClick,

      // Container passthrough
      material: materialProp,
      shapeProvider = DEFAULT_LIST_ITEM_SHAPE_PROVIDER,
      style = EMPTY_LIST_ITEM_STYLE,
      className = '',
      disabled = false,
      onStateChange,
      ariaLabel,
      'aria-label': ariaLabelHtml,
      partialFocusSupportedAxis,
      as: RootComponent = 'div',
      role: roleProp,
      ...containerProps
    },
    ref
  ) {
    const [currentState, setCurrentState] = useState<State>(State.DEFAULT);
    const material = useMemo(
      () => resolveListItemMaterial(materialProp),
      [materialProp],
    );

    // The design system owns the tag label; callers pass a closed TrailingTag
    // case, never free-form text.
    const trailingTagLabel = useMemo(
      () => getTrailingTagLabel(trailingTag) ?? undefined,
      [trailingTag],
    );

    // Track Container state for slider visual state + accessory icon visibility
    const handleStateChange = useCallback(
      (prev: InteractionState, next: InteractionState) => {
        setCurrentState(next.state);
        onStateChange?.(prev, next);
      },
      [onStateChange],
    );

    const hasAvatar =
      avatarSrc != null ||
      avatarPrimaryContent != null ||
      avatarSecondarySrc != null ||
      avatarSecondaryContent != null ||
      avatarBadgeSrc != null ||
      avatarBadgeContent != null;

    const layout = useMemo(
      () => getListItemLayoutState({
        title,
        subtitle,
        subtitleMaxLines,
        timestamp,
        timestampPosition,
        showSwitch,
        showRadioButton,
        showSlider,
        statusIndicator,
        statusIndicatorIcons,
        hasAccessoryIcon: accessoryIcon != null,
        accessoryIconAlwaysVisible,
        trailingTagLabel,
        hasAvatar,
        hasIcon: icon != null,
        currentState,
      }),
      [
        accessoryIcon,
        accessoryIconAlwaysVisible,
        hasAvatar,
        currentState,
        icon,
        showRadioButton,
        showSlider,
        showSwitch,
        statusIndicator,
        statusIndicatorIcons,
        subtitle,
        subtitleMaxLines,
        timestamp,
        timestampPosition,
        title,
        trailingTagLabel,
      ],
    );

    const contentDescription = useMemo(
      () => getListItemContentDescription({
        layout,
        titleContentDescription,
        subtitleContentDescription,
        timestampContentDescription,
        timestamp,
        statusIndicator,
        statusIndicatorIcons,
        trailingTagLabel,
        containerContentDescription: ariaLabelHtml ?? ariaLabel,
      }),
      [
        ariaLabel,
        ariaLabelHtml,
        layout,
        statusIndicator,
        statusIndicatorIcons,
        subtitleContentDescription,
        timestamp,
        timestampContentDescription,
        titleContentDescription,
        trailingTagLabel,
      ],
    );

    const {
      handleKeyDown,
      handleKeyUp,
      handleListItemClick,
    } = useListItemInteractionHandlers({
      disabled,
      layout,
      sliderValue,
      sliderMinimumValue,
      sliderMaximumValue,
      sliderIncrementPercentage,
      checked,
      onSliderValueChange,
      onCheckedChange,
      onClick,
    });
    const rootClassName = useMemo(
      () => `${styles.listItem} ${className}`,
      [className],
    );
    const isCheckable =
      layout.ariaRole === 'switch' || layout.ariaRole === 'radio';
    const isSlider = layout.ariaRole === 'slider';
    const ariaChecked = isCheckable ? checked : undefined;
    const ariaValueNow = isSlider
      ? clampListItemSliderValue(
          sliderValue,
          sliderMinimumValue,
          sliderMaximumValue,
        )
      : undefined;

    return (
      // Capture-phase wrapper intercepts Left/Right for slider before
      // InteractableBase can process them for focus navigation.
      <div
        onKeyDownCapture={handleKeyDown}
        onKeyUpCapture={handleKeyUp}
        style={LIST_ITEM_KEY_WRAPPER_STYLE}
      >
        <Container
          as={RootComponent}
          ref={ref}
          className={rootClassName}
          style={style}
          material={material}
          shapeProvider={shapeProvider}
          width="auto"
          height="auto"
          disabled={disabled}
          onClick={handleListItemClick}
          onStateChange={handleStateChange}
          partialFocusSupportedAxis={
            partialFocusSupportedAxis ??
            (showSlider ? PartialFocusSupportedAxis.Y : undefined)
          }
          role={
            roleProp ??
            (RootComponent === 'div' || isCheckable || isSlider
              ? layout.ariaRole
              : undefined)
          }
          ariaLabel={contentDescription}
          aria-checked={ariaChecked}
          aria-valuemin={isSlider ? sliderMinimumValue : undefined}
          aria-valuemax={isSlider ? sliderMaximumValue : undefined}
          aria-valuenow={ariaValueNow}
          {...containerProps}
        >
          <ListItemContent
            className={contentClassName}
            layout={layout}
            icon={icon}
            iconTintColor={iconTintColor}
            avatarSrc={avatarSrc}
            avatarPrimaryContent={avatarPrimaryContent}
            avatarSecondarySrc={avatarSecondarySrc}
            avatarSecondaryContent={avatarSecondaryContent}
            avatarBadgeSrc={avatarBadgeSrc}
            avatarBadgeContent={avatarBadgeContent}
            avatarAlt={avatarAlt}
            avatarShape={avatarShape}
            avatarStatusIndicator={avatarStatusIndicator}
            avatarStatusIndicatorIcon={avatarStatusIndicatorIcon}
            avatarPlaceholderStyle={avatarPlaceholderStyle}
            secondaryIcon={secondaryIcon}
            secondaryIconTintColor={secondaryIconTintColor}
            subtitleTextColor={subtitleTextColor}
            subtitleMaxLines={subtitleMaxLines}
            timestampPosition={timestampPosition}
            timestamp={timestamp}
            timestampTextColor={timestampTextColor}
            statusIndicator={statusIndicator}
            statusIndicatorIcons={statusIndicatorIcons}
            statusIndicatorIconTintColor={statusIndicatorIconTintColor}
            checked={checked}
            disabled={disabled}
            accessoryIcon={accessoryIcon}
            accessoryIconTintColor={accessoryIconTintColor}
            trailingTagLabel={trailingTagLabel}
            contentDescription={contentDescription}
            sliderValue={sliderValue}
            sliderMinimumValue={sliderMinimumValue}
            sliderMaximumValue={sliderMaximumValue}
          />
      </Container>
      </div>
    );
  }
);

export const ListItem = memo(ListItemImpl) as ListItemComponent;
