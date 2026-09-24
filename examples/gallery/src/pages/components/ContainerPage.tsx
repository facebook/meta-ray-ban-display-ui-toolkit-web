/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useMemo } from 'react';
import {
  Button,
  Container,
  createContentFocusContainerMaterial,
  ListItem,
  MaterialLibrary,
  TextColor,
  TextStyle,
  TextView,
} from '@wearables-ui-toolkit/mrbd';
import { DemoSection } from '../../components/DemoSection';
import { GalleryPage } from '../../components/GalleryPage';
import { GuidancePanel } from '../../components/GuidancePanel';
import {
  galleryCoastPhoto,
  galleryForestPhoto,
  galleryOverlookPhoto,
} from '../../galleryAssets';

const coastPhoto = galleryCoastPhoto;
const forestPhoto = galleryForestPhoto;
const overlookPhoto = galleryOverlookPhoto;

function ContentFocusTile({
  label,
  src,
}: {
  label: string;
  src: string;
}) {
  const material = useMemo(createContentFocusContainerMaterial, []);

  return (
    <Container
      aria-label={label}
      className="gallery-content-focus-tile"
      isRubberbandTranslationEnabled={false}
      material={material}
      onClick={() => {}}
    >
      <img
        alt=""
        className="gallery-content-focus-image"
        draggable={false}
        src={src}
      />
    </Container>
  );
}

function CustomMaterialComponents() {
  const buttonMaterial = useMemo(
    () => MaterialLibrary.themedPrimaryBlue(),
    [],
  );
  const listItemMaterial = useMemo(
    () => MaterialLibrary.themedPrimaryBlue(),
    [],
  );

  return (
    <div className="gallery-custom-material-components">
      <Button
        material={buttonMaterial}
        onClick={() => {}}
        title="Themed action"
      />
      <ListItem
        className="gallery-custom-material-list-item"
        material={listItemMaterial}
        onClick={() => {}}
        subtitle="Uses the same material family"
        title="Themed destination"
      />
    </div>
  );
}

export function ContainerPage() {
  return (
    <GalleryPage title="Container">
      <DemoSection
        title="Actionable content surface"
        description="This Container groups route information into one interactive surface. Focusing or activating anywhere on the surface applies shared material feedback and opens the same destination."
      >
        <Container className="gallery-example-surface" onClick={() => {}}>
          <div className="gallery-surface-content">
            <TextView as="h2" textStyle={TextStyle.HEADING2}>Open saved route</TextView>
            <TextView as="p" textStyle={TextStyle.BODY2} textColor={TextColor.SECONDARY}>Waterfront loop · 3.8 miles</TextView>
          </div>
        </Container>
      </DemoSection>
      <DemoSection
        title="Content focus over image fills"
        description="The content-focus material places a blurred foreground light over stationary image content. Move between the images, then press an outer direction to inspect the edge response."
      >
        <div className="gallery-content-focus-row">
          <ContentFocusTile label="Open coast photo" src={coastPhoto} />
          <ContentFocusTile label="Open forest photo" src={forestPhoto} />
          <ContentFocusTile label="Open overlook photo" src={overlookPhoto} />
        </div>
      </DemoSection>
      <DemoSection
        title="Shared material overrides"
        description="Components built on Container expose a material prop, so one library material family can provide consistent theming across controls while each component keeps its own layout, shape, and behavior. Create a separate material instance for every mounted component."
      >
        <CustomMaterialComponents />
      </DemoSection>
      <GuidancePanel
        summary="Container is an interactive material surface that coordinates common input behavior, visual states, and animations for its content. It is both a foundation for components such as Button, Panel, and ListItem and a standalone surface when an entire content region should act as one target."
        useWhen={<ul><li>A group of content should be presented and activated as one unit, such as a weather widget that opens a detailed forecast.</li><li>Implementing a reusable component that needs material rendering and standard toolkit interaction behavior.</li><li>A custom component needs focus, press, disabled, or partial-focus states to drive its material and content presentation.</li></ul>}
        capabilities={<ul><li>Material hosting, input handling, focus and press states, disabled appearance, and animated state transitions.</li><li>Content scaling and alpha, semantic shapes, optional clipping, visual-state mapping, and partial-focus feedback.</li></ul>}
        avoid={<ul><li>Rebuilding an existing higher-level toolkit component when it already provides the intended behavior.</li><li>Using Container only to render a non-interactive material; use StaticContainer instead.</li><li>Placing focusable or interactive children inside a Container that is itself one interaction target.</li></ul>}
      />
    </GalleryPage>
  );
}
