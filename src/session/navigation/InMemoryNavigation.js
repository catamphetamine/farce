import parseInputLocation from '../../parseInputLocation';

export default class InMemoryNavigation {
  constructor() {
    // A stack of `LocationBase` objects.
    this._stack = [];
  }

  // eslint-disable-next-line no-unused-vars
  subscribe(listener) {
    // `InMemoryNavigation` doesn't have any "asynchronycity" about it
    // and performs any navigation immediately at the time of the call.
    // Hence, no asynchronous listener would ever be called
    // due to no asynchronous events being dispatched.
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
