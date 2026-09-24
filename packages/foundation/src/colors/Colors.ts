/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Toolkit color palette
 *
 * IMPORTANT: DO NOT USE THESE COLORS DIRECTLY IN COMPONENTS!
 * Always retrieve colors from the theme via semantic usages.
 * These are the raw palette values that themes build upon.
 *
 * Scope: this file defines the neutral and accent scales
 * (Gray/Slate/Blue/Red/Green/Orange/Purple/Teal/Cyan) plus
 * Utility/Overlay/MaterialColors. Add a new scale here only if a public toolkit
 * component genuinely needs it.
 */

// ============================================================================
// COLOR SCALES
// Each scale goes from 050 (lightest) to 1100 (darkest)
// ============================================================================

/**
 * Gray color scale
 * Used for: backgrounds, surfaces, neutral UI elements
 */
export const Gray = {
  '050': '#F3F4F5',
  '100': '#E8EAED',
  '150': '#DFE2E6',
  '200': '#CFD3D9',
  '250': '#C2C6CE',
  '300': '#B2B7C0',
  '350': '#AAAFB9',
  '400': '#9FA4AE',
  '450': '#959BA5',
  '500': '#8D929D',
  '550': '#7D838E',
  '600': '#6D747F',
  '650': '#646A76',
  '700': '#585E6A',
  '750': '#4E545F',
  '800': '#474D57',
  '850': '#41454E',
  '900': '#383B43',
  '950': '#30333A',
  '1000': '#27282D',
  '1050': '#1E1E21',
  '1100': '#111113',
} as const;

/**
 * Slate color scale
 * Used for: subtle blue-tinted grays, inner shadows, glow effects
 */
export const Slate = {
  '050': '#F1F4F7',
  '100': '#E7EBF2',
  '150': '#DBE2EB',
  '200': '#C9D3E2',
  '250': '#BBC7DA',
  '300': '#A8B8D0',
  '350': '#9FB0CA',
  '400': '#92A5C1',
  '450': '#889BBB',
  '500': '#7F93B5',
  '550': '#6D84A9',
  '600': '#5D759D',
  '650': '#546A92',
  '700': '#495E84',
  '750': '#415478',
  '800': '#3A4D6F',
  '850': '#344564',
  '900': '#2D3B56',
  '950': '#27344A',
  '1000': '#1F283A',
  '1050': '#181F2D',
  '1100': '#0E1119',
} as const;

/**
 * Blue color scale
 * Used for: primary actions, links, focus states
 */
export const Blue = {
  '050': '#ECF5FF',
  '100': '#DBECFF',
  '150': '#C9E5FF',
  '200': '#AFD7FF',
  '250': '#96CBFF',
  '300': '#78BEFF',
  '350': '#65B4FE',
  '400': '#4BA9FE',
  '450': '#3E9EFB',
  '500': '#2694FE',
  '550': '#0082FB',
  '600': '#0171E3',
  '650': '#0064E0',
  '700': '#0457CB',
  '750': '#004CBC',
  '800': '#0143B5',
  '850': '#083BA9',
  '900': '#042F97',
  '950': '#03278D',
  '1000': '#001E75',
  '1050': '#02165E',
  '1100': '#000844',
} as const;

/**
 * Red color scale
 * Used for: errors, destructive actions, alerts
 */
export const Red = {
  '050': '#FEF1F2',
  '100': '#FEE4E6',
  '150': '#FFD8DB',
  '200': '#FFC4C8',
  '250': '#FFB2B8',
  '300': '#FE9DA6',
  '350': '#FD8E99',
  '400': '#FB7D87',
  '450': '#FF6877',
  '500': '#FF5668',
  '550': '#F5394F',
  '600': '#E3193B',
  '650': '#D31130',
  '700': '#BE0424',
  '750': '#AA071E',
  '800': '#9D0519',
  '850': '#8F0717',
  '900': '#7B0210',
  '950': '#6F0007',
  '1000': '#5A0107',
  '1050': '#460403',
  '1100': '#2A0404',
} as const;

/**
 * Green color scale
 * Used for: success states, positive feedback
 */
export const Green = {
  '050': '#DCFCD6',
  '100': '#C4F8B9',
  '150': '#A5F690',
  '200': '#81EB5E',
  '250': '#68E03C',
  '300': '#56D132',
  '350': '#4EC72A',
  '400': '#3CBC22',
  '450': '#2BB21C',
  '500': '#1EA920',
  '550': '#0B991F',
  '600': '#0D8626',
  '650': '#147B29',
  '700': '#076D29',
  '750': '#0F6124',
  '800': '#0C5924',
  '850': '#095122',
  '900': '#09441F',
  '950': '#003D15',
  '1000': '#053018',
  '1050': '#042513',
  '1100': '#001608',
} as const;

/**
 * Orange color scale
 * Used for: warnings, attention states
 */
export const Orange = {
  '050': '#FFF2E4',
  '100': '#FFE6CF',
  '150': '#FFDBB9',
  '200': '#FDC996',
  '250': '#FDB876',
  '300': '#FDA449',
  '350': '#FD9537',
  '400': '#F88617',
  '450': '#F27902',
  '500': '#EB6E00',
  '550': '#D66100',
  '600': '#C05203',
  '650': '#B34A01',
  '700': '#A13F04',
  '750': '#913709',
  '800': '#883000',
  '850': '#7D2A06',
  '900': '#6B2203',
  '950': '#611C09',
  '1000': '#4E1608',
  '1050': '#3E1000',
  '1100': '#270701',
} as const;

/**
 * Purple color scale
 * Used for: special states, premium features
 */
export const Purple = {
  '050': '#F4F3FF',
  '100': '#E8E8FB',
  '150': '#DFDFFF',
  '200': '#CECEFE',
  '250': '#C2C1FD',
  '300': '#B3B0FE',
  '350': '#AAA6FA',
  '400': '#A197FF',
  '450': '#978CFF',
  '500': '#9081FF',
  '550': '#856CFF',
  '600': '#7952FF',
  '650': '#7340FE',
  '700': '#6B1EFD',
  '750': '#620CEA',
  '800': '#5B08D8',
  '850': '#5306C6',
  '900': '#4507A9',
  '950': '#3E0697',
  '1000': '#31067B',
  '1050': '#260660',
  '1100': '#18023E',
} as const;

/**
 * Teal color scale
 */
export const Teal = {
  '050': '#D7FCF8',
  '100': '#BCF5F0',
  '150': '#A3F0E6',
  '200': '#6CE6D8',
  '250': '#40DCCD',
  '300': '#28CDBF',
  '350': '#1DC3B9',
  '400': '#0DB7AF',
  '450': '#05ACAA',
  '500': '#08A3A3',
  '550': '#0C9293',
  '600': '#038183',
  '650': '#08767D',
  '700': '#0F686F',
  '750': '#025D66',
  '800': '#08555E',
  '850': '#074D58',
  '900': '#00414B',
  '950': '#083943',
  '1000': '#062D38',
  '1050': '#00232D',
  '1100': '#01141C',
} as const;

/**
 * Cyan color scale
 */
export const Cyan = {
  '050': '#DBF9FE',
  '100': '#BBF4FC',
  '150': '#A1EEF9',
  '200': '#70E2F7',
  '250': '#4AD7F3',
  '300': '#25C8EE',
  '350': '#0BBEE9',
  '400': '#06B1E1',
  '450': '#03A7D7',
  '500': '#089DD0',
  '550': '#028DC1',
  '600': '#0F7BAE',
  '650': '#0171A4',
  '700': '#086395',
  '750': '#075888',
  '800': '#015082',
  '850': '#014975',
  '900': '#053D64',
  '950': '#053659',
  '1000': '#002B49',
  '1050': '#00213A',
  '1100': '#011228',
} as const;

// ============================================================================
// UTILITY COLORS
// ============================================================================

export const Utility = {
  /** Pure black for occluding/masking */
  occlude: '#000000',
  /** Pure white */
  white: '#FFFFFF',
  /** Transparent */
  transparent: 'rgba(0, 0, 0, 0)',
  /** Transparent white (for gradients that fade to white) */
  transparentWhite: 'rgba(255, 255, 255, 0)',
} as const;

// ============================================================================
// OVERLAY COLORS
// ============================================================================

export const Overlay = {
  /**
   * Dark overlays (semi-transparent black)
   */
  dark: {
    75: 'rgba(0, 0, 0, 0.75)',
    50: 'rgba(0, 0, 0, 0.50)',
    40: 'rgba(0, 0, 0, 0.40)',
    30: 'rgba(0, 0, 0, 0.30)',
    25: 'rgba(0, 0, 0, 0.25)',
  },
  /**
   * Light overlays (semi-transparent white)
   */
  light: {
    75: 'rgba(255, 255, 255, 0.75)',
    50: 'rgba(255, 255, 255, 0.50)',
    25: 'rgba(255, 255, 255, 0.25)',
    15: 'rgba(255, 255, 255, 0.15)',
    10: 'rgba(255, 255, 255, 0.10)',
    5: 'rgba(255, 255, 255, 0.05)',
  },
} as const;

// ============================================================================
// SEMANTIC ALIASES (for material layers)
// These map specific color needs to the palette
// ============================================================================

/**
 * Colors used in material layer rendering
 * These are the specific colors used by the default container material
 */
export const MaterialColors = {
  // Radial gradient colors (4-step) for focused material
  gradientStep1: Gray[700],  // '#585E6A'
  gradientStep2: Gray[950],  // '#30333A'
  gradientStep3: Gray[1050], // '#1E1E21'
  gradientStep4: Gray[1100], // '#111113'

  // Background surface color
  backgroundSurface: Gray[1000], // '#27282D'

  // Notification badge fill color
  notificationBadge: Red[500], // '#FF5668'

  // Elevation 1 background color
  backgroundElevation1: Gray[950], // '#30333A'

  // Inner shadow / glow tint
  innerGlowTint: Slate[550], // '#6D84A9'

  // Stroke colors
  strokeHighlight: Utility.white,
  strokeIdle: Utility.transparentWhite,
  controlIdle: Overlay.light[50],

  // Pressed overlay
  //   = inner glow tint RGB (#6D84A9) + 25% alpha from the light overlay
  //   = rgba(109, 132, 169, 0.25)
  pressedOverlay: 'rgba(109, 132, 169, 0.25)',
} as const;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type {
  ColorScale,
  ColorStep,
} from './Colors.types';
