/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */


import { ListItem } from '@wearables-ui-toolkit/mrbd';
import circleContrastFilled from '@wearables-ui-toolkit/icons/svg/circlecontrast__filled.svg';
import desktopWindowFilled from '@wearables-ui-toolkit/icons/svg/desktopwindow__filled.svg';
import speechBubbleCheckFilled from '@wearables-ui-toolkit/icons/svg/speechbubblecheck__filled.svg';
import speechBubbleEllipsisFilled from '@wearables-ui-toolkit/icons/svg/speechbubbleellipsis__filled.svg';
import speechBubbleQuestionFilled from '@wearables-ui-toolkit/icons/svg/speechbubblequestion__filled.svg';
import { useNavigate } from 'react-router-dom';
import { GalleryPage } from '../components/GalleryPage';

export function FeedbackPage() {
  const navigate = useNavigate();

  return (
    <GalleryPage title="Feedback and overlays">
      <div className="gallery-home-list" aria-label="Feedback components">
        <ListItem title="Toast" subtitle="Brief non-actionable confirmation" icon={speechBubbleCheckFilled} onClick={() => navigate('/feedback/toast')} />
        <ListItem title="Tooltip" subtitle="Context for a focused control" icon={speechBubbleQuestionFilled} onClick={() => navigate('/feedback/tooltip')} />
        <ListItem title="Modal" subtitle="Focused information or a decision" icon={desktopWindowFilled} onClick={() => navigate('/feedback/modal')} />
        <ListItem title="ContextMenu" subtitle="Anchored secondary commands" icon={speechBubbleEllipsisFilled} onClick={() => navigate('/feedback/context-menu')} />
        <ListItem title="Scrim" subtitle="Legibility and edge protection" icon={circleContrastFilled} onClick={() => navigate('/feedback/scrim')} />
      </div>
    </GalleryPage>
  );
}
