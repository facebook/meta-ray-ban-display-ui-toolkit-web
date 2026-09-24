/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */


import { ListItem } from '@wearables-ui-toolkit/mrbd';
import articleFilled from '@wearables-ui-toolkit/icons/svg/article__filled.svg';
import bellNotificationFilled from '@wearables-ui-toolkit/icons/svg/bellnotification__filled.svg';
import circleUserFilled from '@wearables-ui-toolkit/icons/svg/circleuser__filled.svg';
import grid4ShapesFilled from '@wearables-ui-toolkit/icons/svg/grid4shapes__filled.svg';
import imageFilled from '@wearables-ui-toolkit/icons/svg/image__filled.svg';
import linkOutline from '@wearables-ui-toolkit/icons/svg/link__outline.svg';
import rectangleTwoLinesFilled from '@wearables-ui-toolkit/icons/svg/rectangletwolines__filled.svg';
import rotateClockwiseFilled from '@wearables-ui-toolkit/icons/svg/rotateclockwise__filled.svg';
import tagFilled from '@wearables-ui-toolkit/icons/svg/tag__filled.svg';
import { useNavigate } from 'react-router-dom';
import { GalleryPage } from '../components/GalleryPage';

export function ContentPage() {
  const navigate = useNavigate();

  return (
    <GalleryPage title="Content">
      <div className="gallery-home-list" aria-label="Content components">
        <ListItem title="TextView" subtitle="Semantic typography and color" icon={articleFilled} onClick={() => navigate('/content/text-view')} />
        <ListItem title="Avatar" subtitle="People, entities, and status" icon={circleUserFilled} onClick={() => navigate('/content/avatar')} />
        <ListItem title="AppBadge" subtitle="Compact app identity" icon={grid4ShapesFilled} onClick={() => navigate('/content/app-badge')} />
        <ListItem title="NotificationBadge" subtitle="A short count or unread marker" icon={bellNotificationFilled} onClick={() => navigate('/content/notification-badge')} />
        <ListItem title="Tag" subtitle="Static category metadata" icon={tagFilled} onClick={() => navigate('/content/tag')} />
        <ListItem title="ContainerHeader" subtitle="Identity and title inside a surface" icon={rectangleTwoLinesFilled} onClick={() => navigate('/content/container-header')} />
        <ListItem title="ReadMoreTextView" subtitle="Clamped supporting copy" icon={articleFilled} onClick={() => navigate('/content/read-more-text-view')} />
        <ListItem title="TextSwitcher" subtitle="Animated in-place text changes" icon={rotateClockwiseFilled} onClick={() => navigate('/content/text-switcher')} />
        <ListItem title="IconImage" subtitle="Public vector and URI icon sources" icon={imageFilled} onClick={() => navigate('/content/icon-image')} />
        <ListItem title="WebAppIcon" subtitle="Manifest-themed web-app artwork" icon={linkOutline} onClick={() => navigate('/content/web-app-icon')} />
      </div>
    </GalleryPage>
  );
}
