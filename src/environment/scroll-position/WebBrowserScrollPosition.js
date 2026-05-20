// Gets or sets scroll position in a web browser.
// Setting scroll position is done "immediately", without any "smooth" animation.
export default class WebBrowserScrollPosition {
  getPageScrollPosition() {
    return [window.pageXOffset, window.pageYOffset];
  }

  setPageScrollPosition(scrollPosition) {
    const [scrollX, scrollY] = scrollPosition;
    window.scrollTo(scrollX, scrollY);
  }

  setPageScrollPositionAtAnchor(anchor) {
    const anchorElement = document.getElementById(anchor) || document.getElementsByName(anchor)[0];
    if (anchorElement) {
      // Scroll the element into view "instantly" so that it's visible at the top of the screen.
      anchorElement.scrollIntoView();
      //
      // Note on cancellation: The internet tells that a web browser will automatically interrupt
      // an in-progress `scrollIntoView()` whenever it detects another concurrent scroll event,
      // so there appears to be no need to manually implement the cancellation of it
      // when navigating to some other page because any navigation will automatically
      // trigger an initial "set  scroll position for this page" call, which will, in that case,
      // cause an automatic interruption of any in-progress `scrollIntoView()` call made on the previous page.
      //
      // Note on the arguments: The internet tells that by default `scrollIntoView()` uses
      // `behavior: "auto"` mode which scrolls "instantly" rather than "smoothly".
      // But for some weird reason, it causes an arrival of a delayed duplicate out-of-sync
      // scroll event when running automated tests in Firefox.
      // https://github.com/microsoft/playwright/issues/1552#issuecomment-4491256269
      // And adding `{ behavior: 'instant' }` argument "just in case" doesn't result in any changes.
      // See the comments in `ScrollPositionRestoration.test.js` file for more details.
    } else {
      // If there's no such "anchor" on the page, just scroll to the top of the page.
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
