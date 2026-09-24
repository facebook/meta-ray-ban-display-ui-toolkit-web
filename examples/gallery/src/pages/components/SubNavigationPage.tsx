/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useState } from 'react';
import { SubNavigation } from '@wearables-ui-toolkit/mrbd';
import heartActivityFilled from '@wearables-ui-toolkit/icons/svg/heartactivity__filled.svg';
import bellFilled from '@wearables-ui-toolkit/icons/svg/bell__filled.svg';
import bookmarkFilled from '@wearables-ui-toolkit/icons/svg/bookmark__filled.svg';
import { DemoSection } from '../../components/DemoSection';
import { GalleryPage } from '../../components/GalleryPage';
import { GuidancePanel } from '../../components/GuidancePanel';

const navigationItems = [
  { label: 'Activity', icon: heartActivityFilled },
  { label: 'Saved', icon: bookmarkFilled },
  { label: 'Alerts', icon: bellFilled },
];

export function SubNavigationPage() {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <GalleryPage title="SubNavigation">
      <DemoSection
        title="Visual anatomy"
        description="This isolated rendering demonstrates item focus and selection. Application pages should use SubNavigation only through SubNavigationPager."
      >
        <SubNavigation
          items={navigationItems}
          active={activeIndex}
          onActiveChange={setActiveIndex}
          aria-label="Gallery sections"
        />
      </DemoSection>
      <GuidancePanel
        summary="SubNavigation is the tab header managed by SubNavigationPager. It communicates the active peer page, but is not intended to be composed or synchronized as a standalone navigation control."
        useWhen={<ul><li>Related peer pages need tab-based navigation; configure the items and content through SubNavigationPager.</li></ul>}
        capabilities={<ul><li>Icon and label items, active state, loading state, and optional auto-hide.</li></ul>}
        avoid={<ul><li>Rendering or managing SubNavigation directly in an application page.</li><li>Manually synchronizing it with a separate Pager.</li><li>Combining it with a competing navigation model.</li><li>Using it for one-time actions.</li></ul>}
      />
    </GalleryPage>
  );
}
