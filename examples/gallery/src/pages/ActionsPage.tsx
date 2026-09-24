/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */


import { ListItem } from '@wearables-ui-toolkit/mrbd';
import circleInfoFilled from '@wearables-ui-toolkit/icons/svg/circleinfo__filled.svg';
import grid4Filled from '@wearables-ui-toolkit/icons/svg/grid4__filled.svg';
import rectanglesLargeSmallFilled from '@wearables-ui-toolkit/icons/svg/rectangleslargesmall__filled.svg';
import squareCheckFilled from '@wearables-ui-toolkit/icons/svg/squarecheck__filled.svg';
import speechBubbleMessageFilled from '@wearables-ui-toolkit/icons/svg/speechbubblemessage__filled.svg';
import tagFilled from '@wearables-ui-toolkit/icons/svg/tag__filled.svg';
import { useNavigate } from 'react-router-dom';
import { GalleryPage } from '../components/GalleryPage';

export function ActionsPage() {
  const navigate = useNavigate();

  return (
    <GalleryPage title="Actions">
      <div className="gallery-home-list" aria-label="Action components">
        <ListItem title="Button" subtitle="Text, icon, disabled, and action-transition states" icon={squareCheckFilled} onClick={() => navigate('/actions/button')} />
        <ListItem title="ButtonGroup and ButtonDivider" subtitle="A small connected action set" icon={grid4Filled} onClick={() => navigate('/actions/button-group')} />
        <ListItem title="ButtonRail" subtitle="Horizontally scrolling actions" icon={rectanglesLargeSmallFilled} onClick={() => navigate('/actions/button-rail')} />
        <ListItem title="QuickReplyButton" subtitle="Compact reply actions" icon={speechBubbleMessageFilled} onClick={() => navigate('/actions/quick-reply-button')} />
        <ListItem title="Chip" subtitle="Static labels and status" icon={tagFilled} onClick={() => navigate('/actions/chip')} />
        <ListItem title="ActionHint" subtitle="A non-interactive action cue" icon={circleInfoFilled} onClick={() => navigate('/actions/action-hint')} />
      </div>
    </GalleryPage>
  );
}
