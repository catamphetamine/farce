export default class DataStorage {
  constructor(session, { namespace }) {
    if (!session.key) {
      throw new Error('`DataStorage` requires a `session.key`');
    }
    this._sessionKey = session.key;
    this._log = session.environment.log;
    this._dataStorage = session.environment.dataStorage;
    this._namespace = namespace;
  }

  get(key) {
    const storageKey = this._getStorageKey(key);

    try {
      const value = this._dataStorage.get(storageKey);
      // === null is probably sufficient.
      if (value === null) {
        return undefined;
      }

      // We want to catch JSON parse errors in case someone separately threw
      // junk into sessionStorage under our namespace.
      return JSON.parse(value);
    } catch (error) {
      this._log.error('[navigation-stack] Could not read data from storage');
      this._log.error(error);

      // Pretend that the entry doesn't exist.
      return undefined;
    }
  }

  set(key, value) {
    const storageKey = this._getStorageKey(key);

    if (value === undefined) {
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
    return `${this._sessionKey}|${this.namespace}|${key}`;
  }
}
