/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useState } from 'react';
import { Button, TooltipMode, VerticalMenu, VerticalMenuButton, VerticalMenuCorner, getVerticalMenuAnchorProps } from '@wearables-ui-toolkit/mrbd';
import archiveFilled from '@wearables-ui-toolkit/icons/svg/archive__filled.svg';
import bellFilled from '@wearables-ui-toolkit/icons/svg/bell__filled.svg';
import bookmarkFilled from '@wearables-ui-toolkit/icons/svg/bookmark__filled.svg';
import { DemoSection } from '../../components/DemoSection';
import { GalleryPage } from '../../components/GalleryPage';
import { GuidancePanel } from '../../components/GuidancePanel';

export function VerticalMenuPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <GalleryPage title="VerticalMenu">
      <DemoSection
        title="Menu opened from a button"
        description="Activate the button to present a focusable menu anchored below it."
      >
        <Button
          title="Place actions"
          icon={bookmarkFilled}
          alwaysShowText
          onClick={() => setIsMenuOpen(true)}
          tooltipMode={isMenuOpen ? TooltipMode.ALWAYS : TooltipMode.NONE}
          tooltipContent={
            <VerticalMenu
              aria-label="Place actions"
              onDismissRequest={closeMenu}
            >
              <VerticalMenuButton
                text="Save place"
                icon={bookmarkFilled}
                onClick={closeMenu}
              />
              <VerticalMenuButton
                text="Mute alerts"
                icon={bellFilled}
                onClick={closeMenu}
              />
              <VerticalMenuButton
                text="Archive"
                icon={archiveFilled}
                onClick={closeMenu}
              />
            </VerticalMenu>
          }
          {...getVerticalMenuAnchorProps(VerticalMenuCorner.BELOW_LEFT)}
        />
      </DemoSection>
      <GuidancePanel
        summary="VerticalMenu is a temporary overlay anchored to an interactive button or container. It is presented through the anchor's tooltip infrastructure rather than placed inline as persistent page content."
        useWhen={<ul><li>An interactive control needs a compact set of secondary commands.</li></ul>}
        capabilities={<ul><li>Optional leading icons and short text labels.</li><li>Above or below placement aligned to the anchor's left or right edge.</li><li>Automatic initial item focus and dismissal through Back or focus navigation beyond the menu.</li></ul>}
        avoid={<ul><li>Rendering the menu inline or leaving it permanently visible.</li><li>Using a menu as permanent page navigation.</li><li>Wrapping it in another rounded surface.</li></ul>}
      />
    </GalleryPage>
  );
}
