#!/usr/bin/env node
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

const endpoint = process.argv[2];
const expectedActive = process.argv.find(argument => argument.startsWith('--expect-active='))?.slice('--expect-active='.length);
const expectedUrl = process.argv.find(argument => argument.startsWith('--expect-url='))?.slice('--expect-url='.length);
if (!endpoint) {
  console.error('Usage: node audit-runtime.mjs <CDP http endpoint or page websocket URL>');
  process.exit(2);
}

async function pageWebSocketUrl(value) {
  if (value.startsWith('ws://') || value.startsWith('wss://')) return value;
  const response = await fetch(`${value.replace(/\/$/, '')}/json/list`);
  if (!response.ok) throw new Error(`CDP page list failed: ${response.status}`);
  const pages = await response.json();
  const page = pages.find(item => item.type === 'page');
  if (!page?.webSocketDebuggerUrl) throw new Error('No debuggable page found');
  return page.webSocketDebuggerUrl;
}

const ws = new WebSocket(await pageWebSocketUrl(endpoint));
let nextId = 0;
const pending = new Map();

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

ws.addEventListener('message', event => {
  const message = JSON.parse(event.data);
  const request = pending.get(message.id);
  if (!request) return;
  pending.delete(message.id);
  if (message.error) request.reject(new Error(message.error.message));
  else request.resolve(message.result);
});

await new Promise((resolve, reject) => {
  ws.addEventListener('open', resolve, { once: true });
  ws.addEventListener('error', reject, { once: true });
});

const expression = `(() => {
  const failures = [];
  const rect = element => element.getBoundingClientRect();
  const visible = element => {
    const box = rect(element);
    const style = getComputedStyle(element);
    return box.width > 0 && box.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
  };
  const intersectsViewport = element => {
    const box = rect(element);
    return visible(element) && box.bottom > 0 && box.top < innerHeight && box.right > 0 && box.left < innerWidth;
  };
  const roots = [document.documentElement, document.body, document.getElementById('root'), document.querySelector('[data-app-root="true"]')].filter(Boolean);
  for (const root of roots) {
    const box = rect(root);
    if (box.width <= 0 || box.height <= 0) failures.push('zero-size application ancestor: ' + root.tagName + (root.id ? '#' + root.id : ''));
  }
  const mountRoot = document.getElementById('root');
  if (mountRoot && mountRoot.childElementCount === 0) failures.push('application mount root has no rendered children');
  const windowBackground = getComputedStyle(document.documentElement).getPropertyValue('--uit-color-background-window').trim();
  const expectedWindowBackgroundProbe = document.createElement('div');
  expectedWindowBackgroundProbe.style.backgroundColor = windowBackground;
  document.body.appendChild(expectedWindowBackgroundProbe);
  const expectedWindowBackground = getComputedStyle(expectedWindowBackgroundProbe).backgroundColor;
  expectedWindowBackgroundProbe.remove();
  for (const root of roots) {
    const style = getComputedStyle(root);
    if (style.backgroundImage !== 'none' || style.backgroundColor !== expectedWindowBackground) {
      failures.push('application ancestor does not paint the toolkit window background: ' + root.tagName + (root.id ? '#' + root.id : ''));
    }
  }
  const viewportWidth = document.documentElement.clientWidth;
  if (document.documentElement.scrollWidth > viewportWidth + 1) failures.push('document horizontally overflows viewport');
  const headers = [...document.querySelectorAll('[class*="Header-module__header___"]')].filter(visible);
  for (const header of headers) {
    const headerBox = rect(header);
    if (headerBox.left < -1 || headerBox.right > viewportWidth + 1) {
      failures.push('Page Header extends beyond a display edge');
    }
    const metadata = header.querySelector('[class*="metadataText"]')?.textContent?.trim() ?? '';
    if (/[·—]/.test(metadata)) {
      failures.push('Page Header metadata combines multiple supporting facts in the fixed overlay');
    }
  }
  const menus = [...document.querySelectorAll('[role="menu"]')].filter(visible);
  for (const menu of menus) {
    const menuBox = rect(menu);
    if (menuBox.left < -1 || menuBox.right > innerWidth + 1 || menuBox.top < -1 || menuBox.bottom > innerHeight + 1) {
      failures.push('open menu extends beyond a display edge');
    }
    for (const item of menu.querySelectorAll('[role="menuitem"]')) {
      if (!visible(item)) continue;
      const itemBox = rect(item);
      if (itemBox.left < menuBox.left - 1 || itemBox.right > menuBox.right + 1 || itemBox.top < menuBox.top - 1 || itemBox.bottom > menuBox.bottom + 1) {
        failures.push('menu item is clipped by its popup surface');
      }
      const textNode = item.querySelector('[class*="text"]');
      if (textNode) {
        const range = document.createRange();
        range.selectNodeContents(textNode);
        const lineTops = new Set([...range.getClientRects()].map(box => Math.round(box.top)));
        if (lineTops.size > 2) {
          failures.push('menu item label wraps beyond two lines');
        }
      }
    }
  }
  const panels = [...document.querySelectorAll('.Panel')].filter(visible);
  if (panels.length > 1) failures.push('repeated visible Panels simulate item/field rows rather than one informational backdrop');
  for (const panel of panels) {
    if (panel.closest('[class*="Modal-module__"]')) continue;
    const owner = panel.closest('[data-scroll-view="true"][data-axis="vertical"]');
    if (!owner) continue;
    const panelBox = rect(panel);
    const ownerBox = rect(owner);
    if (panelBox.left > ownerBox.left + 1 || panelBox.right < ownerBox.right - 1) {
      failures.push('page-level Panel backdrop is horizontally inset; keep it edge-to-edge and inset its children internally');
    }
  }
  const activeVerticalOwners = [...document.querySelectorAll('[data-scroll-view="true"][data-axis="vertical"]')].filter(visible);
  const listItems = [...document.querySelectorAll('[class*="ListItem-module__listItem___"]')].filter(item => {
    const owner = item.closest('[data-scroll-view="true"][data-axis="vertical"]');
    if (!intersectsViewport(item) || !activeVerticalOwners.includes(owner)) return false;
    const itemBox = rect(item);
    const ownerBox = rect(owner);
    return itemBox.top >= ownerBox.top - 1 && itemBox.bottom <= ownerBox.bottom + 1;
  });
  let truncatedListItemTitles = 0;
  let truncatedListItemSummaries = 0;
  for (const item of listItems) {
    const titleElement = item.querySelector('[class*="titleText"]');
    const subtitleElement = item.querySelector('[class*="subtitleText"]');
    const timestampElement = item.querySelector('[class*="timestampText"], [class*="subtitleTimestamp"]:not([class*="Divider"]), [class*="Timestamp"]:not([class*="Divider"])');
    const subtitle = subtitleElement?.textContent ?? '';
    const timestamp = timestampElement?.textContent?.trim() ?? '';
    const title = titleElement?.textContent?.trim() ?? '';
    if (title.includes('·')) {
      failures.push('ListItem title combines identity with a peer fact; keep one identity noun phrase: ' + title);
    }
    if (
      titleElement instanceof HTMLElement &&
      titleElement.scrollWidth > titleElement.clientWidth + 0.5
    ) {
      truncatedListItemTitles += 1;
      failures.push('ListItem title is visibly truncated; preserve the essential row identity: ' + title);
    }
    if (
      subtitleElement instanceof HTMLElement &&
      subtitleElement.scrollWidth > subtitleElement.clientWidth + 1
    ) {
      truncatedListItemSummaries += 1;
      failures.push('ListItem subtitle is visibly truncated; reduce it to the essential complementary fact: ' + subtitle.trim());
    }
    const facts = subtitle.split('·').map(value => value.trim()).filter(Boolean);
    if (facts.length > 2) {
      failures.push('ListItem subtitle serializes more than two fact groups: ' + subtitle.trim());
    }
    const normalizedFacts = facts.map(value => value.toLocaleLowerCase().replace(/^due\s+/, '').replace(/[^a-z0-9]+/g, ' ').trim());
    if (new Set(normalizedFacts).size !== normalizedFacts.length) {
      failures.push('ListItem repeats an equivalent visible subtitle fact: ' + subtitle.trim());
    }
    const normalizedSubtitle = subtitle.toLocaleLowerCase().replace(/^due\s+/, '').replace(/[^a-z0-9]+/g, ' ').trim();
    const normalizedTimestamp = timestamp.toLocaleLowerCase().replace(/^due\s+/, '').replace(/[^a-z0-9]+/g, ' ').trim();
    if (/\\b\\d+(?:\\.\\d+)?\\s*(?:m|min|mins|minutes|h|hr|hrs|hours)\\b/i.test(timestamp)) {
      failures.push('ListItem timestamp contains a duration rather than a point in time: ' + timestamp);
    }
    if (timestamp && !/\\d/.test(timestamp) && !/^(?:now|today|tomorrow|yesterday)$/i.test(timestamp)) {
      failures.push('ListItem timestamp contains non-time metadata or status: ' + timestamp);
    }
    if (/^(?:available|reserved|free at|your slot at|back(?:\\s+tomorrow)?|in use|out of service)\\b/i.test(timestamp)) {
      failures.push('ListItem timestamp prefixes a time with availability/status text: ' + timestamp);
    }
    if (/^(?:picked|sold out|cut|baked|jarred|made|pulled|restock)\\b/i.test(timestamp)) {
      failures.push('ListItem timestamp contains product state/provenance rather than only a point in time: ' + timestamp);
    }
    if (
      normalizedTimestamp.length >= 4 &&
      normalizedSubtitle.includes(normalizedTimestamp)
    ) {
      failures.push('ListItem repeats its trailing timestamp in the subtitle: ' + timestamp);
    }
  }
  if (
    listItems.length >= 2 &&
    truncatedListItemSummaries / listItems.length >= 0.5
  ) {
    failures.push('at least half of visible ListItem summaries are truncated; reduce each row to its essential facts');
  }
  if (
    listItems.length >= 2 &&
    truncatedListItemTitles / listItems.length >= 0.5
  ) {
    failures.push('at least half of visible ListItem titles are truncated; preserve essential row identity and move secondary naming detail into the subtitle');
  }
  const textViews = [...document.querySelectorAll('[class*="TextView-module__"]')].filter(intersectsViewport);
  const visibleTextCounts = new Map();
  const semanticTextElements = [...document.querySelectorAll('[class*="uit-text-"]')].filter(
    element =>
      intersectsViewport(element) &&
      element.childElementCount === 0 &&
      !element.closest('[role="listitem"], [class*="ListItem-module__"]'),
  );
  for (const textElement of semanticTextElements) {
    const value = textElement.textContent?.toLocaleLowerCase().replace(/[^a-z0-9]+/g, ' ').trim() ?? '';
    if (value.length < 8) continue;
    visibleTextCounts.set(value, (visibleTextCounts.get(value) ?? 0) + 1);
  }
  for (const [value, count] of visibleTextCounts) {
    if (count > 1) failures.push('visible semantic text repeats the same fact: ' + value);
  }
  const visibleTextValues = [...visibleTextCounts.keys()];
  for (let outer = 0; outer < visibleTextValues.length; outer += 1) {
    for (let inner = outer + 1; inner < visibleTextValues.length; inner += 1) {
      const first = visibleTextValues[outer];
      const second = visibleTextValues[inner];
      const shorter = first.length <= second.length ? first : second;
      const longer = first.length > second.length ? first : second;
      if (shorter.length >= 8 && longer.includes(shorter)) {
        failures.push('visible semantic text repeats a fact inside another label: ' + shorter);
      }
    }
  }
  for (const first of textViews) {
    const second = first.nextElementSibling;
    if (!(second instanceof HTMLElement) || !second.matches('[class*="TextView-module__"]') || !intersectsViewport(second)) continue;
    const firstBox = rect(first);
    const secondBox = rect(second);
    const rectanglesOverlap = firstBox.left < secondBox.right && firstBox.right > secondBox.left && firstBox.top < secondBox.bottom && firstBox.bottom > secondBox.top;
    const sameLineWithoutGap = Math.abs(firstBox.top - secondBox.top) < 1 && secondBox.left - firstBox.right < 1;
    if (rectanglesOverlap || sameLineWithoutGap) {
      failures.push('adjacent inline TextViews concatenate without token spacing or block layout');
      break;
    }
  }
  const compactFactNodes = [...document.querySelectorAll('*')].filter(element => visible(element) && element.childElementCount === 0 && element.textContent?.includes('·'));
  for (const node of compactFactNodes) {
    const text = node.textContent?.trim() ?? '';
    const facts = text.split('·').map(value => value.trim()).filter(Boolean);
    const normalizedFacts = facts.map(value => value.toLocaleLowerCase().replace(/[^a-z0-9]+/g, ' ').trim());
    const repeatsFact = normalizedFacts.some((fact, index) => normalizedFacts.some((other, otherIndex) => index !== otherIndex && fact.length >= 4 && (fact === other || fact.endsWith(other) || other.endsWith(fact))));
    if (repeatsFact) failures.push('compact fact text repeats equivalent information: ' + text);
  }
  const uitScrollers = activeVerticalOwners;
  const carousels = [...document.querySelectorAll('[class*="Carousel-module__carousel___"]')].filter(visible);
  const actionRegions = [...document.querySelectorAll('[class*="ButtonRail-module__buttonRail___"], [class*="ButtonGroup-module__buttonGroup___"]')].filter(element => visible(element) && !element.closest('[role="dialog"]'));
  const authoredButtonRows = new Set(
    [...document.querySelectorAll('[class*="Button-module__button___"]')]
      .filter(visible)
      .map(button => button.parentElement)
      .filter(parent => {
        if (parent == null || parent.closest('[class*="ButtonRail-module__buttonRail___"], [class*="ButtonGroup-module__buttonGroup___"]')) return false;
        const siblingButtons = [...parent.children].filter(child => child.matches('[class*="Button-module__button___"]') && visible(child));
        if (siblingButtons.length < 2) return false;
        const style = getComputedStyle(parent);
        return (style.display === 'flex' && ['row', 'row-reverse'].includes(style.flexDirection)) || style.display === 'grid';
      }),
  );
  if (authoredButtonRows.size > 0) {
    failures.push('visible horizontal sibling Buttons use an authored row instead of ButtonRail or ButtonGroup');
  }
  const authoredScrollers = [...document.querySelectorAll('*')].filter(element => {
    if (!visible(element) || element.matches('[data-scroll-view="true"]')) return false;
    const style = getComputedStyle(element);
    return ['auto', 'scroll'].includes(style.overflowY) && element.scrollHeight > element.clientHeight + 1;
  });
  for (const scroller of [...uitScrollers, ...authoredScrollers]) {
    const ownerBox = rect(scroller);
    const authoredOverflow = [...scroller.querySelectorAll('*')].some(element => {
      if (element.tagName === 'CANVAS' || element.closest('[data-scroll-view="true"][data-axis="horizontal"], [class*="ButtonRail-module__buttonRail___"], [class*="Carousel-module__carousel___"]')) return false;
      const box = rect(element);
      return box.width > 0 && (box.left < ownerBox.left - 1 || box.right > ownerBox.right + 1);
    });
    if (authoredOverflow) failures.push('vertical owner has authored horizontal overflow: ' + (scroller.className || scroller.tagName));
  }
  if (uitScrollers.length > 1) failures.push('multiple visible toolkit vertical scroll owners');
  for (const scroller of uitScrollers) {
    const scrollerBox = rect(scroller);
    if (scrollerBox.left < -1 || scrollerBox.right > viewportWidth + 1) {
      failures.push('toolkit vertical scroll owner extends beyond a display edge');
    }
    const nested = scroller.querySelector('[data-scroll-view="true"][data-axis="vertical"]');
    if (nested) failures.push('nested toolkit scroll owner');
    if (scroller.querySelector('[class*="VerticalList-module__content___"] [class*="Panel-module__panel___"]')) {
      failures.push('Panel is used as a list row or section backdrop inside VerticalList');
    }
    const orderedRows = [...scroller.querySelectorAll('[class*="ListItem-module__listItem___"]')];
    let leadingRadioRows = 0;
    for (const row of orderedRows) {
      if (row.querySelector('[class*="RadioButton-module__"]')) leadingRadioRows += 1;
      else break;
    }
    if (leadingRadioRows >= 3 && orderedRows.length > leadingRadioRows) {
      failures.push('three or more persistent filter rows displace the primary record collection');
    }
    const firstFocusable = scroller.querySelector('[tabindex="0"], button, a[href]');
    if (firstFocusable && scroller.clientHeight + 1 < rect(firstFocusable).height) failures.push('scroll owner cannot show one complete focus target');
    if (firstFocusable && rect(firstFocusable).top > rect(scroller).top + scroller.clientHeight * 0.6) {
      failures.push('leading static content consumes most of the viewport before the first meaningful focus target');
    }
    const focusables = [...scroller.querySelectorAll('[tabindex="0"], button:not([disabled]), a[href]')]
      .filter(element => visible(element) && element.closest('[data-scroll-view="true"]') === scroller);
    const activeElement = document.activeElement;
    if (activeElement === focusables[0] && scroller.scrollTop > 0.5) {
      failures.push('first focus target does not align the vertical owner to its exact top boundary');
    }
    if (
      focusables.length > 1 &&
      activeElement === focusables.at(-1) &&
      scroller.scrollHeight - scroller.clientHeight - scroller.scrollTop > 0.5
    ) {
      failures.push('last focus target does not align the vertical owner to its exact bottom boundary');
    }
    const pager = scroller.closest('[class*="SubNavigationPager-module__subNavigationPager___"]');
    const subNavigation = pager?.querySelector('[class*="SubNavigationPager-module__subNavigationWrapper___"]');
    if (subNavigation && parseFloat(getComputedStyle(scroller).paddingTop) <= 0) {
      failures.push('SubNavigationPager child scroll owner has no component-owned header inset');
    }
    if (subNavigation && focusables.length === 0) {
      failures.push('SubNavigationPager child has no meaningful focus target for partial-focus handoff');
    }
    if (headers.length > 0 && !subNavigation && parseFloat(getComputedStyle(scroller).paddingTop) <= 0) {
      failures.push('Page child scroll owner has no component-owned header inset');
    }
  }
  if (authoredScrollers.length > 0) failures.push('authored vertical scrolling element present');
  for (const viewport of carousels) {
    const owner = viewport.closest('[data-scroll-view="true"][data-axis="vertical"]');
    if (!owner) continue;
    const viewportBox = rect(viewport);
    const ownerBox = rect(owner);
    if (Math.abs(viewportBox.left - ownerBox.left) > 1 || Math.abs(viewportBox.right - ownerBox.right) > 1) {
      failures.push('Carousel viewport is not edge-to-edge');
    }
  }
  const bottomActionClearance = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--uit-spacing-xsmall'));
  for (const actionRegion of actionRegions) {
    const actionBox = rect(actionRegion);
    const isRail = actionRegion.matches('[class*="ButtonRail-module__buttonRail___"]');
    if (actionRegion.closest('[data-scroll-view="true"][data-axis="vertical"]')) {
      failures.push('page ButtonRail/ButtonGroup is inside the vertical owner instead of a bottom action dock');
    }
    if (isRail && (Math.abs(actionBox.left) > 1 || Math.abs(actionBox.right - innerWidth) > 1)) {
      failures.push('bottom ButtonRail viewport is not edge-to-edge');
    }
    if (!Number.isFinite(bottomActionClearance) || Math.abs((innerHeight - actionBox.bottom) - bottomActionClearance) > 1) {
      failures.push('page ButtonRail/ButtonGroup does not have --uit-spacing-xsmall clearance below its buttons');
    }
    const owner = uitScrollers[0];
    if (owner == null) {
      failures.push('page ButtonRail/ButtonGroup has no content scroll owner ending above it');
    } else if (rect(owner).bottom > actionBox.top + 1) {
      failures.push('content scroll owner overlaps or continues behind the bottom action region');
    }
    if (
      owner != null &&
      owner.scrollHeight > owner.clientHeight + 1 &&
      !owner.matches('[tabindex="0"]') &&
      owner.querySelectorAll('[tabindex="0"], button:not([disabled]), a[href]').length === 0
    ) {
      failures.push('overflowing ScrollView above the bottom action dock has no focusable content target for D-pad scrolling');
    }
    if (actionRegion.querySelector('[role="tab"], [aria-selected]')) {
      failures.push('ButtonRail/ButtonGroup is acting as subnavigation; use SubNavigationPager');
    }
    if (actionRegion.querySelectorAll('button:not([disabled]), [role="button"]:not([aria-disabled="true"])').length === 0) {
      failures.push('bottom ButtonRail/ButtonGroup contains no enabled action; do not use an action region as status-only content');
    }
  }
  const active = document.activeElement;
  if (active && active !== document.body && visible(active)) {
    const owner = active.closest('[data-scroll-view="true"]');
    if (owner) {
      const focusBox = rect(active);
      const ownerBox = rect(owner);
      if (focusBox.top < ownerBox.top - 1 || focusBox.bottom > ownerBox.bottom + 1 || focusBox.left < ownerBox.left - 1 || focusBox.right > ownerBox.right + 1) {
        failures.push('focused target is not fully visible inside its scroll owner');
      }
    }
  }
  return {
    url: location.href,
    viewport: { width: innerWidth, height: innerHeight },
    uitScrollOwnerCount: uitScrollers.length,
    authoredScrollOwnerCount: authoredScrollers.length,
    activeLabel: active?.getAttribute?.('aria-label') || active?.textContent?.trim().slice(0, 120) || null,
    failures,
  };
})()`;

const result = await send('Runtime.evaluate', {
  expression,
  returnByValue: true,
});
const audit = result.result.value;
if (expectedActive && !audit.activeLabel?.includes(expectedActive)) {
  audit.failures.push(`expected active focus containing "${expectedActive}", got "${audit.activeLabel}"`);
}
if (expectedUrl && !audit.url.includes(expectedUrl)) {
  audit.failures.push(`expected URL containing "${expectedUrl}", got "${audit.url}"`);
}
console.log(JSON.stringify(audit, null, 2));
ws.close();

if (audit.failures.length > 0) process.exit(1);
