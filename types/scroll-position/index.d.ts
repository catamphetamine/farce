// TypeScript Version: 3.0

import { EnvironmentScrollPosition, Location, Session } from '../index.d.js';

export { EnvironmentScrollPosition, Location, Session } from '../index.d.js';

export {};

export class ScrollPositionRestoration<
  ScrollableContainer = any,
  Anchor = any,
> {
  constructor(
    session: Session<ScrollableContainer, Anchor>,

    // `_options` are currently only used in tests.
    _options?: {
      // `_options._shouldSetPageScrollPositionOnLocationChange`
      // isn't used in real life and is not part of the public API.
      // It's only used in tests.
      _shouldSetPageScrollPositionOnLocationChange?: (
        location: Location,
        prevLocation: Location | undefined,
      ) => boolean;

      // `_options._getSavedPageScrollPositionOnLocationChange`
      // isn't used in real life and is not part of the public API.
      // It's only used in tests.
      _getSavedPageScrollPositionOnLocationChange?: (
        location: Location,
        prevLocation: Location | undefined,
      ) => [number, number] | undefined;

      // Using this option, a developer could theoretically provide their own implementation
      // of setting a scroll position. For example, it could use "smooth" (animated) scrolling, etc.
      // This could be part of the public API if anyone provided a sensible real-world use case for it.
      _pageScrollPositionSetter?: ScrollPositionSetter<
        ScrollableContainer,
        Anchor
      >;
    },
  );

  addScrollableContainer(
    scrollableContainerKey: string,
    scrollableContainer: ScrollableContainer,

    // `_options` are currently only used in tests.
    _options?: {
      // `_options._shouldSetScrollPositionOnLocationChange`
      // isn't used in real life and is not part of the public API.
      // It's only used in tests.
      _shouldSetScrollPositionOnLocationChange?: (
        location: Location,
        prevLocation: Location | undefined,
      ) => boolean;

      // `_options._getSavedScrollPositionOnLocationChange`
      // isn't used in real life and is not part of the public API.
      // It's only used in tests.
      _getSavedScrollPositionOnLocationChange?: (
        location: Location,
        prevLocation: Location | undefined,
      ) => [number, number] | undefined;

      // Using this option, a developer could theoretically provide their own implementation
      // of setting a scroll position. For example, it could use "smooth" (animated) scrolling, etc.
      // This could be part of the public API if anyone provided a sensible real-world use case for it.
      _scrollPositionSetter: ScrollPositionSetter<ScrollableContainer, Anchor>;
    },
  ): () => void;

  locationRendered: (location: Location) => Promise<void>;

  stop(): void;

  // `_enableSavingScrollPosition()` and `_disableSavingScrollPosition()`
  // aren't used in real life and are not part of the public API.
  // They're only used in tests.
  _enableSavingScrollPosition(): void;

  // `_enableSavingScrollPosition()` and `_disableSavingScrollPosition()`
  // aren't used in real life and are not part of the public API.
  // They're only used in tests.
  _disableSavingScrollPosition(): void;
}

// Theoretically, a developer could pass their own `ScrollPositionSetter` implementation
// when calling `.addScrollableContainer()` or
export interface ScrollPositionSetter<ScrollableContainer, Anchor> {
  // Sets scroll position of a page or a scrollable element.
  // Returns a `Promise` that resolves when it has finished setting the scroll position.
  set(
    // When setting page scroll position, `scrollableContainer` is `undefined`.
    // When setting scrollable element scroll position, `scrollableContainer` is the scrollable element.
    scrollableContainer: ScrollableContainer,
    // When setting page scroll position, it could be either an anchor or numeric coordinates.
    // When setting scrollable element scroll position, it could only be numeric coordinates.
    scrollPositionOrAnchor: Anchor | [number, number],
    // `scrollPosition` provides the API for setting scroll position according to the environment.
    // For example, `WebBrowserScrollPosition` provides the methods for setting scroll position in a web browser.
    scrollPosition: EnvironmentScrollPosition<ScrollableContainer, Anchor>,
  ): Promise<void>;

  // Cancels any pending (or in-progress) setting of scroll position.
  cancel(): void;
}
