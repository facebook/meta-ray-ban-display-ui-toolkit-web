/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */


import { ListItem } from '@wearables-ui-toolkit/mrbd';
import grid4PanelsFilled from '@wearables-ui-toolkit/icons/svg/grid4panels__filled.svg';
import rectangleLayoutRightFilled from '@wearables-ui-toolkit/icons/svg/rectanglelayoutright__filled.svg';
import rectangleStackFilled from '@wearables-ui-toolkit/icons/svg/rectanglestack__filled.svg';
import rectangleTwoLinesFilled from '@wearables-ui-toolkit/icons/svg/rectangletwolines__filled.svg';
import { useNavigate } from 'react-router-dom';
import { GalleryPage } from '../components/GalleryPage';

export function ListsPage() {
  const navigate = useNavigate();

  return (
    <GalleryPage title="Lists and menus">
      <div className="gallery-home-list" aria-label="List and menu components">
        <ListItem title="ListItem" subtitle="Rows, settings, and accessory slots" icon={rectangleTwoLinesFilled} onClick={() => navigate('/lists/list-item')} />
        <ListItem title="VerticalList" subtitle="A bounded scrolling collection" icon={rectangleStackFilled} onClick={() => navigate('/lists/vertical-list')} />
        <ListItem title="SwipeToReveal" subtitle="Secondary row actions" icon={rectangleLayoutRightFilled} onClick={() => navigate('/lists/swipe-to-reveal')} />
        <ListItem title="VerticalMenu" subtitle="A compact command menu" icon={grid4PanelsFilled} onClick={() => navigate('/lists/vertical-menu')} />
      </div>
    </GalleryPage>
  );
}
