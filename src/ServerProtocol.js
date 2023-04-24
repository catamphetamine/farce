import createPath from './createPath';
import ensureLocation from './ensureLocation';

function noop() {}

export default class ServerProtocol {
  constructor({ url, origin }) {
    this._location = ensureLocation(url, { origin });
  }

  init() {
    return {
      action: 'POP',
      ...this._location,
    };
  }

  subscribe() {
    // Server protocol emits no events.
    return noop;
  }

  createHref(location) {
    return createPath(location);
  }

  // The other methods are not implemented, because ServerProtocol instances
  // cannot navigate.
}
