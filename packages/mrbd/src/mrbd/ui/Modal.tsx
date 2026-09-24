/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Modal component for Meta Ray-Ban Display
 *
 * A Panel-based surface for displaying information to the user,
 * typically used for NUXs or informational content.
 *
 * Features:
 * - Extends Panel (non-focusable, non-clickable container)
 * - Title with optional subtitle
 * - Content modes: STANDARD (full) and TITLE_ONLY (minimal)
 * - Mutually exclusive leading area: icon, banner, logo, or avatar
 * - Banner with configurable aspect ratio (STANDARD / TALLER)
 * - Banner tag overlay (e.g., BETA)
 * - List items section (icon + description rows)
 * - Buttons section at bottom
 * - Accessibility: combined label from title/subtitle
 *
 * No touch on Meta Ray-Ban Display — all interaction via d-pad/trackpad.
 */

import {
  forwardRef,
  memo,
  useCallback,
  useMemo,
  useState,
  type CSSProperties,
} from 'react';
import { PanelInternal } from '@wearables-ui-toolkit/foundation/internal';
import {
  getModalBannerTagText,
  getModalContentDescription,
  getModalLeadingVisibility,
  hasModalListItems,
  shouldModalBeClickableForReadMore,
  shouldModalBeFocusable,
  shouldModalShowReadMore,
  shouldShowModalBannerTag,
  shouldShowModalSubtitle,
  shouldShowModalTitle,
} from './private/ModalLayout';
import {
  createModalBannerMaterial,
  createModalMaterial,
} from './private/ModalMaterials';
import {
  CornerRadius,
  RoundedRectangleShapeProvider,
} from '@wearables-ui-toolkit/foundation/material/ShapeProvider';
import {
  ModalBannerSize,
  ModalBannerTag,
  ModalContentMode,
} from './Modal.types';
import type { ModalProps } from './Modal.types';
import { useModalSubtitleOverflow } from './private/useModalSubtitleOverflow';
import { ModalLeadingArea } from './private/ModalLeadingArea';
import { ModalBodyContent } from './private/ModalBodyContent';
import { ModalReadMoreDialog } from './private/ModalReadMoreDialog';
import styles from './Modal.module.css';

const DEFAULT_MODAL_SHAPE_PROVIDER =
  new RoundedRectangleShapeProvider(CornerRadius.MEDIUM);

export { ModalBannerSize, ModalBannerTag, ModalContentMode } from './Modal.types';
export type { ModalListItem, ModalProps } from './Modal.types';

const DEFAULT_STYLE: CSSProperties = {};

// ============================================================================
// Component
// ============================================================================

/**
 * Modal component
 * Panel-based informational surface.
 *
 * Usage:
 * ```tsx
 * <Modal
 *   title="Welcome"
 *   subtitle="This is a new feature"
 *   icon="/info.svg"
 *   buttons={
 *     <ButtonGroup>
 *       <Button title="Got it" />
 *     </ButtonGroup>
 *   }
 * />
 *
 * // Banner variant
 * <Modal
 *   title="New Update"
 *   subtitle="Check out what's new"
 *   bannerSrc="/banner.jpg"
 *   bannerSize={ModalBannerSize.TALLER}
 *   bannerTag={ModalBannerTag.BETA}
 * />
 *
 * // Title-only mode
 * <Modal
 *   title="Quick tip"
 *   contentMode={ModalContentMode.TITLE_ONLY}
 * />
 * ```
 */
export const Modal = memo(forwardRef<HTMLDivElement, ModalProps>(
  function Modal(
    {
      title,
      subtitle,
      contentMode = ModalContentMode.STANDARD,
      icon,
      bannerSrc,
      bannerAlt = 'Banner image',
      bannerSize = ModalBannerSize.STANDARD,
      bannerTag = ModalBannerTag.NONE,
      logoSrc,
      logoAlt = 'Logo',
      avatarSrc,
      avatarPrimaryContent,
      avatarAlt = 'Avatar',
      avatarSecondarySrc,
      avatarSecondaryContent,
      avatarBadgeSrc,
      avatarBadgeContent,
      statusIndicator,
      statusIndicatorIcon,
      primaryImageShape,
      placeholderStyle,
      listItems,
      buttons,
      isCarouselItem = false,
      className = '',
      style = DEFAULT_STYLE,
      shapeProvider = DEFAULT_MODAL_SHAPE_PROVIDER,
      'aria-label': ariaLabel,
      ...panelProps
    },
    ref
  ) {
    const [readMoreDialogText, setReadMoreDialogText] = useState<string | null>(null);
    const modalMaterial = useMemo(() => createModalMaterial(), []);
    const modalBannerMaterial = useMemo(() => createModalBannerMaterial(), []);
    const handleReadMoreDismiss = useCallback(() => {
      setReadMoreDialogText(null);
    }, []);

    // ---- Content mode visibility rules ----
    const {
      hasBanner,
      hasLogo,
      hasAvatar,
      hasIcon,
    } = useMemo(
      () => getModalLeadingVisibility({
        contentMode,
        icon: icon,
        bannerSrc,
        logoSrc,
        avatarSrc,
        avatarPrimaryContent,
      }),
      [avatarPrimaryContent, avatarSrc, bannerSrc, contentMode, icon, logoSrc],
    );
    const hasListItems = useMemo(
      () => hasModalListItems(listItems, contentMode),
      [contentMode, listItems],
    );
    const showSubtitle = useMemo(
      () => shouldShowModalSubtitle({
        subtitle,
        contentMode,
        hasListItems,
      }),
      [contentMode, hasListItems, subtitle],
    );
    const { subtitleRef, isSubtitleOverflowing } = useModalSubtitleOverflow(
      showSubtitle,
      subtitle,
    );
    const showTitle = useMemo(
      () => shouldShowModalTitle(title),
      [title],
    );
    const showBannerTag = useMemo(
      () => shouldShowModalBannerTag({
        bannerTag,
        hasBanner,
      }),
      [bannerTag, hasBanner],
    );
    const bannerTagText = useMemo(
      () => getModalBannerTagText(bannerTag),
      [bannerTag],
    );
    const contentDescription = useMemo(
      () => getModalContentDescription({
        showTitle,
        title,
        showSubtitle,
        subtitle,
        showBannerTag,
        bannerTagText,
      }),
      [
        bannerTagText,
        showBannerTag,
        showSubtitle,
        showTitle,
        subtitle,
        title,
      ],
    );

    const shouldFocusModal = useMemo(
      () => shouldModalBeFocusable({
        isCarouselItem,
        isSubtitleOverflowing,
      }),
      [isCarouselItem, isSubtitleOverflowing],
    );
    const showReadMore = useMemo(
      () => shouldModalShowReadMore({
        showSubtitle,
        isSubtitleOverflowing,
      }),
      [isSubtitleOverflowing, showSubtitle],
    );
    const shouldClickModal = useMemo(
      () => shouldModalBeClickableForReadMore({
        isSubtitleOverflowing,
      }),
      [isSubtitleOverflowing],
    );
    const handleClick = useCallback(
      () => {
        if (isSubtitleOverflowing && subtitle != null) {
          setReadMoreDialogText(subtitle);
        }
      },
      [isSubtitleOverflowing, subtitle],
    );
    const modalClassName = useMemo(
      () => `${styles.modal} ${className}`,
      [className],
    );

    return (
      <PanelInternal
        ref={ref}
        className={modalClassName}
        style={style}
        material={modalMaterial}
        shapeProvider={shapeProvider}
        clipContent={false}
        {...panelProps}
        focusable={shouldFocusModal}
        clickable={shouldClickModal}
        pressable={false}
        onClick={handleClick}
        aria-label={ariaLabel ?? contentDescription}
      >
        <ModalLeadingArea
          hasIcon={hasIcon}
          icon={icon}
          hasBanner={hasBanner}
          bannerSrc={bannerSrc}
          bannerAlt={bannerAlt}
          bannerSize={bannerSize}
          bannerMaterial={modalBannerMaterial}
          showBannerTag={showBannerTag}
          bannerTagText={bannerTagText}
          hasLogo={hasLogo}
          logoSrc={logoSrc}
          logoAlt={logoAlt}
          hasAvatar={hasAvatar}
          avatarSrc={avatarSrc}
          avatarPrimaryContent={avatarPrimaryContent}
          avatarAlt={avatarAlt}
          avatarSecondarySrc={avatarSecondarySrc}
          avatarSecondaryContent={avatarSecondaryContent}
          avatarBadgeSrc={avatarBadgeSrc}
          avatarBadgeContent={avatarBadgeContent}
          statusIndicator={statusIndicator}
          statusIndicatorIcon={statusIndicatorIcon}
          primaryImageShape={primaryImageShape}
          placeholderStyle={placeholderStyle}
        />

        <ModalBodyContent
          showTitle={showTitle}
          title={title}
          contentMode={contentMode}
          showSubtitle={showSubtitle}
          subtitle={subtitle}
          subtitleRef={subtitleRef}
          showReadMore={showReadMore}
          hasListItems={hasListItems}
          listItems={listItems}
          buttons={buttons}
        />
        {readMoreDialogText != null && (
          <ModalReadMoreDialog
            text={readMoreDialogText}
            onDismiss={handleReadMoreDismiss}
          />
        )}
      </PanelInternal>
    );
  }
));
