export default class WebBrowserScrollPosition {
  getPageScrollPosition() {
    return [window.pageXOffset, window.pageYOffset];
  }

  setPageScrollPosition(scrollPosition) {
    const [scrollX, scrollY] = scrollPosition;
    window.scrollTo(scrollX, scrollY);
  }

  setPageScrollPositionAtAnchor(anchor) {
    const anchorElement =
      document.getElementById(anchor) || document.getElementsByName(anchor)[0];
    if (anchorElement) {
      // By default it scrolls the element into view
      // so that it's visible at the top of the window.
      anchorElement.scrollIntoView();
    } else {
      this.setPageScrollPosition([0, 0]);
    }
  }

  getScrollableContainerScrollPosition(scrollableContainerElement) {
    return [
      scrollableContainerElement.scrollLeft,
      scrollableContainerElement.scrollTop,
    ];
  }

  setScrollableContainerScrollPosition(
    scrollableContainerElement,
    scrollPosition,
  ) {
    const [scrollX, scrollY] = scrollPosition;
    scrollableContainerElement.scrollLeft = scrollX;
    scrollableContainerElement.scrollTop = scrollY;
  }

  addPageScrollListener(listener) {
    // eslint-disable-next-line no-unused-vars
    const scrollListener = (event) => {
      listener();
    };

    window.addEventListener('scroll', scrollListener);
    return () => {
      window.removeEventListener('scroll', scrollListener);
    };
  }

  addScrollableContainerScrollListener(scrollableContainerElement, listener) {
    // eslint-disable-next-line no-unused-vars
    const scrollListener = (event) => {
      listener();
    };

    scrollableContainerElement.addEventListener('scroll', scrollListener);
    return () => {
      scrollableContainerElement.removeEventListener('scroll', scrollListener);
    };
  }

  enableAutomaticScrollRestoration() {
    window.history.scrollRestoration = 'auto';
  }

  disableAutomaticScrollRestoration() {
    window.history.scrollRestoration = 'manual';
  }

  init() {}
}
