import NavigationStack from '../../src/NavigationStack';
import ScrollPositionRestoration from '../../src/scroll-position/ScrollPositionRestoration';
import WebBrowserSession from '../../src/session/WebBrowserSession';

// Creates a website with `ScrollPositionRestoration`.
export default function createApp({
  sessionKey,
  shouldUpdatePageScrollPositionForLocation,
  getPageScrollPositionForLocation,
} = {}) {
  let currentLocation = null;

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

    session = new WebBrowserSession();
    // There's this one test that restores data of a session of a previous app
    // and for that the new session just has to have the same key in order to read
    // the previous app's session data from the environment storage.
    if (sessionKey) {
      session.key = sessionKey;
    }
    navigationStack = new NavigationStack(session);
    scrollPositionRestoration = new ScrollPositionRestoration(session, {
      _shouldUpdatePageScrollPositionForLocation:
        shouldUpdatePageScrollPositionForLocation,
      _getPageScrollPositionForLocation: getPageScrollPositionForLocation,
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
      _shouldUpdateScrollPositionForLocation:
        options && options.shouldUpdateScrollPositionForLocation,
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
    getSessionKey: () => session.key,
  };
}
