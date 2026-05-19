import DataStorage from './DataStorage.js';
import getLocationUrl from '../getLocationUrl.js';

export default class LocationDataStorage {
  constructor(session, { namespace }) {
    this._storage = new DataStorage(session, { namespace });

    this._getFallbackLocationKey = getLocationUrl;
  }

  get(location, key) {
    return this._storage.get(this._getKey(location, key));
  }

  set(location, key, value) {
    this._storage.set(this._getKey(location, key), value);
  }

  _getKey(location, key) {
    const locationKey = location.key || this._getFallbackLocationKey(location);
    return `${locationKey}|${key}`;
  }
}
