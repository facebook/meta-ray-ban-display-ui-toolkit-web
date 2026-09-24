/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { ListItem } from '@wearables-ui-toolkit/mrbd';
import articleFilled from '@wearables-ui-toolkit/icons/svg/article__filled.svg';
import boltFilled from '@wearables-ui-toolkit/icons/svg/bolt__filled.svg';
import bookOpenFilled from '@wearables-ui-toolkit/icons/svg/bookopen__filled.svg';
import compassFilled from '@wearables-ui-toolkit/icons/svg/compass__filled.svg';
import hourglassHalfFilled from '@wearables-ui-toolkit/icons/svg/hourglasshalf__filled.svg';
import rectangleStackFilled from '@wearables-ui-toolkit/icons/svg/rectanglestack__filled.svg';
import slidersHorizontalFilled from '@wearables-ui-toolkit/icons/svg/sliders2horizontal__filled.svg';
import speechBubbleAlertFilled from '@wearables-ui-toolkit/icons/svg/speechbubblealert__filled.svg';
import { useNavigate } from 'react-router-dom';
import { GalleryPage } from '../components/GalleryPage';

export function HomePage() {
  const navigate = useNavigate();

  return (
    <GalleryPage title="Component gallery">
      <div className="gallery-home-list" aria-label="Example categories">
        <ListItem
          title="Actions"
          subtitle="Buttons, quick replies, groups, rails, chips, and action hints"
          icon={boltFilled}
          onClick={() => navigate('/actions')}
        />
        <ListItem
          title="Lists and menus"
          subtitle="Rows, vertical collections, dividers, reveal actions, and menus"
          icon={bookOpenFilled}
          onClick={() => navigate('/lists')}
        />
        <ListItem
          title="Controls"
          subtitle="Switches, radio choices, sliders, scrubbers, and control tiles"
          icon={slidersHorizontalFilled}
          onClick={() => navigate('/controls')}
        />
        <ListItem
          title="Navigation"
          subtitle="Pages, headers, tabs, paging, and position indicators"
          icon={compassFilled}
          onClick={() => navigate('/navigation')}
        />
        <ListItem
          title="Content"
          subtitle="Text, avatars, badges, icons, headers, and readable content"
          icon={articleFilled}
          onClick={() => navigate('/content')}
        />
        <ListItem
          title="Surfaces"
          subtitle="Containers, panels, cards, carousels, media, and vignettes"
          icon={rectangleStackFilled}
          onClick={() => navigate('/surfaces')}
        />
        <ListItem
          title="Feedback and overlays"
          subtitle="Modals, toasts, tooltips, context menus, and scrims"
          icon={speechBubbleAlertFilled}
          onClick={() => navigate('/feedback')}
        />
        <ListItem
          title="Status and loading"
          subtitle="Progress, loading, shimmer, volume, and zoom indicators"
          icon={hourglassHalfFilled}
          onClick={() => navigate('/status')}
        />
      </div>
    </GalleryPage>
  );
}
