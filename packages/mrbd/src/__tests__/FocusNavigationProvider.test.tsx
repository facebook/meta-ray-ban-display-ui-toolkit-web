/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the Apache License, Version 2.0 found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useRef } from 'react';
import {
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import {
  FOCUS_NAVIGATION_HANDLED_EVENT,
  INVALID_FOCUS_DIRECTION_EVENT,
  SCROLL_VIEW_NAVIGATION_REQUEST_EVENT,
} from '@wearables-ui-toolkit/foundation/base/FocusNavigationEvents';
import { FastScrollTracker } from '@wearables-ui-toolkit/foundation/base/InteractableFastScrollTracker';
import { InteractableBase } from '@wearables-ui-toolkit/foundation/base/InteractableBase';
import {
  VisualState,
  type InteractionState,
} from '@wearables-ui-toolkit/foundation/base/Interactions';
import { Container } from '@wearables-ui-toolkit/foundation/components/Container';
import { ScrollView } from '@wearables-ui-toolkit/foundation/components/ScrollView';
import type { ContainerMaterial } from '@wearables-ui-toolkit/foundation';
import { MaterialLibrary } from '@wearables-ui-toolkit/foundation/material/MaterialLibrary';
import { FocusNavigationProvider } from '@wearables-ui-toolkit/foundation/navigation/FocusNavigationProvider';

function rect(
  left: number,
  top: number,
  width: number,
  height: number,
): DOMRect {
  return {
    left,
    top,
    right: left + width,
    bottom: top + height,
    width,
    height,
    x: left,
    y: top,
    toJSON: () => ({}),
  } as DOMRect;
}

function ScrollNavigationHarness() {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} data-testid="focus-nav-root">
      <FocusNavigationProvider containerRef={containerRef}>
        <button>Focused action</button>
        <div data-scroll-view="true" data-testid="scroll-view" />
      </FocusNavigationProvider>
    </div>
  );
}

function NestedFocusOwnerHarness() {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} data-testid="focus-nav-root">
      <FocusNavigationProvider containerRef={containerRef}>
        <div data-testid="composite-focus-owner" data-uit-interactable="">
          <button>Nested action</button>
        </div>
        <button>Next action</button>
      </FocusNavigationProvider>
    </div>
  );
}

function FocusSectionHarness() {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} data-testid="focus-nav-root">
      <FocusNavigationProvider containerRef={containerRef}>
        <div
          data-testid="content-section"
          data-scroll-view="true"
          data-uit-focus-section="true"
        >
          <button>Current item</button>
          <button>Next item</button>
        </div>
        <button>Navigation chrome</button>
      </FocusNavigationProvider>
    </div>
  );
}

function RapidDirectionalFocusHarness() {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} data-testid="focus-nav-root">
      <FocusNavigationProvider containerRef={containerRef}>
        <button>First item</button>
        <button>Second item</button>
        <button>Third item</button>
      </FocusNavigationProvider>
    </div>
  );
}

function ScrollFocusSectionHarness() {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} data-testid="focus-nav-root">
      <FocusNavigationProvider containerRef={containerRef}>
        <button>Navigation chrome</button>
        <ScrollView ariaLabel="Content list" fadingEdgeEnabled={false}>
          <div data-uit-focus-boundary-root="true">
            <button>First item</button>
            <button>Second item</button>
          </div>
        </ScrollView>
      </FocusNavigationProvider>
    </div>
  );
}

function InertFocusCandidateHarness() {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} data-testid="focus-nav-root">
      <FocusNavigationProvider containerRef={containerRef}>
        <button>Current item</button>
        <div inert>
          <button>Inert item</button>
        </div>
        <button>Visible item</button>
      </FocusNavigationProvider>
    </div>
  );
}

function MultipleProviderHarness() {
  const firstRootRef = useRef<HTMLDivElement>(null);
  const secondRootRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <div ref={firstRootRef} data-testid="first-focus-root">
        <FocusNavigationProvider containerRef={firstRootRef}>
          <button>First root action</button>
        </FocusNavigationProvider>
      </div>
      <div ref={secondRootRef} data-testid="second-focus-root">
        <FocusNavigationProvider containerRef={secondRootRef}>
          <button>Second root first action</button>
          <button>Second root next action</button>
        </FocusNavigationProvider>
      </div>
    </>
  );
}

/**
 * Two vertically-stacked horizontal rails. The top "carousel" is a
 * programmatic scroller (`overflow: hidden` with content wider than its
 * client box — the pattern ButtonRail uses, scrolling via transform rather
 * than native scroll). Its aligned child is currently scrolled off-clip.
 *
 * `markScrollable` controls whether the carousel opts its X axis into focus
 * candidate eligibility via `data-uit-focus-scrollable` (the contract a
 * programmatic scroller must declare).
 */
function StackedRailsHarness({ markScrollable }: { markScrollable: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} data-testid="focus-nav-root">
      <FocusNavigationProvider containerRef={containerRef}>
        <div
          data-testid="carousel"
          style={{ overflowX: 'hidden', overflowY: 'hidden' }}
          data-uit-focus-scrollable={markScrollable ? 'x' : undefined}
        >
          <button>Carousel item</button>
        </div>
        <button>Action</button>
      </FocusNavigationProvider>
    </div>
  );
}

function markProgrammaticScroller(
  element: HTMLElement,
  { scrollWidth, clientWidth }: { scrollWidth: number; clientWidth: number },
): void {
  Object.defineProperty(element, 'scrollWidth', {
    value: scrollWidth,
    configurable: true,
  });
  Object.defineProperty(element, 'clientWidth', {
    value: clientWidth,
    configurable: true,
  });
}

const ORIGINAL_USER_AGENT = navigator.userAgent;

function setUserAgent(userAgent: string): void {
  Object.defineProperty(window.navigator, 'userAgent', {
    value: userAgent,
    configurable: true,
  });
}

afterEach(() => {
  setUserAgent(ORIGINAL_USER_AGENT);
  FastScrollTracker.reset();
  vi.restoreAllMocks();
});

function PointerFocusHarness() {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} data-testid="focus-nav-root">
      <FocusNavigationProvider containerRef={containerRef}>
        <button>A</button>
        <button>B</button>
      </FocusNavigationProvider>
    </div>
  );
}

function InteractableFocusHarness() {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} data-testid="focus-nav-root">
      <FocusNavigationProvider containerRef={containerRef}>
        <InteractableBase as="button">A</InteractableBase>
        <InteractableBase as="button">B</InteractableBase>
      </FocusNavigationProvider>
    </div>
  );
}

function FocusReconciliationHarness({
  onStateChange,
}: {
  onStateChange: (previous: InteractionState, next: InteractionState) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} data-testid="focus-nav-root">
      <FocusNavigationProvider containerRef={containerRef}>
        <InteractableBase as="button" onStateChange={onStateChange}>
          A
        </InteractableBase>
      </FocusNavigationProvider>
    </div>
  );
}

function ContainerFocusHarness({
  firstMaterial,
  secondMaterial,
}: {
  firstMaterial: ContainerMaterial;
  secondMaterial: ContainerMaterial;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} data-testid="focus-nav-root">
      <FocusNavigationProvider containerRef={containerRef}>
        <Container
          aria-label="A"
          material={firstMaterial}
          width={100}
          height={40}
          contentScaleForStateFn={(state) => state === 'focused' ? 1 : 0.9}
        >
          A
        </Container>
        <Container
          aria-label="B"
          material={secondMaterial}
          width={100}
          height={40}
          contentScaleForStateFn={(state) => state === 'focused' ? 1 : 0.9}
        >
          B
        </Container>
      </FocusNavigationProvider>
    </div>
  );
}

/**
 * Two stacked focusables nested under an ancestor that sets
 * `pointer-events: none` — the pattern an app uses to let a layer *beneath* a
 * container stay gesture-interactive while the container's own focusable content
 * re-enables pointer events.
 * D-pad geometric navigation must still cross between the two.
 */
function PointerEventsNoneAncestorHarness() {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} data-testid="focus-nav-root">
      <FocusNavigationProvider containerRef={containerRef}>
        <div data-testid="pe-none-page" style={{ pointerEvents: 'none' }}>
          <button style={{ pointerEvents: 'auto' }}>Top</button>
          <button style={{ pointerEvents: 'auto' }}>Bottom</button>
        </div>
      </FocusNavigationProvider>
    </div>
  );
}

describe('FocusNavigationProvider', () => {
  it('keeps directional events scoped to the provider that owns focus', () => {
    render(<MultipleProviderHarness />);

    const firstRoot = screen.getByTestId('first-focus-root');
    const secondRoot = screen.getByTestId('second-focus-root');
    const firstRootAction = screen.getByRole('button', { name: 'First root action' });
    const secondRootFirst = screen.getByRole('button', {
      name: 'Second root first action',
    });
    const secondRootNext = screen.getByRole('button', {
      name: 'Second root next action',
    });
    firstRoot.getBoundingClientRect = () => rect(0, 0, 200, 200);
    secondRoot.getBoundingClientRect = () => rect(300, 0, 200, 200);
    firstRootAction.getBoundingClientRect = () => rect(20, 20, 160, 40);
    secondRootFirst.getBoundingClientRect = () => rect(320, 20, 160, 40);
    secondRootNext.getBoundingClientRect = () => rect(320, 100, 160, 40);

    secondRootFirst.focus();
    fireEvent.keyDown(document, { key: 'ArrowDown' });

    expect(document.activeElement).toBe(secondRootNext);
  });

  it('retains visible focus when Escape is not claimed', () => {
    render(<PointerFocusHarness />);

    const action = screen.getByRole('button', { name: 'A' });
    action.focus();
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(document.activeElement).toBe(action);
  });

  it('excludes focus candidates inside inert subtrees', () => {
    render(<InertFocusCandidateHarness />);

    const root = screen.getByTestId('focus-nav-root');
    const current = screen.getByRole('button', { name: 'Current item' });
    const inert = screen.getByText('Inert item');
    const visible = screen.getByRole('button', { name: 'Visible item' });
    root.getBoundingClientRect = () => rect(0, 0, 200, 300);
    current.getBoundingClientRect = () => rect(20, 20, 160, 40);
    inert.getBoundingClientRect = () => rect(20, 80, 160, 40);
    visible.getBoundingClientRect = () => rect(20, 140, 160, 40);

    current.focus();
    fireEvent.keyDown(document, { key: 'ArrowDown' });

    expect(document.activeElement).toBe(visible);
  });

  it('handles consecutive directional presses within one animation frame', () => {
    render(<RapidDirectionalFocusHarness />);

    const root = screen.getByTestId('focus-nav-root');
    const first = screen.getByRole('button', {name: 'First item'});
    const second = screen.getByRole('button', {name: 'Second item'});
    const third = screen.getByRole('button', {name: 'Third item'});
    root.getBoundingClientRect = () => rect(0, 0, 200, 300);
    first.getBoundingClientRect = () => rect(20, 20, 160, 40);
    second.getBoundingClientRect = () => rect(20, 100, 160, 40);
    third.getBoundingClientRect = () => rect(20, 180, 160, 40);

    first.focus();
    fireEvent.keyDown(document, {key: 'ArrowDown'});
    fireEvent.keyDown(document, {key: 'ArrowDown'});

    expect(document.activeElement).toBe(third);
  });

  it('exhausts the current focus section before moving to closer navigation chrome', () => {
    render(<FocusSectionHarness />);

    const root = screen.getByTestId('focus-nav-root');
    const section = screen.getByTestId('content-section');
    const current = screen.getByRole('button', { name: 'Current item' });
    const next = screen.getByRole('button', { name: 'Next item' });
    const navigation = screen.getByRole('button', { name: 'Navigation chrome' });
    root.getBoundingClientRect = () => rect(0, 0, 200, 300);
    section.getBoundingClientRect = () => rect(0, 0, 200, 300);
    current.getBoundingClientRect = () => rect(20, -100, 160, 40);
    navigation.getBoundingClientRect = () => rect(20, 20, 160, 40);
    next.getBoundingClientRect = () => rect(20, 100, 160, 40);

    current.focus();
    fireEvent.keyDown(document, { key: 'ArrowDown' });

    expect(document.activeElement).toBe(next);
  });

  it('moves outside the current focus section at its directional boundary', () => {
    render(<FocusSectionHarness />);

    const root = screen.getByTestId('focus-nav-root');
    const section = screen.getByTestId('content-section');
    const current = screen.getByRole('button', { name: 'Current item' });
    const next = screen.getByRole('button', { name: 'Next item' });
    const navigation = screen.getByRole('button', { name: 'Navigation chrome' });
    root.getBoundingClientRect = () => rect(0, 0, 200, 300);
    section.getBoundingClientRect = () => rect(0, 0, 200, 300);
    current.getBoundingClientRect = () => rect(20, 100, 160, 40);
    next.getBoundingClientRect = () => rect(20, 200, 160, 40);
    navigation.getBoundingClientRect = () => rect(20, 20, 160, 40);

    current.focus();
    fireEvent.keyDown(document, { key: 'ArrowUp' });

    expect(document.activeElement).toBe(navigation);
  });

  it('aligns a leading scroll item before moving to external navigation chrome', () => {
    render(<ScrollFocusSectionHarness />);

    const root = screen.getByTestId('focus-nav-root');
    const scrollView = screen.getByRole('region', { name: 'Content list' });
    const current = screen.getByRole('button', { name: 'First item' });
    const next = screen.getByRole('button', { name: 'Second item' });
    const navigation = screen.getByRole('button', { name: 'Navigation chrome' });
    const scrollTo = vi.fn();
    root.getBoundingClientRect = () => rect(0, 0, 200, 300);
    scrollView.getBoundingClientRect = () => rect(0, 50, 200, 200);
    navigation.getBoundingClientRect = () => rect(20, 0, 160, 40);
    current.getBoundingClientRect = () => rect(20, 100, 160, 40);
    next.getBoundingClientRect = () => rect(20, 180, 160, 40);
    Object.defineProperties(scrollView, {
      clientHeight: { configurable: true, value: 200 },
      clientWidth: { configurable: true, value: 200 },
      scrollHeight: { configurable: true, value: 400 },
      scrollLeft: { configurable: true, writable: true, value: 0 },
      scrollTop: { configurable: true, writable: true, value: 80 },
      scrollWidth: { configurable: true, value: 200 },
      scrollTo: { configurable: true, value: scrollTo },
    });

    current.focus();
    fireEvent.keyDown(current, { key: 'ArrowUp' });

    expect(scrollTo).toHaveBeenCalledWith({
      top: 0,
      left: 0,
      behavior: 'auto',
    });
    expect(document.activeElement).toBe(navigation);
  });

  it('scrolls the current focus section before moving to navigation chrome', () => {
    render(<FocusSectionHarness />);

    const root = screen.getByTestId('focus-nav-root');
    const section = screen.getByTestId('content-section');
    const current = screen.getByRole('button', { name: 'Current item' });
    const next = screen.getByRole('button', { name: 'Next item' });
    const navigation = screen.getByRole('button', { name: 'Navigation chrome' });
    const handleNavigationRequest = vi.fn((event: Event) => {
      (event as CustomEvent<{ handled: boolean }>).detail.handled = true;
    });
    root.getBoundingClientRect = () => rect(0, 0, 200, 300);
    section.getBoundingClientRect = () => rect(0, 0, 200, 300);
    current.getBoundingClientRect = () => rect(20, -100, 160, 40);
    next.getBoundingClientRect = () => rect(20, -200, 160, 40);
    navigation.getBoundingClientRect = () => rect(20, 20, 160, 40);
    section.addEventListener(
      SCROLL_VIEW_NAVIGATION_REQUEST_EVENT,
      handleNavigationRequest,
    );

    current.focus();
    fireEvent.keyDown(document, { key: 'ArrowDown' });

    expect(handleNavigationRequest).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(current);
  });

  it('does not force-notify an already claimed owner during focus reconciliation', () => {
    const onStateChange = vi.fn();
    render(<FocusReconciliationHarness onStateChange={onStateChange} />);

    screen.getByRole('button', { name: 'A' }).focus();

    const focusedChanges = onStateChange.mock.calls.filter(
      ([, next]) => next.state === VisualState.FOCUSED,
    );
    expect(focusedChanges).toHaveLength(1);
  });

  it('classifies both sides of a rapid directional focus transfer as fast', () => {
    let now = 1_000;
    vi.spyOn(Date, 'now').mockImplementation(() => now);

    render(<InteractableFocusHarness />);

    const root = screen.getByTestId('focus-nav-root');
    const a = screen.getByRole('button', { name: 'A' });
    const b = screen.getByRole('button', { name: 'B' });
    root.getBoundingClientRect = () => rect(0, 0, 200, 200);
    a.getBoundingClientRect = () => rect(20, 20, 80, 40);
    b.getBoundingClientRect = () => rect(20, 120, 80, 40);

    let wasFastDuringOutgoingBlur = false;
    a.addEventListener('blur', () => {
      wasFastDuringOutgoingBlur = FastScrollTracker.isCurrentlyFastScrolling;
    });

    a.focus();
    expect(FastScrollTracker.isCurrentlyFastScrolling).toBe(false);

    now += 100;
    fireEvent.keyDown(document, { key: 'ArrowDown' });

    expect(document.activeElement).toBe(b);
    expect(wasFastDuringOutgoingBlur).toBe(true);
    expect(FastScrollTracker.isCurrentlyFastScrolling).toBe(true);
  });

  it('animates both sides of a non-fast directional focus transfer', () => {
    let now = 1_000;
    vi.spyOn(Date, 'now').mockImplementation(() => now);
    const firstMaterial = MaterialLibrary.card();
    const secondMaterial = MaterialLibrary.card();
    const firstStateSpy = vi.spyOn(firstMaterial, 'setState');
    const secondStateSpy = vi.spyOn(secondMaterial, 'setState');

    render(
      <ContainerFocusHarness
        firstMaterial={firstMaterial}
        secondMaterial={secondMaterial}
      />,
    );

    const root = screen.getByTestId('focus-nav-root');
    const a = screen.getByRole('button', { name: 'A' });
    const b = screen.getByRole('button', { name: 'B' });
    root.getBoundingClientRect = () => rect(0, 0, 200, 200);
    a.getBoundingClientRect = () => rect(20, 20, 80, 40);
    b.getBoundingClientRect = () => rect(20, 120, 80, 40);

    a.focus();
    firstStateSpy.mockClear();
    secondStateSpy.mockClear();

    now += 200;
    fireEvent.keyDown(document, { key: 'ArrowDown' });

    expect(firstStateSpy).toHaveBeenCalledWith(
      VisualState.FOCUSED,
      VisualState.DEFAULT,
      true,
    );
    expect(secondStateSpy).toHaveBeenCalledWith(
      VisualState.DEFAULT,
      VisualState.FOCUSED,
      true,
    );
    expect(b.style.transform).toBe('scale(0.9, 0.9)');
  });

  it('routes blocked directional feedback to the nearest interactable owner', () => {
    render(<NestedFocusOwnerHarness />);

    const root = screen.getByTestId('focus-nav-root');
    const owner = screen.getByTestId('composite-focus-owner');
    const action = screen.getByRole('button', { name: 'Nested action' });
    const nextAction = screen.getByRole('button', { name: 'Next action' });
    root.getBoundingClientRect = () => rect(0, 0, 200, 200);
    owner.getBoundingClientRect = () => rect(20, 20, 80, 40);
    action.getBoundingClientRect = () => rect(20, 20, 80, 40);
    nextAction.getBoundingClientRect = () => rect(140, 20, 40, 40);
    const handleInvalidFocusDirection = vi.fn();
    owner.addEventListener(
      INVALID_FOCUS_DIRECTION_EVENT,
      handleInvalidFocusDirection,
    );

    action.focus();
    fireEvent.keyDown(document, { key: 'ArrowLeft' });

    expect(handleInvalidFocusDirection).toHaveBeenCalledTimes(1);
    expect(handleInvalidFocusDirection.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        target: owner,
        detail: { direction: 'left' },
      }),
    );
  });

  it('routes handled directional feedback to the nearest interactable owner', () => {
    render(<NestedFocusOwnerHarness />);

    const root = screen.getByTestId('focus-nav-root');
    const owner = screen.getByTestId('composite-focus-owner');
    const action = screen.getByRole('button', { name: 'Nested action' });
    const nextAction = screen.getByRole('button', { name: 'Next action' });
    root.getBoundingClientRect = () => rect(0, 0, 200, 200);
    owner.getBoundingClientRect = () => rect(20, 20, 80, 40);
    action.getBoundingClientRect = () => rect(20, 20, 80, 40);
    nextAction.getBoundingClientRect = () => rect(140, 20, 40, 40);
    const handleNavigationHandled = vi.fn();
    owner.addEventListener(
      FOCUS_NAVIGATION_HANDLED_EVENT,
      handleNavigationHandled,
    );

    action.focus();
    fireEvent.keyDown(document, { key: 'ArrowRight' });

    expect(document.activeElement).toBe(nextAction);
    expect(handleNavigationHandled).toHaveBeenCalledTimes(1);
    expect(handleNavigationHandled.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({ target: owner }),
    );
  });

  it('marks focus navigation handled when directional input scrolls instead of moving focus', () => {
    render(<ScrollNavigationHarness />);

    const root = screen.getByTestId('focus-nav-root');
    const action = screen.getByText('Focused action');
    const scrollView = screen.getByTestId('scroll-view');
    root.getBoundingClientRect = () => rect(0, 0, 200, 200);
    action.getBoundingClientRect = () => rect(20, 20, 80, 40);
    scrollView.getBoundingClientRect = () => rect(0, 0, 200, 200);

    const handleNavigationHandled = vi.fn();
    const handleInvalidFocusDirection = vi.fn();
    action.addEventListener(
      FOCUS_NAVIGATION_HANDLED_EVENT,
      handleNavigationHandled,
    );
    action.addEventListener(
      INVALID_FOCUS_DIRECTION_EVENT,
      handleInvalidFocusDirection,
    );
    scrollView.addEventListener(
      SCROLL_VIEW_NAVIGATION_REQUEST_EVENT,
      (event) => {
        (event as CustomEvent<{ handled: boolean }>).detail.handled = true;
      },
    );

    action.focus();
    fireEvent.keyDown(document, { key: 'ArrowDown' });

    expect(handleNavigationHandled).toHaveBeenCalledTimes(1);
    expect(handleInvalidFocusDirection).not.toHaveBeenCalled();
  });

  it('crosses into a programmatic (overflow:hidden) scroller whose aligned child is currently off-clip when it opts in', () => {
    render(<StackedRailsHarness markScrollable={true} />);

    const root = screen.getByTestId('focus-nav-root');
    const carousel = screen.getByTestId('carousel');
    const carouselItem = screen.getByText('Carousel item');
    const action = screen.getByText('Action');

    root.getBoundingClientRect = () => rect(0, 0, 200, 300);
    // The carousel clips at [0, 200] horizontally...
    carousel.getBoundingClientRect = () => rect(0, 0, 200, 60);
    // ...but its only child is scrolled off-clip to the left (transform-driven
    // scroll leaves the child's rect outside the clip box).
    carouselItem.getBoundingClientRect = () => rect(-300, 10, 80, 40);
    action.getBoundingClientRect = () => rect(20, 120, 80, 40);

    // Content is wider than the client box: the rail can scroll to reveal it.
    markProgrammaticScroller(carousel, { scrollWidth: 1000, clientWidth: 200 });

    action.focus();
    fireEvent.keyDown(document, { key: 'ArrowUp' });

    // Focus must reach the off-clip carousel item — the rail scrolls it into
    // view on focus. Before the fix it was excluded as a candidate (no-op).
    expect(document.activeElement).toBe(carouselItem);
  });

  it('does not treat a decorative clip (overflow:hidden, no opt-in) as scrollable, so its off-clip child stays excluded', () => {
    render(<StackedRailsHarness markScrollable={false} />);

    const root = screen.getByTestId('focus-nav-root');
    const carousel = screen.getByTestId('carousel');
    const carouselItem = screen.getByText('Carousel item');
    const action = screen.getByText('Action');

    root.getBoundingClientRect = () => rect(0, 0, 200, 300);
    carousel.getBoundingClientRect = () => rect(0, 0, 200, 60);
    carouselItem.getBoundingClientRect = () => rect(-300, 10, 80, 40);
    action.getBoundingClientRect = () => rect(20, 120, 80, 40);

    // Content overflows, but without the opt-in marker the clip is treated as
    // a plain (non-scrollable) crop: the off-clip child must remain unreachable
    // so we never focus genuinely-hidden content.
    markProgrammaticScroller(carousel, { scrollWidth: 1000, clientWidth: 200 });

    action.focus();
    fireEvent.keyDown(document, { key: 'ArrowUp' });

    expect(document.activeElement).toBe(action);
  });

  it('navigates between focusables nested under a pointer-events:none ancestor', () => {
    render(<PointerEventsNoneAncestorHarness />);

    const root = screen.getByTestId('focus-nav-root');
    const top = screen.getByRole('button', { name: 'Top' });
    const bottom = screen.getByRole('button', { name: 'Bottom' });
    root.getBoundingClientRect = () => rect(0, 0, 200, 200);
    top.getBoundingClientRect = () => rect(20, 20, 80, 40); // upper rail
    bottom.getBoundingClientRect = () => rect(20, 120, 80, 40); // lower rail

    // D-pad up from the lower rail must cross into the upper rail. Before the
    // fix the `pointer-events: none` page ancestor excluded both buttons as
    // focus candidates, so moveFocus found nothing and focus never moved.
    bottom.focus();
    fireEvent.keyDown(document, { key: 'ArrowUp' });

    expect(document.activeElement).toBe(top);
  });

  it('focuses the nearest focusable to a pointer click in empty space', () => {
    render(<PointerFocusHarness />);

    const root = screen.getByTestId('focus-nav-root');
    const a = screen.getByRole('button', { name: 'A' });
    const b = screen.getByRole('button', { name: 'B' });
    root.getBoundingClientRect = () => rect(0, 0, 200, 200);
    a.getBoundingClientRect = () => rect(10, 20, 70, 40); // top
    b.getBoundingClientRect = () => rect(10, 140, 70, 40); // bottom

    // Click in empty space just above B (closest to B, not on any button).
    fireEvent.pointerDown(root, { clientX: 40, clientY: 130, button: 0 });

    expect(document.activeElement).toBe(b);
  });

  it('leaves a pointer click that lands on a focusable to native focus handling', () => {
    render(<PointerFocusHarness />);

    const a = screen.getByRole('button', { name: 'A' });
    const b = screen.getByRole('button', { name: 'B' });
    a.getBoundingClientRect = () => rect(10, 20, 70, 40);
    b.getBoundingClientRect = () => rect(10, 140, 70, 40);

    // Clicking on A must not get redirected to the "nearest" computation.
    fireEvent.pointerDown(a, { clientX: 40, clientY: 40, button: 0 });

    expect(document.activeElement).not.toBe(b);
  });

  it('does not install pointer-to-focus on Android platforms', () => {
    setUserAgent(
      'Mozilla/5.0 (Linux; Android 14; Generic Device Build/TEST; wv) ' +
        'AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/146.0.7680.216 Safari/537.36',
    );
    render(<PointerFocusHarness />);

    const root = screen.getByTestId('focus-nav-root');
    const a = screen.getByRole('button', { name: 'A' });
    const b = screen.getByRole('button', { name: 'B' });
    root.getBoundingClientRect = () => rect(0, 0, 200, 200);
    a.getBoundingClientRect = () => rect(10, 20, 70, 40);
    b.getBoundingClientRect = () => rect(10, 140, 70, 40);

    // On Android the pointer handler is not installed, so a click in empty
    // space must not move focus to the nearest element.
    fireEvent.pointerDown(root, { clientX: 40, clientY: 130, button: 0 });

    expect(document.activeElement).not.toBe(b);
  });
});
