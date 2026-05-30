import parseInputLocation from '../../parseInputLocation.js';

export default class InMemoryNavigation {
  constructor() {
    // A stack of `LocationBase` objects.
    this._stack = [];
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
  // eslint-disable-next-line no-unused-vars
  subscribeToAsyncrhonousLocationUpdates(listener, { getNextLocationKey }) {
    // `InMemoryNavigation` location changes are always "synchronous"
    // with the code that initiated such changes, i.e. it always performs
    // any navigation immediately at the time such navigation is triggered in code.
    // Hence, this function doesn't have to "subscribe" to anything, so it's a "no op".
    return () => {};
  }

  init(initialLocation, { operation, key, index, delta }) {
    this._stack.push({
      location: parseInputLocation(initialLocation),
      key,
    });

    return this._createLocationObject({
      operation,
      index,
      delta,
    });
  }

  navigate(location, { operation, key, index, delta }) {
    const { pathname, search, query, hash } = location;

    this._stack[index] = {
      location: { pathname, search, query, hash },
      key,
    };

    // A `PUSH` navigation sets a new terminal (rightmost) location.
    if (delta === 1) {
      // Trim the location stack by removing any previous location history
      // that might've existed after the current index.
      this._stack.length = index + 1;
    }

    return {
      ...location,
      key,
      operation,
      index,
      delta,
    };
  }

  shift({ operation, index, delta }) {
    // Validate the `index`.
    // Because `session._terminalLocationIndex` property was commented out,
    // this validation had to be moved here from the `Session` class.
    if (index >= this._stack.length) {
      throw new Error('out of navigation history bounds')
    }
    return this._createLocationObject({
      operation,
      index,
      delta,
    });
  }

  getInitialLocation() {
    return undefined;
  }

  _createLocationObject({ operation, index, delta }) {
    const { location, key } = this._stack[index];

    return {
      ...location,
      key,
      operation,
      index,
      delta,
    };
  }
}
