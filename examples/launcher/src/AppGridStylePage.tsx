/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  Container,
  CornerRadius,
  Page,
  RadioButton,
  RoundedRectangleShapeProvider,
  TextColor,
  TextStyle,
  TextView,
  VerticalList,
} from '@wearables-ui-toolkit/mrbd';
import {
  APP_GRID_STYLE_LABELS,
  APP_GRID_STYLES,
  type AppGridStyle,
} from './appGridStyle';

const APP_GRID_STYLE_OPTION_SHAPE = new RoundedRectangleShapeProvider(
  CornerRadius.MEDIUM,
);

function AppGridStylePreview({ style }: { style: AppGridStyle }) {
  if (style === APP_GRID_STYLES.TWO_COLUMN_TILES) {
    return (
      <div
        aria-hidden="true"
        className="appGridStylePreview appGridStylePreviewTiles"
      >
        {Array.from({ length: 4 }, (_, index) => (
          <span className="appGridStylePreviewWideTile" key={index}>
            <span className="appGridStylePreviewWideTileIcon" />
            <span className="appGridStylePreviewLabel" />
          </span>
        ))}
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      className="appGridStylePreview appGridStylePreviewIcons"
    >
      {Array.from({ length: 6 }, (_, index) => (
        <span className="appGridStylePreviewIconCell" key={index}>
          <span className="appGridStylePreviewIcon" />
          <span className="appGridStylePreviewLabel" />
        </span>
      ))}
    </div>
  );
}

function AppGridStyleOption({
  description,
  selected,
  style,
  onSelect,
}: {
  description: string;
  selected: boolean;
  style: AppGridStyle;
  onSelect: (style: AppGridStyle) => void;
}) {
  const displayTitle = APP_GRID_STYLE_LABELS[style];
  return (
    <Container
      aria-checked={selected}
      ariaLabel={`${displayTitle}, ${description}`}
      className="appGridStyleOption"
      data-uit-app-grid-style={style}
      data-uit-capture-id={`launcher-app-grid-style-${style}`}
      data-uit-selected={selected ? 'true' : undefined}
      height={248}
      onClick={() => onSelect(style)}
      role="radio"
      shapeProvider={APP_GRID_STYLE_OPTION_SHAPE}
      width="100%"
    >
      <div className="appGridStyleOptionContent">
        <AppGridStylePreview style={style} />
        <div className="appGridStyleOptionText">
          <TextView
            as="span"
            className="appGridStyleOptionTitle"
            textStyle={TextStyle.META1_EMPHASIZED}
          >
            {displayTitle}
          </TextView>
          <TextView
            as="span"
            className="appGridStyleOptionDescription"
            textColor={TextColor.SECONDARY}
            textStyle={TextStyle.META2}
          >
            {description}
          </TextView>
        </div>
        <span className="appGridStyleOptionRadio" aria-hidden="true">
          <RadioButton checked={selected} />
        </span>
      </div>
    </Container>
  );
}

export function AppGridStylePage({
  appGridStyle,
  onChange,
}: {
  appGridStyle: AppGridStyle;
  onChange: (style: AppGridStyle) => void;
}) {
  return (
    <Page className="launcherSettingsPage" headerText="App grid style">
      <VerticalList
        ariaLabel="App grid style options"
        className="appGridStyleList"
        contentClassName="appGridStyleOptions"
        insetForHeader
      >
        <div
          aria-label="App grid style choices"
          className="appGridStyleRadioGroup"
          role="radiogroup"
        >
          <AppGridStyleOption
            description="Wide tiles"
            onSelect={onChange}
            selected={appGridStyle === APP_GRID_STYLES.TWO_COLUMN_TILES}
            style={APP_GRID_STYLES.TWO_COLUMN_TILES}
          />
          <AppGridStyleOption
            description="Compact icons"
            onSelect={onChange}
            selected={appGridStyle === APP_GRID_STYLES.THREE_COLUMN_ICONS}
            style={APP_GRID_STYLES.THREE_COLUMN_ICONS}
          />
        </div>
      </VerticalList>
    </Page>
  );
}
