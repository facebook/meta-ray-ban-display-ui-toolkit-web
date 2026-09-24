/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Button, ButtonDivider, ButtonRail } from '@wearables-ui-toolkit/mrbd';
import arrowBigShareFilled from '@wearables-ui-toolkit/icons/svg/arrowbigshare__filled.svg';
import bellFilled from '@wearables-ui-toolkit/icons/svg/bell__filled.svg';
import bookmarkFilled from '@wearables-ui-toolkit/icons/svg/bookmark__filled.svg';
import cameraFilled from '@wearables-ui-toolkit/icons/svg/camera__filled.svg';
import clockFilled from '@wearables-ui-toolkit/icons/svg/clock__filled.svg';
import copyFilled from '@wearables-ui-toolkit/icons/svg/copy__filled.svg';
import imageFilled from '@wearables-ui-toolkit/icons/svg/image__filled.svg';
import microphoneFilled from '@wearables-ui-toolkit/icons/svg/microphone__filled.svg';
import trashFilled from '@wearables-ui-toolkit/icons/svg/trash__filled.svg';
import { DemoSection } from '../../components/DemoSection';
import { GalleryPage } from '../../components/GalleryPage';
import { GuidancePanel } from '../../components/GuidancePanel';

export function ButtonRailPage() {
  return (
    <GalleryPage title="ButtonRail">
      <DemoSection
        title="Overflow and sections"
        description="Use a rail when the full action set extends beyond the screen. Focus movement reveals offscreen buttons, while the divider marks the boundary between capture tools and follow-up actions."
        fullBleedStage
      >
        <ButtonRail>
          <Button title="Camera" icon={cameraFilled} onClick={() => {}} />
          <Button title="Record" icon={microphoneFilled} onClick={() => {}} />
          <Button title="Photos" icon={imageFilled} onClick={() => {}} />
          <ButtonDivider />
          <Button title="Save" icon={bookmarkFilled} onClick={() => {}} />
          <Button title="Share" icon={arrowBigShareFilled} onClick={() => {}} />
          <Button title="Delete" icon={trashFilled} onClick={() => {}} />
        </ButtonRail>
      </DemoSection>
      <DemoSection
        title="Centered compact content"
        description="By default, a short rail is centered when all of its buttons fit within the available width."
        fullBleedStage
      >
        <ButtonRail>
          <Button title="Notifications" icon={bellFilled} onClick={() => {}} />
          <Button title="Save" icon={bookmarkFilled} onClick={() => {}} />
        </ButtonRail>
      </DemoSection>
      <DemoSection
        title="Start-aligned compact content"
        description="Disable compact-content centering when a short rail should remain aligned to the start edge."
        fullBleedStage
      >
        <ButtonRail centerContentWhenSmallerThanWidth={false}>
          <Button title="Camera" icon={cameraFilled} onClick={() => {}} />
          <Button title="Photos" icon={imageFilled} onClick={() => {}} />
        </ButtonRail>
      </DemoSection>
      <DemoSection
        title="Anchored reference"
        description="anchorIndex designates the button the rail tries to center when it is focused. ButtonDividers can bracket that anchor without entering the focus order. Labels still expand normally; provide enough content on both sides to allow centered positioning."
        fullBleedStage
      >
        <ButtonRail anchorIndex={4}>
          <Button title="History" icon={clockFilled} onClick={() => {}} />
          <Button title="Alerts" icon={bellFilled} onClick={() => {}} />
          <Button title="Camera" icon={cameraFilled} onClick={() => {}} />
          <Button title="Record" icon={microphoneFilled} onClick={() => {}} />
          <ButtonDivider />
          <Button title="Save" icon={bookmarkFilled} onClick={() => {}} />
          <ButtonDivider />
          <Button title="Copy" icon={copyFilled} onClick={() => {}} />
          <Button title="Photos" icon={imageFilled} onClick={() => {}} />
          <Button title="Share" icon={arrowBigShareFilled} onClick={() => {}} />
          <Button title="Delete" icon={trashFilled} onClick={() => {}} />
        </ButtonRail>
      </DemoSection>
      <DemoSection
        title="Centered focus cursor"
        description="centerFocusedView moves every focused button to the center, including the first and last buttons. The rail can extend beyond either edge to preserve that stable focus position."
        fullBleedStage
      >
        <ButtonRail centerFocusedView>
          <Button title="History" icon={clockFilled} onClick={() => {}} />
          <Button title="Alerts" icon={bellFilled} onClick={() => {}} />
          <Button title="Camera" icon={cameraFilled} onClick={() => {}} />
          <Button title="Record" icon={microphoneFilled} onClick={() => {}} />
          <Button title="Save" icon={bookmarkFilled} onClick={() => {}} />
          <Button title="Copy" icon={copyFilled} onClick={() => {}} />
          <Button title="Photos" icon={imageFilled} onClick={() => {}} />
          <Button title="Share" icon={arrowBigShareFilled} onClick={() => {}} />
          <Button title="Delete" icon={trashFilled} onClick={() => {}} />
        </ButtonRail>
      </DemoSection>
      <GuidancePanel
        summary="ButtonRail owns a horizontal focus lane for button sets that may extend beyond the available screen width. It moves content as focus changes and uses fading edges to indicate offscreen actions."
        useWhen={<ul><li>Many buttons cannot fit within the available width.</li><li>A compact horizontal set needs automatic centering or start alignment.</li><li>Logical sections belong in one rail and need a clear divider boundary.</li></ul>}
        capabilities={<ul><li>A full-width viewport that reaches both screen edges.</li><li>Focus-following overflow movement and fading edges.</li><li>Centered compact content by default, or start alignment with centerContentWhenSmallerThanWidth disabled.</li><li>A stable positioning reference with anchorIndex.</li><li>A centered focus cursor, including edge actions, with centerFocusedView.</li><li>Section separation with ButtonDivider.</li><li>Focus and scroll callbacks, plus imperative controls for skipping, resetting, or recomputing movement.</li></ul>}
        avoid={<ul><li>Using a rail for sequential steps or unrelated controls.</li><li>Insetting the rail viewport from the left or right screen edge.</li><li>Placing dividers between every peer action or using them as decoration.</li><li>Using centerFocusedView unless a fixed central focus position is essential; ordinary overflow behavior is preferred.</li><li>Combining anchorIndex with centerFocusedView; focused-item centering takes precedence.</li><li>Implementing a second horizontal scroller around the rail.</li></ul>}
      />
    </GalleryPage>
  );
}
