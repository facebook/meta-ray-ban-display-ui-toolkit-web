/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
  ComponentPropsWithRef,
  ElementType,
  ReactElement,
  ReactNode,
  Ref,
} from 'react';
import type { InteractableBaseProps } from '../base/InteractableBase';
import type { InteractableBaseImplementationProps } from '../base/InteractableBase.types';
import type {
  ContentScaleForStateFn,
  InteractionState,
  VisualState,
  VisualStateForInteractionStateFn,
} from '../base/Interactions';
import type { ContainerMaterial } from '../material/ContainerMaterial';
import type { ShapeProvider } from '../material/ShapeProvider';
import type { ContainerRootStyle, ContainerContentStyle, ContentClipMode } from './ContainerContent.types';
import type { ContainerMaterialTransition } from './ContainerMaterialLayers.types';

export interface ContainerStateChangeAnimation {
  duration: number;
  startDelay?: number;
  onStart?: () => void;
  onFrame: (elapsedMs: number, linearProgress: number) => void;
  onComplete?: () => void;
  onCancel?: () => void;
}

export interface ContainerStateChangeAnimationContext {
  prevInteraction: InteractionState;
  newInteraction: InteractionState;
  animated: boolean;
  transition: { duration: number; interpolator: string };
  containerSize: { width: number; height: number };
}

export interface ContainerOwnProps {
  children?: ReactNode;
  material?: ContainerMaterial;
  width?: number | string;
  height?: number | string;
  /** Shape clipping, rectangular bounds clipping, or visible content overflow. */
  contentClip?: ContentClipMode;
  /** Content layout class; geometry and clipping remain toolkit-owned. */
  contentClassName?: string;
  /** Content padding, layout and typography styles. */
  contentStyle?: ContainerContentStyle;
  /** Ref to the content layout element. */
  contentRef?: Ref<HTMLDivElement>;
  /** Outer placement and whole-component composition styles. */
  style?: ContainerRootStyle;
  /**
   * Controls the complete interaction state while preserving the standard
   * material, scale, and disabled-state transitions. DOM interaction state does
   * not drive the container while this is set.
   */
  interactionStateOverride?: InteractionState;
  /**
   * Forces the container's visual state instead of deriving it from
   * interaction, used to render driven previews (e.g. docs/gallery) in an
   * explicit state.
   */
  visualStateOverride?: VisualState;
  /**
   * Lets a caller externally drive a material transition (from/to/progress) for
   * scripted or scrubbed previews.
   */
  materialTransition?: ContainerMaterialTransition;
  visualStateForInteractionStateFn?: VisualStateForInteractionStateFn;
  contentScaleForStateFn?: ContentScaleForStateFn;
  onScaleChange?: (scale: number) => void;
  customScaleX?: number;
  customScaleY?: number;
  customAlpha?: number;
  /** Caller-owned horizontal translation added to interaction movement. */
  customTranslationX?: number;
  /** Caller-owned vertical translation added to interaction movement. */
  customTranslationY?: number;
  /** Geometry used for clipping and all material fill/stroke paths. */
  shapeProvider?: ShapeProvider;
  stateChangeAnimations?: (
    context: ContainerStateChangeAnimationContext,
  ) => ContainerStateChangeAnimation[];
}

export type ContainerProps<T extends ElementType = 'div'> =
  ContainerOwnProps & Omit<InteractableBaseProps<T>, keyof ContainerOwnProps>;

export type ContainerImplementationProps = ContainerOwnProps & Omit<
  InteractableBaseImplementationProps,
  keyof ContainerOwnProps
>;

export interface ContainerComponent {
  (
    props: ContainerProps<'div'> & {
      ref?: ComponentPropsWithRef<'div'>['ref'];
    },
  ): ReactElement | null;
  <T extends ElementType>(
    props: ContainerProps<T> & {
      as: T;
      ref?: ComponentPropsWithRef<T>['ref'];
    },
  ): ReactElement | null;
}
