export default class ScrollPositionSetter {
  constructor({ scrollPositionApi }) {
    this._scrollPositionApi = scrollPositionApi;
  }

  // Sets scroll position.
  // Returns a `Promise`.
  set(scrollPositionOrAnchor, scrollableContainer) {
    if (scrollableContainer) {
      this._scrollPositionApi.setScrollableContainerScrollPosition(
        scrollableContainer,
        scrollPositionOrAnchor,
      );
    } else {
      if (typeof scrollPositionOrAnchor === 'string') {
        this._scrollPositionApi.setPageScrollPositionAtAnchor(scrollPositionOrAnchor);
      } else {
        this._scrollPositionApi.setPageScrollPosition(scrollPositionOrAnchor);
      }
    }
    // `scrollPositionApi` functions set scroll position "instantly",
    // so they don't return a `Promise`. Return a "dummy" `Promise`.
    return Promise.resolve();
  }

  // Cancels setting of scroll position.
  // Because `scrollPositionApi` functions set scroll position "instantly",
  // at any given time there's no in-progress scrolling process that could be cancelled,
  // so this `.stop()` function doesn't do anything.
  stop() {}
}
