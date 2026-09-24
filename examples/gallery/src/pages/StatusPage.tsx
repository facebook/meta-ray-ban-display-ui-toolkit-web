/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */


import { ListItem } from '@wearables-ui-toolkit/mrbd';
import apertureFilled from '@wearables-ui-toolkit/icons/svg/aperture__filled.svg';
import chartBarFilled from '@wearables-ui-toolkit/icons/svg/chartbar__filled.svg';
import circleContrastFilled from '@wearables-ui-toolkit/icons/svg/circlecontrast__filled.svg';
import circleSearchFilled from '@wearables-ui-toolkit/icons/svg/circlesearch__filled.svg';
import hourglassHalfFilled from '@wearables-ui-toolkit/icons/svg/hourglasshalf__filled.svg';
import rotateClockwiseFilled from '@wearables-ui-toolkit/icons/svg/rotateclockwise__filled.svg';
import speakerHighFilled from '@wearables-ui-toolkit/icons/svg/speakerhi__filled.svg';
import { useNavigate } from 'react-router-dom';
import { GalleryPage } from '../components/GalleryPage';

export function StatusPage() {
  const navigate = useNavigate();

  return (
    <GalleryPage title="Status and loading">
      <div className="gallery-home-list" aria-label="Status components">
        <ListItem title="ProgressIndicator" subtitle="Linear determinate progress" icon={chartBarFilled} onClick={() => navigate('/status/progress-indicator')} />
        <ListItem title="ProgressRing" subtitle="Compact circular progress" icon={circleContrastFilled} onClick={() => navigate('/status/progress-ring')} />
        <ListItem title="CircularProgressBar" subtitle="Partial-arc progress in a square slot" icon={apertureFilled} onClick={() => navigate('/status/circular-progress-bar')} />
        <ListItem title="IndeterminateLoader" subtitle="Loading with unknown completion" icon={rotateClockwiseFilled} onClick={() => navigate('/status/indeterminate-loader')} />
        <ListItem title="Shimmer" subtitle="Skeleton loading placeholders" icon={hourglassHalfFilled} onClick={() => navigate('/status/shimmer')} />
        <ListItem title="VolumeIndicator" subtitle="Temporary volume feedback" icon={speakerHighFilled} onClick={() => navigate('/status/volume-indicator')} />
        <ListItem title="ZoomIndicator" subtitle="Temporary zoom feedback" icon={circleSearchFilled} onClick={() => navigate('/status/zoom-indicator')} />
      </div>
    </GalleryPage>
  );
}
