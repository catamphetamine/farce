/* eslint-disable max-classes-per-file */

import normalizeInputLocation from '../normalizeInputLocation';

function noop() {}

function serverSideNavigationNotPossible() {
  throw new Error('Server-side navigation is not possible');
}

class ServerNavigation {
  constructor(initialLocation) {
    this._location = normalizeInputLocation(initialLocation);
  }

  init() {
    return {
      action: 'INIT',
      ...this._location,
      index: 0,
      key: '0',
    };
  }

  subscribe() {
    // Server-side environment emits no location subscription events.
    return noop;
  }

  // Navigation methods are not implemented, because `ServerSession` instances
  // cannot navigate.
  navigate() {
    serverSideNavigationNotPossible();
  }

  // Navigation methods are not implemented, because `ServerSession` instances
  // cannot navigate.
  shift() {
    serverSideNavigationNotPossible();
  }
}

class ServerDataStorage {
  // It doesn't seem to make any sense to store anything on server side.
  // Hence, state management methods are "no op" stubs.
  get() {
    return null;
  }

  remove() {}

  set() {}
}

export default class ServerSession {
  constructor(initialLocation) {
    this.navigation = new ServerNavigation(initialLocation);
    this.dataStorage = new ServerDataStorage();
  }

  // "Before destroy" listeners are currently ignored.
  // If required, one could implement a `_destroy()` method
  // and there check that the listeners actually do get called.
  addBeforeDestroyListener() {
    return noop;
  }
}
