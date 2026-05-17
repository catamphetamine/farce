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
    // The default "auto" behavior seems to work in the following way:
    //
    // * It doesn't scroll to top on `window.history.pushState()` or `window.history.replaceState()`.
    //
    // * It does restore scroll position on "popstate" event
    //   (they say, in Firefox it happens before the event is dispatched,
    //    while in Chrome it happens after the event is dispatched)
    //
    // https://v5.reactrouter.com/web/guides/scroll-restoration
    //
    window.history.scrollRestoration = 'auto';
  }

  disableAutomaticScrollRestoration() {
    // Setting `window.history.scrollRestoration` value updates it in the current history entry
    // and any subsequent history entries.
    // This means that it should be set at application initialization stage,
    // that is before any navigation.
    // https://majido.github.io/scroll-restoration-proposal/history-based-api.html
    window.history.scrollRestoration = 'manual';
  }

  init() {}
}
