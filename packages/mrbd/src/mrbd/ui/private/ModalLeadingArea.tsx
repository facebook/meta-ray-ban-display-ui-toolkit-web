/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  memo,
  useMemo,
  type ReactNode,
} from 'react';
import { StaticContainer } from '@wearables-ui-toolkit/foundation';
import {
  CornerRadius,
  RoundedRectangleShapeProvider,
} from '@wearables-ui-toolkit/foundation/material/ShapeProvider';
import { IconImage } from '@wearables-ui-toolkit/foundation/components/IconImage';
import type { IconSource } from '@wearables-ui-toolkit/foundation/components/IconImage';
import type { ContainerMaterial } from '@wearables-ui-toolkit/foundation';
import { Avatar, AvatarSize } from '../Avatar';
import type {
  AvatarShape,
  PlaceholderStyle,
  StatusIndicatorType,
} from '../Avatar.types';
import { Tag } from '../Tag';
import { ModalBannerImage } from './ModalBannerImage';
import {
  MODAL_BANNER_BACKGROUND_STYLE,
} from './ModalMaterials';
import { ModalBannerSize } from '../Modal.types';
import styles from '../Modal.module.css';

const MODAL_BANNER_SHAPE_PROVIDER =
  new RoundedRectangleShapeProvider(CornerRadius.XXSMALL);

export interface ModalLeadingAreaProps {
  hasIcon: boolean;
  icon?: IconSource;
  hasBanner: boolean;
  bannerSrc?: string;
  bannerAlt: string;
  bannerSize: ModalBannerSize;
  bannerMaterial: ContainerMaterial;
  showBannerTag: boolean;
  bannerTagText: string | null;
  hasLogo: boolean;
  logoSrc?: string;
  logoAlt: string;
  hasAvatar: boolean;
  avatarSrc?: string;
  avatarPrimaryContent?: ReactNode;
  avatarAlt: string;
  avatarSecondarySrc?: string;
  avatarSecondaryContent?: ReactNode;
  avatarBadgeSrc?: string;
  avatarBadgeContent?: ReactNode;
  statusIndicator?: StatusIndicatorType;
  statusIndicatorIcon?: IconSource;
  primaryImageShape?: AvatarShape;
  placeholderStyle?: PlaceholderStyle;
}

export const ModalLeadingArea = memo(function ModalLeadingArea({
  hasIcon,
  icon,
  hasBanner,
  bannerSrc,
  bannerAlt,
  bannerSize,
  bannerMaterial,
  showBannerTag,
  bannerTagText,
  hasLogo,
  logoSrc,
  logoAlt,
  hasAvatar,
  avatarSrc,
  avatarPrimaryContent,
  avatarAlt,
  avatarSecondarySrc,
  avatarSecondaryContent,
  avatarBadgeSrc,
  avatarBadgeContent,
  statusIndicator,
  statusIndicatorIcon,
  primaryImageShape,
  placeholderStyle,
}: ModalLeadingAreaProps) {
  const bannerClassName = useMemo(
    () => `${styles.bannerContainer} ${
      bannerSize === ModalBannerSize.TALLER
        ? styles.bannerTaller
        : styles.bannerStandard
    }`,
    [bannerSize],
  );

  if (hasIcon) {
    return (
      <div className={styles.iconContainer} aria-hidden="true">
        {icon != null && <IconImage source={icon} />}
      </div>
    );
  }

  if (hasBanner && bannerSrc) {
    return (
      <StaticContainer
        className={bannerClassName}
        material={bannerMaterial}
        shapeProvider={MODAL_BANNER_SHAPE_PROVIDER}
        backgroundStyle={MODAL_BANNER_BACKGROUND_STYLE}
        clipContent={false}
        width="100%"
        aria-hidden="true"
      >
        <ModalBannerImage src={bannerSrc} alt={bannerAlt} />
        {showBannerTag && bannerTagText && (
          <div className={styles.bannerTagScrim}>
            <Tag text={bannerTagText} />
          </div>
        )}
      </StaticContainer>
    );
  }

  if (hasLogo) {
    return (
      <div className={styles.logoContainer} aria-hidden="true">
        <Avatar
          size={AvatarSize.LARGE}
          src={logoSrc}
          alt={logoAlt}
        />
      </div>
    );
  }

  if (hasAvatar) {
    return (
      <div className={styles.avatarContainer} aria-hidden="true">
        <Avatar
          size={AvatarSize.XXLARGE}
          src={avatarSrc}
          primaryContent={avatarPrimaryContent}
          alt={avatarAlt}
          secondarySrc={avatarSecondarySrc}
          secondaryContent={avatarSecondaryContent}
          badgeImageSrc={avatarBadgeSrc}
          badgeContent={avatarBadgeContent}
          statusIndicator={statusIndicator}
          statusIndicatorIcon={statusIndicatorIcon}
          primaryImageShape={primaryImageShape}
          placeholderStyle={placeholderStyle}
        />
      </div>
    );
  }

  return null;
});
