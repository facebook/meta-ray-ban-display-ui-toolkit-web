/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { SubNavigationPager } from '@wearables-ui-toolkit/mrbd';
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

export function SubNavigationPagerPage() {
  return (
    <GalleryPage title="SubNavigationPager">
      <DemoSection
        title="Top-level tabbed screen"
        description="This embedded preview demonstrates the composite. In an application route, SubNavigationPager replaces Page as the top-level surface."
      >
        <SubNavigationPager
          className="gallery-embedded-pager"
          items={navigationItems}
          useBackButtonForHome={false}
          ariaLabel="Activity pages"
        >
          <div className="gallery-pager-page"><span className="uit-text-heading2">Recent activity</span></div>
          <div className="gallery-pager-page"><span className="uit-text-heading2">Saved places</span></div>
          <div className="gallery-pager-page"><span className="uit-text-heading2">Alerts</span></div>
        </SubNavigationPager>
      </DemoSection>
      <GuidancePanel
        summary="SubNavigationPager is an alternative top-level screen surface to Page. It composes SubNavigation, Pager, focus handoff, and the navigation scrim, so use it in place of Page for a route with peer tabbed pages."
        useWhen={<ul><li>Each peer navigation item maps directly to one page and the route needs tab-based navigation instead of a Page header.</li></ul>}
        capabilities={<ul><li>Controlled or uncontrolled page index, synchronized tab and page state, focus handoff, auto-hide, navigation scrim, and navigation locking.</li></ul>}
        avoid={<ul><li>Using Page and SubNavigationPager together for the same route.</li><li>Wrapping SubNavigationPager or its individual child pages in Page.</li><li>Manually synchronizing separate SubNavigation and Pager components.</li></ul>}
      />
    </GalleryPage>
  );
}
