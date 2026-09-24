/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export interface GalleryDestination {
  title: string;
  category: string;
  path: string;
  aliases?: readonly string[];
}

export const GALLERY_DESTINATIONS: readonly GalleryDestination[] = [
  { title: 'Actions', category: 'Categories', path: '/actions' },
  { title: 'Content', category: 'Categories', path: '/content' },
  { title: 'Controls', category: 'Categories', path: '/controls' },
  { title: 'Feedback and overlays', category: 'Categories', path: '/feedback', aliases: ['feedback'] },
  { title: 'Lists and menus', category: 'Categories', path: '/lists', aliases: ['lists'] },
  { title: 'Navigation', category: 'Categories', path: '/navigation' },
  { title: 'Status and loading', category: 'Categories', path: '/status', aliases: ['status', 'loading'] },
  { title: 'Surfaces', category: 'Categories', path: '/surfaces' },
  { title: 'Button', category: 'Actions', path: '/actions/button' },
  { title: 'ButtonGroup and ButtonDivider', category: 'Actions', path: '/actions/button-group', aliases: ['button group', 'button divider'] },
  { title: 'ButtonRail', category: 'Actions', path: '/actions/button-rail' },
  { title: 'QuickReplyButton', category: 'Actions', path: '/actions/quick-reply-button', aliases: ['quick reply'] },
  { title: 'Chip', category: 'Actions', path: '/actions/chip' },
  { title: 'ActionHint', category: 'Actions', path: '/actions/action-hint' },
  { title: 'TextView', category: 'Content', path: '/content/text-view' },
  { title: 'Avatar', category: 'Content', path: '/content/avatar' },
  { title: 'AppBadge', category: 'Content', path: '/content/app-badge' },
  { title: 'NotificationBadge', category: 'Content', path: '/content/notification-badge' },
  { title: 'Tag', category: 'Content', path: '/content/tag' },
  { title: 'ContainerHeader', category: 'Content', path: '/content/container-header' },
  { title: 'ReadMoreTextView', category: 'Content', path: '/content/read-more-text-view' },
  { title: 'TextSwitcher', category: 'Content', path: '/content/text-switcher' },
  { title: 'IconImage', category: 'Content', path: '/content/icon-image' },
  { title: 'Switch', category: 'Controls', path: '/controls/switch' },
  { title: 'RadioButton', category: 'Controls', path: '/controls/radio-button' },
  { title: 'SliderBar', category: 'Controls', path: '/controls/slider-bar' },
  { title: 'Scrubber', category: 'Controls', path: '/controls/scrubber' },
  { title: 'InputTextView', category: 'Controls', path: '/controls/input-text-view' },
  { title: 'IsolatedControl', category: 'Controls', path: '/controls/isolated-control' },
  { title: 'ControlTile', category: 'Controls', path: '/controls/control-tile' },
  { title: 'AppControlTile', category: 'Controls', path: '/controls/app-control-tile' },
  { title: 'Toast', category: 'Feedback and overlays', path: '/feedback/toast' },
  { title: 'Tooltip', category: 'Feedback and overlays', path: '/feedback/tooltip' },
  { title: 'Modal', category: 'Feedback and overlays', path: '/feedback/modal' },
  { title: 'ContextMenu', category: 'Feedback and overlays', path: '/feedback/context-menu' },
  { title: 'Scrim', category: 'Feedback and overlays', path: '/feedback/scrim' },
  { title: 'ListItem', category: 'Lists and menus', path: '/lists/list-item' },
  { title: 'VerticalList', category: 'Lists and menus', path: '/lists/vertical-list' },
  { title: 'SwipeToReveal', category: 'Lists and menus', path: '/lists/swipe-to-reveal' },
  { title: 'VerticalMenu', category: 'Lists and menus', path: '/lists/vertical-menu' },
  { title: 'Header', category: 'Navigation', path: '/navigation/header' },
  { title: 'SubNavigation', category: 'Navigation', path: '/navigation/sub-navigation' },
  { title: 'SubNavigationPager', category: 'Navigation', path: '/navigation/sub-navigation-pager' },
  { title: 'Pager', category: 'Navigation', path: '/navigation/pager' },
  { title: 'PaginationIndicator', category: 'Navigation', path: '/navigation/pagination-indicator' },
  { title: 'SwipeIndicator', category: 'Navigation', path: '/navigation/swipe-indicator' },
  { title: 'ProgressIndicator', category: 'Status and loading', path: '/status/progress-indicator' },
  { title: 'ProgressRing', category: 'Status and loading', path: '/status/progress-ring' },
  { title: 'CircularProgressBar', category: 'Status and loading', path: '/status/circular-progress-bar' },
  { title: 'IndeterminateLoader', category: 'Status and loading', path: '/status/indeterminate-loader' },
  { title: 'Shimmer', category: 'Status and loading', path: '/status/shimmer' },
  { title: 'VolumeIndicator', category: 'Status and loading', path: '/status/volume-indicator' },
  { title: 'ZoomIndicator', category: 'Status and loading', path: '/status/zoom-indicator' },
  { title: 'Panel', category: 'Surfaces', path: '/surfaces/panel' },
  { title: 'StaticContainer', category: 'Surfaces', path: '/surfaces/static-container' },
  { title: 'Container', category: 'Surfaces', path: '/surfaces/container' },
  { title: 'Surface', category: 'Surfaces', path: '/surfaces/surface' },
  { title: 'Card', category: 'Surfaces', path: '/surfaces/card' },
  { title: 'CardStack', category: 'Surfaces', path: '/surfaces/card-stack' },
  { title: 'Carousel', category: 'Surfaces', path: '/surfaces/carousel' },
  { title: 'MediaWrapper', category: 'Surfaces', path: '/surfaces/media-wrapper' },
  { title: 'Vignette', category: 'Surfaces', path: '/surfaces/vignette' },
];

// Locale-independent on purpose: a locale-sensitive lowercase can map ASCII
// letters onto characters this then strips, so the same name would normalize
// differently depending on where the sample runs.
function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function destinationKeys(destination: GalleryDestination): readonly string[] {
  return [destination.title, ...(destination.aliases ?? [])].map(normalize);
}

export interface GalleryDestinationMatch {
  destination: GalleryDestination | null;
  suggestions: readonly string[];
}

export function findGalleryDestination(query: string): GalleryDestinationMatch {
  const normalizedQuery = normalize(query);
  if (normalizedQuery.length === 0) {
    return { destination: null, suggestions: [] };
  }

  const exact = GALLERY_DESTINATIONS.find(destination =>
    destinationKeys(destination).includes(normalizedQuery));
  if (exact != null) {
    return { destination: exact, suggestions: [] };
  }

  const suggestions = GALLERY_DESTINATIONS
    .filter(destination => destinationKeys(destination).some(key =>
      key.includes(normalizedQuery) || normalizedQuery.includes(key)))
    .slice(0, 3)
    .map(destination => destination.title);
  return { destination: null, suggestions };
}
