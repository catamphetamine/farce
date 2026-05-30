export default class DataStorage {
  constructor({ dataStorage, log, namespace }) {
    // Previously, it used to prepend `session.key` to every key
    // both when reading and writing data so that no two `session`s
    // could possibly share any data, which also avoided any collisions.
    //
    // Later, it was found out that reloading a page in a web browser
    // creates a new `session` instance, having a different `session.key`,
    // and this new `session` is unable to get access to the previously-saved
    // scroll positions of the previously-visited locations.
    //
    // The solution was to stop prepending `session.key` to every key
    // and allow all `session` instances to read and write each other's data.
    //
    // if (!session.key) {
    //   throw new Error('`DataStorage` requires a `session.key`');
    // }
    // this._sessionKey = session.key;

    this._log = log;
    this._dataStorage = dataStorage;
    this._namespace = namespace;
  }

  /**
   * Returns a value for a given key.
   * @param {string} key
   * @returns {(any|null)} Returns `null` if the value is absent.
   */
  get(key) {
    const storageKey = this._getStorageKey(key);

    try {
      const value = this._dataStorage.get(storageKey);
      if (value === undefined || value === null) {
        return null;
      }

      // Ignore any JSON parse errors in case some other code accidentally
      // wrote some kind of different data directly to the data storage
      // under the same key.
      return JSON.parse(value);
    } catch (error) {
      this._log.error('[navigation-stack] Could not read data from storage');
      this._log.error(error);

      // Pretend that the entry doesn't exist.
      return null;
    }
  }

  set(key, value) {
    const storageKey = this._getStorageKey(key);

    if (value === undefined || value === null) {
      try {
        this._dataStorage.remove(storageKey);
      } catch (error) {
        // No need to handle errors here.
        this._log.error(
          '[navigation-stack] Could not delete data from storage',
        );
        this._log.error(error);
      }

      return;
    }

    // Unlike with read, we want to fail on invalid values here, since the
    // value here is provided by the caller of this method.
    const valueString = JSON.stringify(value);

    try {
      this._dataStorage.set(storageKey, valueString);
    } catch (error) {
      // No need to handle errors here either. If it didn't work, it didn't
      // work. We make no guarantees about actually saving the value.
      this._log.error('[navigation-stack] Could not save data in storage');
      this._log.error(error);
    }
  }

  // It could also implement a method that would clean up any data written so far,
  // but so far it doesn't seem to be required by any real-world use case.
  // cleanUp() {}

  _getStorageKey(key) {
    // return `${this._sessionKey}|${this.namespace}|${key}`;
    return `${this.namespace}|${key}`;
  }
}
