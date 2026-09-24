/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Trailing tag shown after a Button/ListItem title. A closed set, not
 * caller-supplied text. The displayed label is owned by the design system so it
 * stays consistent and localizable rather than accepting arbitrary strings.
 */
export const TrailingTag = {
  NONE: 'none',
  BETA: 'beta',
} as const;

export type TrailingTag = (typeof TrailingTag)[keyof typeof TrailingTag];

const TRAILING_TAG_LABEL: Record<Exclude<TrailingTag, typeof TrailingTag.NONE>, string> = {
  [TrailingTag.BETA]: 'Beta',
};

/** Resolve a {@link TrailingTag} to its display label, or `null` for `NONE`. */
export function getTrailingTagLabel(tag: TrailingTag): string | null {
  return tag === TrailingTag.NONE ? null : TRAILING_TAG_LABEL[tag];
}
