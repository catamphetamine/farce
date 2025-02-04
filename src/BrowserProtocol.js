import createPath from './createPath';

export default class BrowserProtocol {
  constructor() {
    this._keyPrefix = Math.random().toString(36).slice(2, 8);
    this._keyIndex = 0;

    this._index = null;
  }

  init() {
    const { origin, protocol, host, hostname, port, pathname, search, hash } =
      window.location;

    const { key, index = 0, state } = window.history.state || {};
    const delta = this._index != null ? index - this._index : 0;
    this._index = index;

    return {
      action: 'POP',
      origin,
      protocol,
      host,
      hostname,
      port,
      pathname,
      search,
      hash,
      key,
      index,
      delta,
      state,
    };
  }

  subscribe(listener) {
    const onPopState = () => {
      listener(this.init());
    };

    // TODO: On most versions of IE, we need a hashChange listener for hash-
    //  only changes.

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }

  navigate(location) {
    const { action, state } = location;

    const push = action === 'PUSH';

    if (!push && action !== 'REPLACE')
      throw Error(`Unrecognized browser protocol action: ${action}`);

    const delta = push ? 1 : 0;
    const extraState = this._createExtraState(delta);

    const browserState = { state, ...extraState };
    const path = createPath(location);

    if (push) {
      window.history.pushState(browserState, null, path);
    } else {
      window.history.replaceState(browserState, null, path);
    }

    return { ...location, ...extraState, delta };
  }

  go(delta) {
    window.history.go(delta);
  }

  createHref(location) {
    return createPath(location);
  }

  _createExtraState(delta) {
    const keyIndex = this._keyIndex++;
    this._index += delta;

    return {
      key: `${this._keyPrefix}:${keyIndex.toString(36)}`,
      index: this._index,
    };
  }
}
