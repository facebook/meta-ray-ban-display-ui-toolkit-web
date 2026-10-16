/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { type MouseEvent, useLayoutEffect, useRef, useState } from 'react';
import {
  Button,
  type ButtonHandle,
  ButtonContextMenuItemView,
  ButtonItemIconSize,
  ContextMenu,
  DismissReason,
  EmojiContextMenuItemView,
  TooltipMode,
} from '@wearables-ui-toolkit/mrbd';
import archiveFilled from '@wearables-ui-toolkit/icons/svg/archive__filled.svg';
import bellFilled from '@wearables-ui-toolkit/icons/svg/bell__filled.svg';
import bookmarkFilled from '@wearables-ui-toolkit/icons/svg/bookmark__filled.svg';
import { DemoSection } from '../../components/DemoSection';
import { GalleryPage } from '../../components/GalleryPage';
import { GuidancePanel } from '../../components/GuidancePanel';

function ContextMenuDemo({ compact = false, iconOnly = false }: { compact?: boolean; iconOnly?: boolean }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const triggerRef = useRef<ButtonHandle>(null);
  const shouldReturnFocusToTriggerRef = useRef(false);
  const menuLabel = compact ? 'Reactions' : iconOnly ? 'Quick actions' : 'Route actions';
  const size = compact || iconOnly ? 'small' : 'default';
  const surfaceStyle = compact ? 'secondary' : 'primary';

  const dismissMenuToTrigger = (event?: MouseEvent<HTMLElement>) => {
    // Tooltip content is rendered through a portal owned by the Button. Stop
    // the item click before it reaches the trigger and reopens the menu.
    event?.stopPropagation();
    shouldReturnFocusToTriggerRef.current = true;
    setIsMenuOpen(false);
  };

  useLayoutEffect(() => {
    if (!isMenuOpen && shouldReturnFocusToTriggerRef.current) {
      // Restore focus before the browser paints the closed state so selection
      // does not briefly leave the page without a focused control.
      shouldReturnFocusToTriggerRef.current = false;
      triggerRef.current?.getElement()?.focus({ preventScroll: true });
    }
  }, [isMenuOpen]);

  return (
    <Button
      ref={triggerRef}
      title={menuLabel}
      alwaysShowText
      onClick={() => setIsMenuOpen(open => !open)}
      tooltipMode={isMenuOpen ? TooltipMode.FOCUSED : TooltipMode.NONE}
      tooltipFocusable
      tooltipHidesFocusState
      tooltipContentDescription={menuLabel}
      tooltipContent={(
        <ContextMenu
          aria-label={menuLabel}
          size={size}
          surfaceStyle={surfaceStyle}
          onDismiss={(reason) => {
            if (
              reason === DismissReason.BACK_BUTTON ||
              reason === DismissReason.NAVIGATION
            ) {
              setIsMenuOpen(false);
            }
          }}
        >
          {compact ? (
            <>
              <EmojiContextMenuItemView
                size={size}
                emoji="👍"
                ariaLabel="React with thumbs up"
                onClick={dismissMenuToTrigger}
              />
              <EmojiContextMenuItemView
                size={size}
                emoji="❤️"
                ariaLabel="React with heart"
                onClick={dismissMenuToTrigger}
              />
              <EmojiContextMenuItemView
                size={size}
                emoji="😂"
                ariaLabel="React with laughter"
                onClick={dismissMenuToTrigger}
              />
            </>
          ) : (
            <>
              <ButtonContextMenuItemView
                size={size}
                title={iconOnly ? undefined : 'Save route'}
                icon={bookmarkFilled}
                iconSize={iconOnly ? ButtonItemIconSize.LARGE : ButtonItemIconSize.MEDIUM}
                ariaLabel="Save route"
                onClick={dismissMenuToTrigger}
              />
              <ButtonContextMenuItemView
                size={size}
                title={iconOnly ? undefined : 'Mute alerts'}
                icon={bellFilled}
                iconSize={iconOnly ? ButtonItemIconSize.LARGE : ButtonItemIconSize.MEDIUM}
                ariaLabel="Mute alerts"
                onClick={dismissMenuToTrigger}
              />
              <ButtonContextMenuItemView
                size={size}
                title={iconOnly ? undefined : 'Archive'}
                icon={archiveFilled}
                iconSize={iconOnly ? ButtonItemIconSize.LARGE : ButtonItemIconSize.MEDIUM}
                ariaLabel="Archive"
                onClick={dismissMenuToTrigger}
              />
            </>
          )}
        </ContextMenu>
      )}
    />
  );
}

export function ContextMenuPage() {
  return (
    <GalleryPage title="ContextMenu">
      <DemoSection
        title="Secondary commands"
        description="Activate the button to open commands for the current route. The menu is presented as focusable tooltip content anchored to its trigger."
      >
        <ContextMenuDemo />
      </DemoSection>
      <DemoSection
        title="Compact reactions"
        description="The small size pairs a 56-pixel menu with 48-pixel items. The secondary surface provides the darker background variant."
      >
        <ContextMenuDemo compact />
      </DemoSection>
      <DemoSection
        title="Compact icon actions"
        description="Icon-only actions use the small size with no horizontal content padding, keeping their circular footprint around a large icon."
      >
        <ContextMenuDemo iconOnly />
      </DemoSection>
      <GuidancePanel
        summary="ContextMenu presents secondary commands as focusable tooltip content anchored to the Button or Container that opens it. It is a temporary popup, not inline page content."
        useWhen={<ul><li>A Button or Container has a short set of commands that apply specifically to that object.</li></ul>}
        capabilities={<ul><li>Button and emoji menu items, default and compact sizing, primary and secondary surfaces, scrolling, tail control, and dismissal callbacks.</li></ul>}
        avoid={<ul><li>Rendering a context menu inline or leaving it permanently visible.</li><li>Using a context menu as permanent navigation.</li><li>Opening another overlay from a menu item.</li></ul>}
      />
    </GalleryPage>
  );
}
