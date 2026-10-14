/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Trailing tag shown after a Button/ListItem title. The semantic tag stays a
 * closed set. Host components can pass localized labels to the resolver while
 * preserving the design-system-owned cases.
 */
export const TrailingTag = {
  NONE: 'none',
  BETA: 'beta',
} as const;

export type TrailingTag = (typeof TrailingTag)[keyof typeof TrailingTag];

/** Localized labels for the visible trailing-tag cases. */
export type TrailingTagLabels = Partial<
  Record<Exclude<TrailingTag, typeof TrailingTag.NONE>, string>
>;

const TRAILING_TAG_LABEL: Record<
  Exclude<TrailingTag, typeof TrailingTag.NONE>,
  string
> = {
  [TrailingTag.BETA]: 'Beta',
};

/**
 * Resolve a {@link TrailingTag} to its display label, or `null` for `NONE`.
 * Localized labels override the built-in English fallbacks by semantic tag.
 */
export function getTrailingTagLabel(
  tag: TrailingTag,
  labels?: TrailingTagLabels,
): string | null {
  if (tag === TrailingTag.NONE) {
    return null;
  }

  const localizedLabel = labels?.[tag];
  return localizedLabel != null && localizedLabel.trim().length > 0
    ? localizedLabel
    : TRAILING_TAG_LABEL[tag];
}
