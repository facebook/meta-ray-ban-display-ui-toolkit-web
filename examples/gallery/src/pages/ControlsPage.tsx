/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */


import { ListItem } from '@wearables-ui-toolkit/mrbd';
import articleFilled from '@wearables-ui-toolkit/icons/svg/article__filled.svg';
import circleCheckFilled from '@wearables-ui-toolkit/icons/svg/circlecheck__filled.svg';
import grid4PanelsFilled from '@wearables-ui-toolkit/icons/svg/grid4panels__filled.svg';
import grid4ShapesFilled from '@wearables-ui-toolkit/icons/svg/grid4shapes__filled.svg';
import mediaPlayFilled from '@wearables-ui-toolkit/icons/svg/mediaplay__filled.svg';
import slidersHorizontalFilled from '@wearables-ui-toolkit/icons/svg/sliders2horizontal__filled.svg';
import speakerSliderFilled from '@wearables-ui-toolkit/icons/svg/speakerslider__filled.svg';
import switchRightFilled from '@wearables-ui-toolkit/icons/svg/switchright__filled.svg';
import { useNavigate } from 'react-router-dom';
import { GalleryPage } from '../components/GalleryPage';

export function ControlsPage() {
  const navigate = useNavigate();

  return (
    <GalleryPage title="Controls">
      <div className="gallery-home-list" aria-label="Control components">
        <ListItem title="Switch" subtitle="Binary setting state" icon={switchRightFilled} onClick={() => navigate('/controls/switch')} />
        <ListItem title="RadioButton" subtitle="One choice in a set" icon={circleCheckFilled} onClick={() => navigate('/controls/radio-button')} />
        <ListItem title="SliderBar" subtitle="Interactive value or determinate progress" icon={slidersHorizontalFilled} onClick={() => navigate('/controls/slider-bar')} />
        <ListItem title="Scrubber" subtitle="Media position and seeking" icon={mediaPlayFilled} onClick={() => navigate('/controls/scrubber')} />
        <ListItem title="InputTextView" subtitle="Free-form text entry" icon={articleFilled} onClick={() => navigate('/controls/input-text-view')} />
        <ListItem title="IsolatedControl" subtitle="Focused directional adjustment" icon={speakerSliderFilled} onClick={() => navigate('/controls/isolated-control')} />
        <ListItem title="ControlTile" subtitle="Compact setting or progress control" icon={grid4PanelsFilled} onClick={() => navigate('/controls/control-tile')} />
        <ListItem title="AppControlTile" subtitle="App or destination control" icon={grid4ShapesFilled} onClick={() => navigate('/controls/app-control-tile')} />
      </div>
    </GalleryPage>
  );
}
