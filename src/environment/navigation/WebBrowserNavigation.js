import getLocationUrl from '../../getLocationUrl.js';
import parseQueryFromSearch from '../../parseQueryFromSearch.js';
import Operations from './operation/operations.js';

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

  // Subscribes to any "asynchronous" changes of the current location,
  // "asynchronous" changes being ones that happen out-of-sync with the code
  // that might have potentially triggered those changes.
  //
  // For example, in a web browser, "Back"/"Forward" navigation happens out-of-sync
  // with the code that calls `window.pushState()` or `window.replaceState()` function.
  //
  // Additionally, in a web browser, "Back"/"Forward" navigation could be triggered
  // outside of the application code by user clicking those "Back"/"Forward" buttons manually
  // in their web browser.
  //
  // Returns an `unsubscribe()` function which is "idempotent", i.e. it can be called multiple times.
  //
  subscribeToAsyncrhonousLocationUpdates(listener, { getNextLocationKey }) {
    // "popstate" event fires whenever the active history entry changes
    // while staying on the same document. This includes:
    // * Clicking the browser's Back or Forward buttons.
    // * Clicking an anchor link that changes the URL fragment/hash.
    // * Calling history.back(), history.forward(), or history.go() via JavaScript.
    const onPopState = () => {
      // If "popstate" event is received before navigation is initialized,
      // ignore such "popstate" event. Such "ignore" behavior is logical from
      // the application code's point of view: it doesn't expect any navigation events
      // to be recorded before it has initialized the navigation.
      // And besides, `this._currentLocationIndex` is not defined in such conditions.
      if (this._currentLocationIndex === NO_LOCATION_INDEX) {
        throw new Error(
          'Received a "popstate" event before finished initializing navigation',
        );
      }
      const prevIndex = this._currentLocationIndex;
      // In case of "Back"/"Forward" navigation, there will be a previously-saved location state.
      // In case of clicking an "anchor" hyperlink, or manually editing the "anchor" part of the URL,
      // there will be no previously-saved location state because it will be a new location.
      const operation = this._getCurrentLocationState()
        ? Operations.SHIFT
        : Operations.PUSH
      const index = this._getCurrentLocationState()
        ? this._getCurrentLocationState().index
        : this._currentLocationIndex + 1
      const key = this._getCurrentLocationState()
        ? this._getCurrentLocationState().key
        : getNextLocationKey()

      // If there's no state for the new location (for reasons described above), create it.
      if (!this._getCurrentLocationState()) {
        this._setCurrentLocationState({ key, index });
      }

      this._currentLocationIndex = index;

      listener(
        this._createEntryFromCurrentLocation({
          operation,
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

  // When run in a web browser, it could not only "start" a new navigation session
  // but also "resume" a previously-started navigation session. That could happen
  // when the user refreshes a page in a web browser which still retains
  // the previous navigation session's data but at the same time restarts
  // the javascript code from scratch.
  //
  // So this `init()` method handles both cases: when there's previous navigation session's data
  // that should be restored and when there's no previous navigation session's data.
  //
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
    // such as `location.key`. Without `location.key` always being present the initial location object,
    // there'd be a bug of incorrect scroll position being set on the initial location URL in some scenarios:
    // https://github.com/taion/scroll-behavior/issues/215
    //
    // If the user opens the initial page for the first time, `window.history.state` will be `null`.
    // If the user refreshes the initial page, `window.history.state` will not be cleared
    // and therefore will not be `null` and will instead have the previously-set value.
    //
    if (!this._getCurrentLocationState()) {
      this._setCurrentLocationState({ key, index });
    }

    this._currentLocationIndex = index;

    // Call the listeners.
    return this._createEntryFromCurrentLocation({ operation, delta });
  }

  navigate(location, { operation, key, index, delta }) {
    const additionalProperties = { key, index };

    this._navigateToLocationAndKeepItsAdditionalPropertiesInHistory(
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

  _setCurrentLocationState(state) {
    // Call `history.replaceState()`.
    this._navigateToLocationAndKeepItsAdditionalPropertiesInHistory(
      this._getCurrentLocation(),
      state,
      0,
    );
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

  // Stores "additional" properties associated with `location` in web browser's history storage.
  // Web browser's history storage is not intended for large datasets and should only be used
  // to store small bits of data.
  //
  // "Some browsers save state objects to the user's disk so they can be restored after the user restarts
  //  the browser, and impose a size limit on the serialized representation of a state object, and will throw
  //  an exception if you pass a state object whose serialized representation is larger than that size limit.
  //  So in cases where you want to ensure you have more space than what some browsers might impose,
  //  you're encouraged to use sessionStorage and/or localStorage."
  //
  // Source: https://developer.mozilla.org/en-US/docs/Web/API/History/pushState
  //
  // To store large amounts of data, one could use `window.sessionStorage` instead.
  // It is accessible via `DataStorage(session)` class.
  //
  _navigateToLocationAndKeepItsAdditionalPropertiesInHistory(
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
