/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Whether the page header should render.
 *
 * The header is visible whenever `showHeader` is true and hidden otherwise —
 * independent of whether any header content (text, metadata, icon, avatar) has
 * been set. `showHeader` is the sole suppression path.
 */
export function shouldRenderPageHeader({
  showHeader,
}: {
  showHeader: boolean;
}): boolean {
  return showHeader;
}

export function getPagePaneTitle(
  shouldRenderHeader: boolean,
  headerText?: string,
  headerMetadata?: string,
): string | undefined {
  if (!shouldRenderHeader) {
    return undefined;
  }
  // The pane title joins the header text and metadata.
  const parts = [headerText, headerMetadata].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : undefined;
}
