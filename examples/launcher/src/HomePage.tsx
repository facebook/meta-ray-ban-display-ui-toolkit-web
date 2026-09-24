/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { memo, useCallback, useMemo, useRef, type Ref } from 'react';
import {
  Container,
  ContainerMaterial,
  CornerRadius,
  ListItem,
  MaterialLibrary,
  PagerOrientation,
  PagerPage,
  RoundedRectangleShapeProvider,
  Shimmer,
  ShimmerItem,
  ShimmerItemCornerRadius,
  StaticContainer,
  SubtitleTextColor,
  VerticalList,
  usePagerPageLifecycle,
} from '@wearables-ui-toolkit/mrbd';
import type { HomeCard, HomeCardAction } from './launcherCatalog';
import {
  createLauncherWebAppIconMaterial,
} from './appTileMaterials';
import { createLauncherArtworkSource } from './appIcons';
import { LauncherPager } from './LauncherPager';
import { HOME_PANEL_PAGE_INDEX } from './launcherPages';
import { focusLauncherElement } from './launcherUtils';

const WIDGET_PLACEHOLDER_HEIGHT = 'var(--launcher-tile-height)';
const HOME_APP_ICON_SIZE = 64;
const HOME_FEED_CARD_SHAPE_PROVIDER =
  new RoundedRectangleShapeProvider(CornerRadius.MEDIUM);
const HOME_APP_ICON_SHAPE_PROVIDER =
  new RoundedRectangleShapeProvider(CornerRadius.FULL);

function createHomeNotificationMaterial(): ContainerMaterial {
  return new ContainerMaterial({
    layers: [],
  });
}

const HomeAppIcon = memo(function HomeAppIcon({ card }: { card: HomeCard }) {
  const rendering = useMemo(
    () => createLauncherWebAppIconMaterial(
      card.materialTheme,
      createLauncherArtworkSource(card.icon),
    ),
    [card.icon, card.materialTheme],
  );
  return (
    <StaticContainer
      aria-hidden="true"
      className="homeNotificationWebAppIcon"
      clipContent={false}
      height={HOME_APP_ICON_SIZE}
      material={rendering.material}
      shapeProvider={HOME_APP_ICON_SHAPE_PROVIDER}
      useSmoothCorners={false}
      width={HOME_APP_ICON_SIZE}
    />
  );
});

const HomeFeedCard = memo(function HomeFeedCard({
  card,
  onSelect,
}: {
  card: HomeCard;
  onSelect: (action: HomeCardAction) => void;
}) {
  const outerMaterial = useMemo(
    () => MaterialLibrary.notificationCenterItem()
      .withInset(8),
    [],
  );
  // The outer Container owns interaction visuals; ListItem supplies only its
  // standard avatar and text layout inside that surface.
  const listItemMaterial = useMemo(createHomeNotificationMaterial, []);
  return (
    <Container
      className="homeNotificationItem"
      height="var(--launcher-tile-height)"
      material={outerMaterial}
      shapeProvider={HOME_FEED_CARD_SHAPE_PROVIDER}
      onClick={() => onSelect(card.action)}
      role="button"
      width="100%"
      aria-label={card.subtitle == null
        ? card.title
        : `${card.title}. ${card.subtitle}`}
      data-uit-capture-id={`launcher-home-card-${card.id}`}
    >
      <ListItem
        aria-hidden="true"
        avatarAlt=""
        avatarPrimaryContent={<HomeAppIcon card={card} />}
        className="homeNotificationListItem"
        contentClassName="homeNotificationListItemContent"
        clickable={false}
        focusable={false}
        initialFocusEligible={false}
        interactive={false}
        material={listItemMaterial}
        pressable={false}
        subtitle={card.subtitle}
        subtitleTextColor={SubtitleTextColor.SECONDARY}
        tabIndex={-1}
        title={card.title}
      />
    </Container>
  );
});

function HomePanel({
  cards,
  onSelect,
  pageRef,
}: {
  cards: readonly HomeCard[];
  onSelect: (action: HomeCardAction) => void;
  pageRef?: Ref<HTMLElement>;
}) {
  return (
    <section ref={pageRef} className="launcherPage homePage" aria-label="Home">
      <VerticalList
        ariaLabel="Home"
        bottomFadingEdgeLength={64}
        className="homeScrollView"
        height="100%"
        headerHeight={74}
        insetForHeader
        topFadingEdgeLength={64}
        width="100%"
      >
        <div className="homeFeed">
          {cards.map(card => (
            <HomeFeedCard key={card.id} card={card} onSelect={onSelect} />
          ))}
        </div>
      </VerticalList>
    </section>
  );
}

function UpperPanel() {
  return (
    <section className="launcherPage upperPanelPage" aria-label="Widgets">
      <div className="widgetPlaceholder">
        <Shimmer className="widgetPlaceholderShimmer">
          <ShimmerItem
            cornerRadius={ShimmerItemCornerRadius.LARGE}
            height={WIDGET_PLACEHOLDER_HEIGHT}
            width="100%"
          />
        </Shimmer>
      </div>
    </section>
  );
}

export const HomePage = memo(function HomePage({
  cards,
  currentPageIndex,
  onPageChange,
  onSelectCard,
}: {
  cards: readonly HomeCard[];
  currentPageIndex: number;
  onPageChange: (index: number) => void;
  onSelectCard: (action: HomeCardAction) => void;
}) {
  const homePageRef = useRef<HTMLElement>(null);
  const onRequestInitialFocus = useCallback(() => {
    return focusLauncherElement(
      homePageRef.current?.querySelector<HTMLElement>(
        '[data-uit-capture-id^="launcher-home-card-"]',
      ) ?? null,
    );
  }, []);
  usePagerPageLifecycle(useMemo(
    () => ({ onRequestInitialFocus }),
    [onRequestInitialFocus],
  ));

  return (
    <LauncherPager
      ariaLabel="Launcher home and widget panels"
      className="nestedHomePager"
      currentPageIndex={currentPageIndex}
      homeIndex={HOME_PANEL_PAGE_INDEX}
      onPageChange={onPageChange}
      orientation={PagerOrientation.VERTICAL}
    >
      <PagerPage><UpperPanel /></PagerPage>
      <PagerPage>
        <HomePanel
          cards={cards}
          onSelect={onSelectCard}
          pageRef={homePageRef}
        />
      </PagerPage>
    </LauncherPager>
  );
});
