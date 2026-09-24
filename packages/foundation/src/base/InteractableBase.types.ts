/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
  ComponentPropsWithoutRef,
  ComponentPropsWithRef,
  ComponentRef,
  ElementType,
  HTMLAttributes,
  KeyboardEvent,
  MouseEventHandler,
  MouseEvent,
  ReactElement,
  ReactNode,
} from 'react';
import type {
  InvalidFocusDirection,
  PartialFocusHandoffDetail,
  PartialFocusSupportedAxis,
} from './FocusCoordinator';
import type { InteractionState } from './Interactions';
import type { TooltipMode } from './TooltipMode';
import type { TooltipPosition } from './TooltipPopup';
import type {
  TooltipCenterPositionProvider,
  TooltipTargetRectProvider,
} from './TooltipPositioning';

type InteractableElement<T extends ElementType> =
  ComponentRef<T> extends HTMLElement ? ComponentRef<T> : HTMLElement;

export type InteractableActivationEvent<
  T extends HTMLElement = HTMLDivElement,
> = MouseEvent<T> | KeyboardEvent<T>;

export interface InteractableBaseOwnProps<
  T extends HTMLElement = HTMLDivElement,
> {
  /**
   * Toolkit custom data attributes. React's HTMLAttributes does not type arbitrary
   * data-uit-* keys, so they are declared explicitly here.
   */
  [key: `data-uit-${string}`]: string | number | boolean | undefined;
  as?: ElementType;
  children?: ReactNode;
  disabled?: boolean;
  interactive?: boolean;
  focusable?: boolean;
  initialFocusEligible?: boolean;
  pressable?: boolean;
  clickable?: boolean;
  /** Receives a genuine DOM click event for pointer and compatibility activation. */
  onClick?: MouseEventHandler<T>;
  /**
   * Invoked once when the control activates. Keyboard activation receives the
   * originating keyboard event; pointer and programmatic activation receive a
   * mouse event.
   */
  onActivate?: (event: InteractableActivationEvent<T>) => void;
  /**
   * Invoked on long press. The originating gesture may be a pointer or a
   * keyboard activation, hence the union event type.
   */
  onLongPress?: (
    event: MouseEvent<T> | KeyboardEvent<T>,
  ) => void;
  onStateChange?: (prevState: InteractionState, newState: InteractionState) => void;
  /**
   * The toolkit's convenience alias for the accessible label. Maps to the rendered
   * aria-label when the standard `aria-label` prop is not provided.
   */
  ariaLabel?: string;
  tooltipText?: string;
  tooltipMetadata?: string;
  tooltipContent?: ReactNode;
  tooltipContentDescription?: string;
  tooltipFocusable?: boolean;
  tooltipMode?: TooltipMode;
  tooltipPosition?: TooltipPosition;
  tooltipShowTail?: boolean;
  tooltipCenterPositionProvider?: TooltipCenterPositionProvider;
  tooltipTargetRectProvider?: TooltipTargetRectProvider;
  tooltipHidesFocusState?: boolean;
  /**
   * Which axes support partial-focus feedback. Set to None to disable
   * partial-focus rubberband/handoff feedback for this interactable.
   */
  partialFocusSupportedAxis?: PartialFocusSupportedAxis;
  /**
   * Whether rubberband feedback translates the interactable. When false, active
   * rubberband feedback updates partial-focus material origins without moving
   * the interactable root.
   */
  isRubberbandTranslationEnabled?: boolean;
  /**
   * Called when directional focus input cannot move focus in the requested
   * direction (the failed directional-movement path).
   */
  onInvalidFocusDirection?: (direction: InvalidFocusDirection) => void;
  /**
   * Called when focus moves between interactables so visual components can
   * render the partial-focus handoff material effect.
   */
  onPartialFocusHandoff?: (detail: PartialFocusHandoffDetail) => void;
}

export type InteractableBaseProps<
  T extends ElementType = 'div',
> = InteractableBaseOwnProps<InteractableElement<T>> &
  Omit<
    ComponentPropsWithoutRef<T>,
    keyof InteractableBaseOwnProps<InteractableElement<T>> | 'as' | 'disabled'
  > & {
    as?: T;
  };

export interface InteractableBaseComponent {
  (
    props: InteractableBaseProps<'div'> & {
      ref?: ComponentPropsWithRef<'div'>['ref'];
    },
  ): ReactElement | null;
  <T extends ElementType>(
    props: InteractableBaseProps<T> & {
      as: T;
      ref?: ComponentPropsWithRef<T>['ref'];
    },
  ): ReactElement | null;
}

export type InteractableBaseImplementationProps =
  InteractableBaseOwnProps<HTMLElement> &
  Omit<
    HTMLAttributes<HTMLElement>,
    keyof InteractableBaseOwnProps<HTMLElement> | 'disabled'
  >;
