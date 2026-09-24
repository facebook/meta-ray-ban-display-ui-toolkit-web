/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Material library - Factory methods for common materials.
 */

import type { ContainerMaterial } from './ContainerMaterial';
import {
  Blue,
  Green,
  Gray,
  Red,
  Slate,
} from '../colors/Colors';
import { createActionHintMaterial } from './ActionHintMaterial';
import { createBackgroundImageBlurContainerMaterial } from './BackgroundImageBlurContainerMaterial';
import { createContextMenuItemMaterial } from './ContextMenuItemMaterial';
import { createControlTileCheckedIconContainerMaterial } from './ControlTileIconContainerMaterial';
import {
  createCardContainerMaterial,
  createFullScreenCardContainerMaterial,
} from './CardContainerMaterial';
import {
  createDefaultContainerMaterial,
  type DefaultContainerMaterialOptions,
} from './DefaultContainerMaterial';
import {
  createClockPillContainerMaterial,
  createReducedOpacityStaticContainerMaterial,
  createStatusIndicatorPanelContainerMaterial,
} from './SpecializedContainerMaterials';
import {
  createOutboundMessageMaterial,
} from './OutboundMessageMaterial';
import type { OutboundMessageMaterialTheme } from './OutboundMessageMaterial';
import { createPanelContainerMaterial } from './PanelContainerMaterial';
import { createStaticContainerMaterial } from './StaticContainerMaterial';
import { createTextInputContainerMaterial } from './TextInputContainerMaterial';
import { createUnboundedContainerMaterial } from './UnboundedContainerMaterial';

const DEFAULT_OUTBOUND_MESSAGE: OutboundMessageMaterialTheme = {
  idleFill: Slate['950'],
  gradientStep1: Slate['700'],
  gradientStep2: Slate['950'],
  gradientStep3: Slate['1100'],
  gradientStep4: Slate['1100'],
  glowTint: Slate['500'],
};

const THEMED_PRIMARY: OutboundMessageMaterialTheme = {
  idleFill: Gray['950'],
  gradientStep1: Gray['500'],
  gradientStep2: Gray['800'],
  gradientStep3: Gray['1100'],
  gradientStep4: Gray['1100'],
  glowTint: Slate['550'],
};

const THEMED_SECONDARY: OutboundMessageMaterialTheme = {
  idleFill: Gray['1000'],
  gradientStep1: Gray['700'],
  gradientStep2: Gray['950'],
  gradientStep3: Gray['1050'],
  gradientStep4: Gray['1100'],
  glowTint: Slate['550'],
};

const THEMED_POSITIVE: OutboundMessageMaterialTheme = {
  idleFill: Gray['1000'],
  gradientStep1: '#26A756',
  gradientStep2: '#056C42',
  gradientStep3: '#003C29',
  gradientStep4: '#002519',
  glowTint: '#26A756',
};

const THEMED_NEGATIVE: OutboundMessageMaterialTheme = {
  idleFill: Gray['1000'],
  gradientStep1: Red['500'],
  gradientStep2: Red['700'],
  gradientStep3: Red['950'],
  gradientStep4: Red['1050'],
  glowTint: Red['500'],
};

const THEMED_SYSTEM: OutboundMessageMaterialTheme = {
  idleFill: Gray['1000'],
  gradientStep1: Gray['500'],
  gradientStep2: Gray['700'],
  gradientStep3: Gray['950'],
  gradientStep4: Gray['1050'],
  glowTint: Gray['700'],
};

export const MaterialLibrary = {
  /**
   * Default material for interactive containers (no drop shadow)
   */
  default: (options: DefaultContainerMaterialOptions = {}): ContainerMaterial =>
    createDefaultContainerMaterial(options),

  /**
   * Default material WITH drop shadow
   *
   * Drop shadow uses DropShadowContainerMaterialLayer defaults:
   *   radius=8px, offsetX=0, offsetY=8px, alpha=128 (50%)
   */
  defaultWithDropShadow: (): ContainerMaterial =>
    createDefaultContainerMaterial({ withDropShadow: true }),

  /**
   * Button material (full corner radius)
   * Used for buttons with FULL corner radius
   */
  button: (): ContainerMaterial =>
    createDefaultContainerMaterial(),

  /** Default checked ControlTile icon material. */
  controlTileCheckedIcon: (): ContainerMaterial =>
    createControlTileCheckedIconContainerMaterial(),

  /**
   * Context menu item material.
   * Uses the default material with the glow hidden in the DEFAULT state and full
   * corner radius. It swaps the default idle layer to NoOp, so unfocused context
   * menu items draw directly on the menu surface instead of rendering their own
   * dark pills.
   */
  contextMenuItem: (): ContainerMaterial =>
    createContextMenuItemMaterial(createDefaultContainerMaterial),

  /**
   * Card material.
   *
   * Unlike DefaultContainerMaterial, CardContainerMaterial has:
   * - NO focused gradient layer (null)
   * - NO inner shadow, NO noise, NO drop shadow
   * - 3 stroke layers (idle border + back glow + front glow) in FOREGROUND
   * - Idle border at 50% alpha in DEFAULT state (visible border at rest)
   * - Back/front glow strokes with the hard-light blend mode
   */
  card: (): ContainerMaterial => createCardContainerMaterial(),

  /**
   * Full-screen card material.
   *
   * Focus keeps the idle card appearance; pressed only adds the interaction
   * press layer. The foreground border stays visible in focused/pressed state
   * and grows from 1px to 2px.
   */
  fullScreenCard: (): ContainerMaterial => createFullScreenCardContainerMaterial(),

  /**
   * Panel material (non-interactive, reduced opacity per state)
   *
   * Builds on the default container material and applies alpha multipliers to
   * EVERY layer:
   *   - NONE/DEFAULT: 0.5x (50%)
   *   - FOCUSED: 0.75x (75%)
   *   - PRESSED: 0.9x (90%)
   *
   * Also includes a scrim layer: a linear gradient from transparent to opaque
   * black covering the bottom 64px, creating a subtle darkening at the bottom
   * edge.
   *
   * Each layer's draw is wrapped to multiply opacity by the state-dependent alpha
   * multiplier.
   */
  panel: (): ContainerMaterial =>
    createPanelContainerMaterial(createDefaultContainerMaterial),

  /**
   * Default STATIC material for non-interactive containers (StaticContainer, Chip, Tag, etc.)
   *
   * Built through DefaultContainerMaterial with a solid idle layer, no focused
   * fill, no inner shadow, and the regular idle glow stroke. StaticContainer
   * holds it in DEFAULT state, so the visible output is the idle fill plus the
   * 1px OVERLAY glow stroke.
   */
  defaultStatic: (options?: {
    withDropShadow?: boolean;
    idleColor?: string;
    secondary?: boolean;
  }): ContainerMaterial =>
    createStaticContainerMaterial(options),

  /**
   * Flat material (no drop shadow) -- identical to default
   *
   * Since default already has no drop shadow, this is an alias.
   */
  flat: (): ContainerMaterial => createDefaultContainerMaterial(),

  /**
   * Unbounded material — transparent at rest, shows gradient on focus.
   *
   * Differences from defaultMaterial:
   * - Idle layer: NoOp (transparent, draws nothing)
   * - Glow stroke hidden for NONE and DEFAULT states
   * - No drop shadow
   */
  unbounded: (): ContainerMaterial =>
    createUnboundedContainerMaterial(createDefaultContainerMaterial),

  /**
   * Notification center item material (with drop shadow)
   */
  notificationCenterItem: (): ContainerMaterial =>
    createDefaultContainerMaterial({ withDropShadow: true }),

  /**
   * Background image blur material.
   *
   * Layer order:
   * - blurred image content in the background
   * - dark 50% fill overlay in the background
   * - pressed interaction overlay in the foreground
   * - focused/default glow stroke in the foreground
   */
  backgroundImageBlur: (imageSrc: string | null = null): ContainerMaterial =>
    createBackgroundImageBlurContainerMaterial(imageSrc),

  /**
   * Full DefaultContainerMaterial with themed colors.
   * Creates a DefaultContainerMaterial with themed idle fill, radial gradient,
   * inner glow, glow stroke, noise, and press overlay.
   */
  outboundMessage: (
    theme: OutboundMessageMaterialTheme = DEFAULT_OUTBOUND_MESSAGE,
  ): ContainerMaterial =>
    createOutboundMessageMaterial(createDefaultContainerMaterial, theme),

  /**
   * Themed primary material. Passing a theme keeps the existing escape hatch
   * used by message/demo code.
   */
  themedPrimary: (theme: OutboundMessageMaterialTheme = THEMED_PRIMARY): ContainerMaterial =>
    createOutboundMessageMaterial(createDefaultContainerMaterial, theme),

  /**
   * Themed secondary material.
   */
  themedSecondary: (): ContainerMaterial =>
    createOutboundMessageMaterial(createDefaultContainerMaterial, THEMED_SECONDARY),

  /**
   * Positive material.
   */
  positive: (useDefaultIdleState: boolean = true): ContainerMaterial =>
    createOutboundMessageMaterial(createDefaultContainerMaterial, {
      ...THEMED_POSITIVE,
      idleFill: useDefaultIdleState ? Gray['1000'] : THEMED_POSITIVE.gradientStep1,
    }),

  /**
   * Negative material.
   */
  negative: (useDefaultIdleState: boolean = true): ContainerMaterial =>
    createOutboundMessageMaterial(createDefaultContainerMaterial, {
      ...THEMED_NEGATIVE,
      idleFill: useDefaultIdleState ? Gray['1000'] : Red['500'],
    }),

  /**
   * System material.
   */
  system: (): ContainerMaterial =>
    createOutboundMessageMaterial(createDefaultContainerMaterial, THEMED_SYSTEM),

  /**
   * Clock pill material.
   *
   * Idle is transparent, focused/pressed use a vertical translucent surface
   * gradient, and the glow stroke is hidden while idle.
   */
  clockPill: (): ContainerMaterial => createClockPillContainerMaterial(),

  /**
   * Reduced-opacity static material.
   *
   * This keeps the default press/glow stroke behavior but replaces the idle
   * fill with a 0x4D-alpha default surface and omits focused fill.
   */
  reducedOpacityStatic: (): ContainerMaterial =>
    createReducedOpacityStaticContainerMaterial(),

  /**
   * Status-indicator panel material.
   *
   * The idle layer is a top-to-bottom surface scrim that fades out before the
   * final 12px of the path.
   */
  statusIndicatorPanel: (): ContainerMaterial =>
    createStatusIndicatorPanelContainerMaterial(),

  themedPrimaryBlue: (): ContainerMaterial => MaterialLibrary.themedPrimary({
    idleFill: Blue['500'],
    gradientStep1: Blue['500'],
    gradientStep2: Blue['700'],
    gradientStep3: Blue['950'],
    gradientStep4: Blue['1050'],
    glowTint: Blue['500'],
  }),

  themedPrimaryGreen: (): ContainerMaterial => MaterialLibrary.themedPrimary({
    idleFill: Green['500'],
    gradientStep1: Green['500'],
    gradientStep2: Green['700'],
    gradientStep3: Green['950'],
    gradientStep4: Green['1050'],
    glowTint: Green['500'],
  }),

  themedPrimaryRed: (): ContainerMaterial => MaterialLibrary.themedPrimary({
    idleFill: Red['500'],
    gradientStep1: Red['500'],
    gradientStep2: Red['700'],
    gradientStep3: Red['950'],
    gradientStep4: Red['1050'],
    glowTint: Red['500'],
  }),

  inboundMessage: (): ContainerMaterial => MaterialLibrary.outboundMessage({
    idleFill: Gray['950'], gradientStep1: Gray['700'], gradientStep2: Gray['950'],
    gradientStep3: Slate['1100'], gradientStep4: Slate['1100'], glowTint: Slate['500'],
  }),

  /**
   * Text input material with an idle-visible inner shadow and border stroke
   * that fade out on focus.
   */
  textInput: (): ContainerMaterial =>
    createTextInputContainerMaterial(createDefaultContainerMaterial),

  /**
   * Action hint material
   *
   * Two layers:
   *   1. Linear gradient from 15% white to transparent white (top-left to bottom-right)
   *   2. Radial gradient glow stroke at 10% alpha
   *
   * Used with cornerRadius = XSMALL (16px) applied after creation.
   */
  actionHint: (): ContainerMaterial => createActionHintMaterial(),
};

export type { MaterialLibraryFactory } from './MaterialLibrary.types';
