/* eslint-disable no-underscore-dangle, max-classes-per-file */

import ServerSideRedirectError from './error/ServerSideRedirectError';

export default class ServerSideNavigation {
  init(initialLocation, { operation, key, index, delta }) {
    return {
      ...initialLocation,
      operation,
      key,
      index,
      delta,
    };
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
  subscribeToAsyncrhonousLocationUpdates(listener) {
    // `ServerSideNavigation` location changes are prohibited, so they couldn't happen.
    // Hence, this function doesn't have to "subscribe" to anything, so it's a "no op".
    return () => {};
  }

  // eslint-disable-next-line no-unused-vars
  navigate(location, { operation, key, index, delta }) {
    throw new ServerSideRedirectError(location);
  }

  // eslint-disable-next-line no-unused-vars
  shift({ operation, index, delta }) {
    // It's not supposed to ever get to this code.
    // * If `delta` is `0` then it's a "do nothing" scenario and `Session` won't even call this code.
    // * If `delta` is not `0` and is out of bounds then a `NavigationOutOfBoundsError` will be thrown.
    // * If `delta` is not `0` and is not out of bounds then it implies that a valid navigation has happened before
    //   which can't be the case because no navigation is possible on server side without throwing an error.
    throw new Error('Server side has no navigation history');
  }

  getInitialLocation() {
    return undefined;
  }
}
