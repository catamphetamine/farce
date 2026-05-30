import NavigationStack from '../../src/NavigationStack.js';
import WebBrowserEnvironment from '../../src/environment/WebBrowserEnvironment.js';
import ScrollPositionRestoration from '../../src/scroll-position/ScrollPositionRestoration.js';

// Creates a website with `ScrollPositionRestoration`.
export default function createApp({
  shouldChangePageScrollPositionOnLocationChange,
  getSavedPageScrollPositionOnLocationChange,
} = {}) {
  let currentLocation = null;

  let locationRenderedListeners = [];
  let listeners = [];
  let scrollPositionRestoration = null;
  let navigationStack = null;
  let session = null;

  function onLocationDidChange(location) {
    // const prevLocation = currentLocation;
    currentLocation = location;

    listeners.forEach((listener) => {
      listener(location);
    });

    scrollPositionRestoration.locationRendered(location);

    for (const locationRenderedListener of locationRenderedListeners) {
      locationRenderedListener(location);
    }
  }

  // Adds a "location rendered" listener.
  function whenRenderedLocation(listener) {
    locationRenderedListeners.push(listener);

    // Returns a "remove listener" function.
    return () => {
      locationRenderedListeners = locationRenderedListeners.filter(
        (_) => _ !== listener,
      );
    };
  }

  // Removes a "location change" event listener.
  let unlisten = null;

  // Adds a "location change" event listener.
  // A "location change" event happens at every navigation: `goTo()` or `goBack()`,
  // An initial "location change" event happens at startup.
  function listen(listener) {
    // Create a `WebBrowserSession`, `NavigationStack` and `ScrollPositionRestoration`
    // at the initial call of the `app.listen()` function.
    if (listeners.length > 0) {
      throw new Error('Only one `listener` is allowed in tests');
    }

    navigationStack = new NavigationStack(WebBrowserEnvironment);
    // eslint-disable-next-line no-underscore-dangle
    session = navigationStack._session;
    scrollPositionRestoration = new ScrollPositionRestoration(session, {
      shouldChangePageScrollPositionOnLocationChange,
      _getSavedPageScrollPositionOnLocationChange:
        getSavedPageScrollPositionOnLocationChange,
    });

    unlisten = navigationStack.subscribe(onLocationDidChange);

    listeners.push(listener);

    navigationStack.init(currentLocation);

    return () => {
      listeners = listeners.filter((item) => item !== listener);

      if (listeners.length === 0) {
        // `navigationStack.stop()` automatically calls `session.stop()`
        // so there's no requirement to call `session.stop()` explicitly here.
        navigationStack.stop();
        scrollPositionRestoration.stop();
        unlisten();
      }
    };
  }

  // Registers a scrollable container on a page.
  function registerScrollableContainer(key, element, options) {
    return scrollPositionRestoration.addScrollableContainer(key, element, {
      shouldChangeScrollPositionOnLocationChange:
        options && options.shouldChangeScrollPositionOnLocationChange,
      _getSavedScrollPositionOnLocationChange:
        options && options.getSavedScrollPositionOnLocationChange,
    });
  }

  function disableSavingScrollPosition() {
    // eslint-disable-next-line no-underscore-dangle
    scrollPositionRestoration._disableSavingScrollPosition();
  }

  function enableSavingScrollPosition() {
    // eslint-disable-next-line no-underscore-dangle
    scrollPositionRestoration._enableSavingScrollPosition();
  }

  // Navigates to a new location.
  const goTo = (location) => {
    navigationStack.push(location);
  };

  // Navigates to a previous location.
  const goBack = () => {
    navigationStack.shift(-1);
  };

  return {
    goTo,
    goBack,
    listen,
    registerScrollableContainer,
    disableSavingScrollPosition,
    enableSavingScrollPosition,
    whenRenderedLocation,
  };
}
