/* eslint-disable max-classes-per-file */

import normalizeInputLocation from '../normalizeInputLocation';

// eslint-disable-next-line no-underscore-dangle
function _loadState(load, isValidLoadedData) {
  try {
    const data = JSON.parse(load());

    // Check that the stack and index at least seem reasonable before using
    // them as state. This isn't foolproof, but it might prevent mistakes.
    // Also perform a basic validation of `state`.
    if (isValidLoadedData(data)) {
      return data;
    }
  } catch (error) {} // eslint-disable-line no-empty

  return null;
}

// eslint-disable-next-line no-underscore-dangle
function _saveState(save, data) {
  try {
    save(JSON.stringify(data));
  } catch (error) {} // eslint-disable-line no-empty
}

class MemoryNavigation {
  constructor(initialLocation, { save, load } = {}) {
    this._save = save;

    this._keyPrefix = Date.now().toString(36);
    this._keyIndex = 0;

    this._subscriptionListener = null;

    const initialState = load
      ? _loadState(load, this._isValidLoadedData)
      : null;
    if (initialState) {
      this._stack = initialState.stack;
      this._index = initialState.index;
    } else {
      this._stack = [
        {
          ...normalizeInputLocation(initialLocation),
          key: this._getNextKey(),
        },
      ];
      this._index = 0;
    }
  }

  _isValidLoadedData({ stack, index }) {
    // Check that the `stack` and `index` at least seem reasonable before using them.
    // This isn't foolproof, but it might prevent mistakes.
    return Array.isArray(stack) && typeof index === 'number' && stack[index];
  }

  init() {
    return this._createLocationObject({ action: 'INIT', delta: 0 });
  }

  subscribe(listener) {
    this._subscriptionListener = listener;

    return () => {
      this._subscriptionListener = null;
    };
  }

  navigate(location) {
    const { action, pathname, search, query, hash, state } = location;

    if (action !== 'PUSH' && action !== 'REPLACE') {
      throw Error(`Unrecognized browser session action: ${action}`);
    }

    const delta = action === 'PUSH' ? 1 : 0;
    this._index += delta;

    const key = this._getNextKey();

    this._stack[this._index] = { pathname, search, query, hash, state, key };
    if (action === 'PUSH') {
      this._stack.length = this._index + 1;
    }

    if (this._save) {
      _saveState(this._save, {
        stack: this._stack,
        index: this._index,
      });
    }

    return { ...location, key, index: this._index, delta };
  }

  shift(delta) {
    const prevIndex = this._index;

    this._index = Math.min(
      Math.max(this._index + delta, 0),
      this._stack.length - 1,
    );

    if (this._index === prevIndex) {
      return;
    }

    if (this._save) {
      _saveState(this._save, {
        stack: this._stack,
        index: this._index,
      });
    }

    if (this._subscriptionListener) {
      this._subscriptionListener(
        this._createLocationObject({
          action: 'SHIFT',
          delta: this._index - prevIndex,
        }),
      );
    }
  }

  _getNextKey() {
    const key = `${this._keyPrefix}.${this._keyIndex.toString(36)}`;
    this._keyIndex++;
    return key;
  }

  _createLocationObject({ action, delta }) {
    return {
      ...this._stack[this._index],
      action,
      index: this._index,
      delta,
    };
  }
}

class MemoryDataStorage {
  constructor({ load, save } = {}) {
    this._save = save;

    const initialState = load
      ? _loadState(load, this._isValidLoadedData)
      : null;
    if (initialState) {
      this._state = initialState.state;
    } else {
      this._state = {};
    }
  }

  // Returns either a `string` value or `null` if the key doesn't exist.
  get(key) {
    if (key in this._state) {
      return this._state[key];
    }
    return null;
  }

  remove(key) {
    if (key in this._state) {
      delete this._state[key];
    }

    if (this._save) {
      _saveState(this._save, {
        state: this._state,
      });
    }
  }

  set(key, value) {
    this._state[key] = value;

    if (this._save) {
      _saveState(this._save, {
        state: this._state,
      });
    }
  }

  _isValidLoadedData({ state }) {
    // Perform a basic validation of `state`.
    return typeof state === 'object' && state !== null;
  }
}

function createNestedStateSaveLoadFunctions({ save, load }, key) {
  return {
    save: save ? (data) => save(key, data) : undefined,
    load: load ? () => load(key) : undefined,
  };
}

export default class MemorySession {
  constructor(initialLocation, { save, load } = {}) {
    this.navigation = new MemoryNavigation(
      initialLocation,
      createNestedStateSaveLoadFunctions({ save, load }, 'navigation'),
    );
    this.dataStorage = new MemoryDataStorage(
      createNestedStateSaveLoadFunctions({ save, load }, 'dataStorage'),
    );
  }

  // "Before destroy" listeners are currently ignored.
  // If required, one could implement a `_destroy()` method
  // and there check that the listeners actually do get called.
  // eslint-disable-next-line no-unused-vars
  addBeforeDestroyListener(listener) {
    return () => {};
  }
}
