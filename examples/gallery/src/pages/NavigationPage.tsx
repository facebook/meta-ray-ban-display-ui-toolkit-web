/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */


import { ListItem } from '@wearables-ui-toolkit/mrbd';
import articleFilled from '@wearables-ui-toolkit/icons/svg/article__filled.svg';
import bookOpenFilled from '@wearables-ui-toolkit/icons/svg/bookopen__filled.svg';
import compassFilled from '@wearables-ui-toolkit/icons/svg/compass__filled.svg';
import dotFilled from '@wearables-ui-toolkit/icons/svg/dot__filled.svg';
import grid4PanelsFilled from '@wearables-ui-toolkit/icons/svg/grid4panels__filled.svg';
import squareArrowsUpDownFilled from '@wearables-ui-toolkit/icons/svg/squarearrowsupdown__filled.svg';
import { useNavigate } from 'react-router-dom';
import { GalleryPage } from '../components/GalleryPage';

export function NavigationPage() {
  const navigate = useNavigate();

  return (
    <GalleryPage title="Navigation">
      <div className="gallery-home-list" aria-label="Navigation components">
        <ListItem title="Header" subtitle="Screen title and metadata" icon={articleFilled} onClick={() => navigate('/navigation/header')} />
        <ListItem title="SubNavigation" subtitle="Peer destinations in one header" icon={compassFilled} onClick={() => navigate('/navigation/sub-navigation')} />
        <ListItem title="SubNavigationPager" subtitle="Coordinated tabs and pages" icon={grid4PanelsFilled} onClick={() => navigate('/navigation/sub-navigation-pager')} />
        <ListItem title="Pager" subtitle="Directional movement between pages" icon={bookOpenFilled} onClick={() => navigate('/navigation/pager')} />
        <ListItem title="PaginationIndicator" subtitle="Current position in a page set" icon={dotFilled} onClick={() => navigate('/navigation/pagination-indicator')} />
        <ListItem title="SwipeIndicator" subtitle="Prompt for offscreen content" icon={squareArrowsUpDownFilled} onClick={() => navigate('/navigation/swipe-indicator')} />
      </div>
    </GalleryPage>
  );
}
