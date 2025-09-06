import getLocationUrl from '../../getLocationUrl';
// import parseInputLocation from '../../parseInputLocation';
import parseQueryFromSearch from '../../parseQueryFromSearch';
import Operations from './operation/operations';

const NO_LOCATION_INDEX = -1;

// A web browser has a notion of a "navigation history".
// A "navigation history" exists within a given web browser's tab.
// The user can click "Back" or "Forward" buttons in the web browser and it will automatically load
// "previous" or "next" page from scratch.
//
// Later, web browsers added a `window.history` object that the application can,
// but isn't required to, interact with. That `window.history` object allows the application
// to programmatically control the URL in the address bar of the web browser, as well as
// the "navigation history" by programmatically adding new entries to it or reading the current entry,
// and it also allows the application to override the default web browser's behavior
// when the user clicks "Back" or "Forward" buttons in the web browser.
//
// Specifically, the `window.history` object has a method called `.pushState()` which programmatically adds
// a new entry in the "navigation history" and updates the URL in the address bar and also
// tells the web browser that starting from the entry before this new entry in the "navigation history",
// the application would prefer to manually handle any "Back"/"Forward" transition when the user clicks
// those "Back" or "Forward" buttons in the web browser, and this behavior should persist for any future
// "navigation history" entries programmatically added by the application via `window.history.pushState()`,
// and will only stop if the user navigates from the page by the means of conventional navigation,
// that is by clicking a standard hyperlink, at which point the current page gets "destroyed".
//
// So for manually "pushed" entries of the "navigation history", the web browser won't load those pages
// from scratch after a user-initiated "Back" or "Forward" transition. In fact, it won't do anything and
// it will just step aside and let the application itself do those transitions. The web browser will only
// update the URL in the address bar and that's it.
//
// This whole thing allows the application to:
//
// * Load the "previous" or "next" page much faster than when using the default "from scratch" approach
//   because it doesn't have to destroy the current page, then send a new HTTP request to the server,
//   then parse the HTML response and initialize a new page, re-download all those images, etc.
//
// * Optionally render a snapshotted verison of the "previous" page thereby "restoring" the "previous" page
//   rather than reloading it from scratch, i.e. the state of the "previous" page could be fully restored.
//
export default class WebBrowserNavigation {
  constructor() {
    // `_currentLocationIndex` is used when receiving a "popstate" event
    // that wasn't initiated by the application code but rather by the user
    // clicking "Back" or "Forward" button in their web browser.
    this._currentLocationIndex = NO_LOCATION_INDEX;
  }

  // Subscribes to changes in the current location.
  // Returns an `unsubscribe()` function which is "idempotent", i.e. it can be called multiple times.
  subscribe(listener) {
    const onPopState = () => {
      // If "popstate" event is received before navigation is initialized,
      // ignore such "popstate" event. This behavior is logical from the application code's view.
      // And besides, `this._currentLocationIndex` is not defined in such conditions.
      if (this._currentLocationIndex === NO_LOCATION_INDEX) {
        throw new Error('Received a "popstate" event before initialized');
      }
      const prevIndex = this._currentLocationIndex;
      const { index } = this._getCurrentLocationState();
      this._currentLocationIndex = index;

      listener(
        this._createEntryFromCurrentLocation({
          operation: Operations.SHIFT,
          delta: index - prevIndex,
        }),
      );
    };

    // Due to how `popstate` event listener works, there should only be one listener at a time,
    // otherwise two different `Session`s would react to the same `popstate` event,
    // each interpreting it as its own, while in reality it only belongs to one of them
    // and the other one should completely ignore it.
    // In other words, there can't exist two navigation sessions simultaneously by design.
    // There can only be one active navigation session at a given time.
    // Another one could only start after the previous one ends,
    // not both of them being active simultaneously.
    if (this._subscribed) {
      throw new Error(
        'There already is an active subscription. Only one subscription is allowed at a time.',
      );
    }

    window.addEventListener('popstate', onPopState);
    this._subscribed = true;

    return () => {
      window.removeEventListener('popstate', onPopState);
      this._subscribed = false;
    };
  }

  init(initialLocation, { operation, key, index, delta }) {
    // Validate that `initialLocation` is same as `window.location`.
    const isCurrentLocation =
      initialLocation === this._getCurrentLocation() ||
      this._isSameAsCurrentLocation(initialLocation);

    if (!isCurrentLocation) {
      throw new Error(
        '`initialLocation` argument should be same as `window.location`',
      );
    }

    // Set `window.history.state` of the initial location
    // by calling `window.history.replaceState()` on page load.
    // Otherwise, `window.history.state` would be `null` for the initial location
    // and there'd be no place to store the additional properties of the initial location
    // such as `location.key`.
    // https://github.com/taion/scroll-behavior/issues/215
    //
    // If the user opens the initial page for the first time, `window.history.state` will be `null`.
    // If the user refreshes the initial page, `window.history.state` will not be cleared
    // and therefore will not be `null` and will instead have the previously-set value.
    //
    if (!this._getCurrentLocationState()) {
      // Create additional properties for the initial locaiton.
      const additionalProperties = { key, index };
      // Call `history.replaceState()`.
      this._storeAdditionalPropertiesForLocation(
        initialLocation,
        additionalProperties,
        delta,
      );
    }

    this._currentLocationIndex = index;

    // Call the listeners.
    return this._createEntryFromCurrentLocation({ operation, delta });
  }

  navigate(location, { operation, key, index, delta }) {
    const additionalProperties = { key, index };

    this._storeAdditionalPropertiesForLocation(
      location,
      additionalProperties,
      delta,
    );

    this._currentLocationIndex = index;

    // Call the listeners.
    return {
      operation,
      delta,
      ...location,
      ...additionalProperties,
    };
  }

  // shift({ operation, index, delta }) {
  shift({ delta }) {
    // Web browser `history` is extremely non-strict when it comes to `history.go(delta)` navigation.
    // It will allow any number as `delta`, regardless of whether such history entry exists or not.
    // To introduce strict validation of the `delta` argument, `Session` class code explicitly checks
    // the new `index` on whether it's out of bounds of the navigation history stack, and after it verifies
    // that the new `index` is valid, it calls the `.shift(delta)` method of `WebBrowserNavigation` class.
    //
    // Calling `window.history.go()` will trigger a "popstate" event which will trigger the listeners.
    //
    window.history.go(delta);
  }

  getInitialLocation() {
    // Web browser environment already knows the initial location
    // by the time javascript code starts execution.
    return this._getCurrentLocation();
  }

  _getCurrentLocation() {
    return window.location;
  }

  _getCurrentLocationState() {
    return window.history.state;
  }

  _isSameAsCurrentLocation(inputLocation) {
    return typeof inputLocation === 'string'
      ? inputLocation === getLocationUrl(this._getCurrentLocation())
      : inputLocation === this._getCurrentLocation() ||
          getLocationUrl(inputLocation) ===
            getLocationUrl(this._getCurrentLocation());
  }

  _createEntryFromCurrentLocation({ operation, delta }) {
    const { pathname, search, hash } = this._getCurrentLocation();

    const { key, index } = this._getCurrentLocationState();

    return {
      operation,
      pathname,
      search,
      query: parseQueryFromSearch(search),
      hash,
      key,
      index,
      delta,
    };
  }

  _storeAdditionalPropertiesForLocation(
    location,
    additionalProperties,
    delta,
  ) {
    const url = getLocationUrl(location);
    // `delta` property is not stored in `window.history.state`
    // because it is supposed to be recalculated every time when reading from `window.history.state`.
    if (delta === 1) {
      window.history.pushState(additionalProperties, null, url);
    } else if (delta === 0) {
      window.history.replaceState(additionalProperties, null, url);
    } else {
      throw new Error(`Unsupported \`delta\`: ${delta}`);
    }
  }
}
