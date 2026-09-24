/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Page component for Meta Ray-Ban Display
 *
 * Top-level page container that wraps screen content and provides
 * application UI such as a Header. Page ensures the header is always
 * positioned correctly and laid out relative to content.
 *
 * Features:
 * - Header at top, rendered whenever `showHeader` is true (the default),
 *   independent of header content; `showHeader={false}` suppresses it
 * - Header text, metadata, icon (IconSource), and avatar forwarding
 * - showHeader toggle (default: true)
 * - Content area fills remaining space below header
 * - Accessibility: pane title from header text
 *
 * Usage note: Prefer Page over using Header directly.
 * Page handles layout, z-indexing, and header-content relationship.
 */

import {
  forwardRef,
  memo,
  useImperativeHandle,
  useMemo,
  useRef,
  type CSSProperties,
} from 'react';
import { Header, HeaderAvatarSize } from './Header';
import {
  getPagePaneTitle,
  shouldRenderPageHeader,
} from './private/PageLayout';
import {
  PAGE_HEADER_TRANSLATION_Z,
  PAGE_SYSTEM_BAR_INSET_TOP,
} from './private/PageMetrics';
import type { PageHandle, PageProps } from './Page.types';
import styles from './Page.module.css';

export type { PageHandle, PageProps } from './Page.types';

const EMPTY_PAGE_STYLE: CSSProperties = {};
const PAGE_HEADER_WRAPPER_STYLE: CSSProperties = {
  top: PAGE_SYSTEM_BAR_INSET_TOP,
  zIndex: PAGE_HEADER_TRANSLATION_Z,
};
const PAGE_CONTENT_STYLE_WITH_SYSTEM_BAR_INSET = {
  top: PAGE_SYSTEM_BAR_INSET_TOP,
  '--uit-page-content-origin-offset': '0px',
} as CSSProperties;
const PAGE_CONTENT_STYLE_WITHOUT_SYSTEM_BAR_INSET = {
  top: 0,
  '--uit-page-content-origin-offset': `${PAGE_SYSTEM_BAR_INSET_TOP}px`,
} as CSSProperties;

/**
 * Page component
 * Top-level layout wrapper with optional header.
 *
 * Usage:
 * ```tsx
 * <Page headerText="Settings" headerMetadata="3 items">
 *   <SettingsContent />
 * </Page>
 *
 * <Page showHeader={false}>
 *   <FullScreenContent />
 * </Page>
 *
 * <Page enableSystemBarInset={false}>
 *   <ImmersiveContent />
 * </Page>
 *
 * <Page headerText="Profile" headerShowAvatar headerAvatarSrc="/avatar.jpg">
 *   <ProfileContent />
 * </Page>
 * ```
 */
export const Page = memo(forwardRef<PageHandle, PageProps>(
  function Page(
    {
      children,
      showHeader = true,
      enableSystemBarInset = true,
      headerText,
      headerMaxLines,
      headerMetadata,
      headerIcon,
      headerShowAvatar = false,
      headerAvatarSrc,
      headerAvatarPrimaryContent,
      headerAvatarSecondarySrc,
      headerAvatarSecondaryContent,
      headerAvatarBadgeSrc,
      headerAvatarBadgeContent,
      headerAvatarAlt = 'Avatar',
      headerAvatarSize = HeaderAvatarSize.SMALL,
      headerStatusIndicator,
      headerStatusIndicatorIcon,
      headerPrimaryImageShape,
      headerPlaceholderStyle,
      headerIsLoading = false,
      className = '',
      style = EMPTY_PAGE_STYLE,
      role = 'main',
      'aria-label': ariaLabel,
      ...rest
    },
    ref
  ) {
    /**
     * Determine if the header should render.
     *
     * The header is visible whenever `showHeader` is true and hidden otherwise
     * — independent of whether any header content (text, metadata, icon,
     * avatar) is set. `showHeader=false` is the only suppression path.
     */
    const shouldRenderHeader = useMemo(
      () => shouldRenderPageHeader({
        showHeader,
      }),
      [showHeader],
    );

    /**
     * Accessibility pane title is derived from the header text.
     */
    const paneTitle = useMemo(
      () => getPagePaneTitle(shouldRenderHeader, headerText, headerMetadata),
      [headerText, headerMetadata, shouldRenderHeader],
    );
    const pageClassName = useMemo(
      () => `${styles.page} ${className}`,
      [className],
    );

    const rootRef = useRef<HTMLDivElement | null>(null);
    const headerRef = useRef<HTMLDivElement | null>(null);

    useImperativeHandle(
      ref,
      (): PageHandle => ({
        getHeaderHeight(): number {
          if (!shouldRenderHeader) {
            return 0;
          }
          const node = headerRef.current;
          if (node == null) {
            return 0;
          }
          const measured = node.getBoundingClientRect().height;
          return measured > 0 ? measured : node.offsetHeight;
        },
        getElement: () => rootRef.current,
      }),
      [shouldRenderHeader],
    );

    return (
      <div
        {...rest}
        ref={rootRef}
        className={pageClassName}
        style={style}
        role={role}
        aria-label={ariaLabel ?? paneTitle}
      >
        {/* Header — rendered whenever showHeader is true, regardless of content */}
        {shouldRenderHeader && (
          <div
            ref={headerRef}
            className={styles.headerWrapper}
            style={PAGE_HEADER_WRAPPER_STYLE}
          >
            <Header
              text={headerText}
              maxLines={headerMaxLines}
              metadata={headerMetadata}
              icon={headerIcon}
              showAvatar={headerShowAvatar}
              avatarSrc={headerAvatarSrc}
              avatarPrimaryContent={headerAvatarPrimaryContent}
              avatarSecondarySrc={headerAvatarSecondarySrc}
              avatarSecondaryContent={headerAvatarSecondaryContent}
              avatarBadgeSrc={headerAvatarBadgeSrc}
              avatarBadgeContent={headerAvatarBadgeContent}
              avatarAlt={headerAvatarAlt}
              avatarSize={headerAvatarSize}
              statusIndicator={headerStatusIndicator}
              statusIndicatorIcon={headerStatusIndicatorIcon}
              primaryImageShape={headerPrimaryImageShape}
              placeholderStyle={headerPlaceholderStyle}
              isLoading={headerIsLoading}
            />
          </div>
        )}

        {/* Content area */}
        <div
          className={styles.content}
          data-uit-focus-section="true"
          style={
            enableSystemBarInset
              ? PAGE_CONTENT_STYLE_WITH_SYSTEM_BAR_INSET
              : PAGE_CONTENT_STYLE_WITHOUT_SYSTEM_BAR_INSET
          }
        >
          {children}
        </div>
      </div>
    );
  }
));
