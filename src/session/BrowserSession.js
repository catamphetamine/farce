/* eslint-disable max-classes-per-file */

import getLocationUrl from '../getLocationUrl';
import parseQueryFromSearch from '../parseQueryFromSearch';

const INITIAL_KEY_INDEX = -1;
const INITIAL_INDEX = -1;

const INIT_LOCATION_DELTA = 0;

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
class BrowserNavigation {
  constructor() {
    // `this._keyPrefix` exists to avoid `this._keyIndex` collision after a page refresh.
    // After a page refresh, `this._keyIndex` is reset to `0` while the previous navigation history
    // still exists because web browser navigation history survives a page reload.
    this._keyPrefix = Date.now().toString(36);
    // `this._keyIndex` is incremented every time the current location changes.
    this._keyIndex = INITIAL_KEY_INDEX;

    // `this._index` is the index of the top element in the navigation stack.
    // I.e. it's the index of the "current" location in the navigation stack.
    this._index = INITIAL_INDEX;
  }

  init() {
    return this._createEntryFromCurrentLocation('INIT');
  }

  _createEntryFromCurrentLocation(action) {
    const { pathname, search, hash } = window.location;

    const isSettingInitialLocation = this._index === INITIAL_INDEX;

    if (action === 'INIT' && !isSettingInitialLocation) {
      throw Error('Browser session has already been initialized');
    }

    if (isSettingInitialLocation && action !== 'INIT') {
      throw Error(
        'Browser session must be initialized before reacting to location changes',
      );
    }

    const { key, index, delta, state } = isSettingInitialLocation
      ? this._createAdditionalPropertiesForNewLocation({
          delta: 1,
          state: undefined,
        })
      : this._restoreAdditionalPropertiesForCurrentLocation();

    return {
      action,
      pathname,
      search,
      query: parseQueryFromSearch(search),
      hash,
      key,
      index,
      delta: isSettingInitialLocation ? INIT_LOCATION_DELTA : delta,
      state,
    };
  }

  // Subscribes to changes in location,
  // excluding ones that happened as a result of calling `.navigate()`.
  subscribe(listener) {
    const onPopState = () => {
      listener(this._createEntryFromCurrentLocation('SHIFT'));
    };

    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('popstate', onPopState);
    };
  }

  navigate(location) {
    const { action, state } = location;

    if (action !== 'PUSH' && action !== 'REPLACE') {
      throw Error(`Unrecognized browser session action: ${action}`);
    }

    if (this._index === INITIAL_INDEX) {
      throw Error('Browser session must be initialized before navigation');
    }

    const delta = action === 'PUSH' ? 1 : 0;

    const additionalProperties =
      this._createAdditionalPropertiesForNewLocation({ delta, state });

    this._storeAdditionalPropertiesForLocation(location, additionalProperties);

    return { ...location, ...additionalProperties };
  }

  shift(delta) {
    window.history.go(delta);
  }

  _createKeyForKeyIndex(keyIndex) {
    return `${this._keyPrefix}.${keyIndex.toString(36)}`;
  }

  _createAdditionalPropertiesForNewLocation({ delta, state }) {
    this._keyIndex++;
    this._index += delta;

    return {
      key: this._createKeyForKeyIndex(this._keyIndex),
      index: this._index,
      delta,
      state,
    };
  }

  _restoreAdditionalPropertiesForCurrentLocation() {
    // Initial location doesn't have any `window.history.state` assigned to it
    // because it wasn't navigated to via a `window.history.pushState()` method.
    // Because of that, the additional properties for the initial location can't be read
    // from `window.history.state` and have to be reconstructed manually.
    const { key, index, state } =
      window.history.state ||
      this._getAdditionalPropertiesForInitialLocation();
    const delta = index - this._index;
    this._index = index;
    return { key, index, delta, state };
  }

  _storeAdditionalPropertiesForLocation(location, additionalProperties) {
    const url = getLocationUrl(location);
    // `delta` property is not stored in `window.history.state`
    // because it is supposed to be recalculated every time when reading from `window.history.state`.
    const { delta, ...restProperties } = additionalProperties;
    if (delta === 1) {
      window.history.pushState(restProperties, null, url);
    } else if (delta === 0) {
      window.history.replaceState(restProperties, null, url);
    } else {
      throw new Error(
        `Unexpected \`delta\` when storing additional properties for location: ${delta}`,
      );
    }
  }

  // Initial location doesn't have any `window.history.state` assigned to it
  // because it wasn't navigated to via a `window.history.pushState()` method.
  // Because of that, the additional properties for the initial location can't be read
  // from `window.history.state` and have to be reconstructed manually.
  _getAdditionalPropertiesForInitialLocation() {
    return {
      key: this._createKeyForKeyIndex(INITIAL_KEY_INDEX + 1),
      index: INITIAL_INDEX + 1,
      delta: INIT_LOCATION_DELTA,
      state: undefined,
    };
  }
}

class BrowserDataStorage {
  // Returns either a `string` value or `null` if the key doesn't exist.
  get(key) {
    // `sessionStorage` persists across page reloads, and so does web browser navigation history.
    return window.sessionStorage.getItem(key);
  }

  remove(key) {
    // `sessionStorage` persists across page reloads, and so does web browser navigation history.
    window.sessionStorage.removeItem(key);
  }

  set(key, value) {
    // `sessionStorage` persists across page reloads, and so does web browser navigation history.
    window.sessionStorage.setItem(key, value);
  }
}

export default class BrowserSession {
  constructor() {
    this.navigation = new BrowserNavigation();
    this.dataStorage = new BrowserDataStorage();
  }

  addBeforeDestroyListener(onBeforeDestroy) {
    const onBeforeUnload = (event) => {
      if (onBeforeDestroy()) {
        // Calling `event.preventDefault()` will cause a web browser
        // to show a generic "Ok"/"Cancel" modal with some generic text:
        // "Are you sure to leave the current page?".
        event.preventDefault();
      }
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }
}
