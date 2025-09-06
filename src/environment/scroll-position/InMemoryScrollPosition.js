export default class InMemoryScrollPosition {
  constructor() {
    this.init();
  }

  getPageScrollPosition() {
    return this._pageScrollPosition || [0, 0];
  }

  setPageScrollPosition(scrollPosition) {
    this._pageScrollPosition = scrollPosition;
  }

  // eslint-disable-next-line no-unused-vars
  setPageScrollPositionAtAnchor(anchor) {
    this.setPageScrollPosition([0, 0]);
  }

  getScrollableContainerScrollPosition(key) {
    return this._scrollableContainerScrollPositions[key] || [0, 0];
  }

  setScrollableContainerScrollPosition(key, scrollPosition) {
    this._scrollableContainerScrollPositions[key] = scrollPosition;
  }

  // eslint-disable-next-line no-unused-vars
  addPageScrollListener(listener) {
    return () => {};
  }

  // eslint-disable-next-line no-unused-vars
  addScrollableContainerScrollListener(scrollableContainerElement, listener) {
    return () => {};
  }

  enableAutomaticScrollRestoration() {}

  disableAutomaticScrollRestoration() {}

  init() {
    this._pageScrollPosition = undefined;
    this._scrollableContainerScrollPositions = {};
  }
}
