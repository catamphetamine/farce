export default class InMemoryDataStorage {
  constructor() {
    this._state = {};
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
  }

  set(key, value) {
    this._state[key] = value;
  }
}
