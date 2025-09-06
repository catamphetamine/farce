/* eslint-disable no-underscore-dangle, max-classes-per-file */

import ServerSideNavigationError from './error/ServerSideNavigationError';

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

  // eslint-disable-next-line no-unused-vars
  subscribe(listener) {
    // `ServerSideNavigation` doesn't have any "asynchronycity" about it
    // and any navigation is prohibited and would result in an error.
    // So no asynchronous listener would ever be called
    // due to no asynchronous events being dispatched.
    return () => {};
  }

  // eslint-disable-next-line no-unused-vars
  navigate(location, { operation, key, index, delta }) {
    throw new ServerSideNavigationError(location);
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
