import getLocationUrl from '../../../getLocationUrl';

export default class ServerSideNavigationError extends Error {
  constructor(location) {
    super(
      location
        ? `Navigate to ${getLocationUrl(location)}`
        : 'Navigate to previous or next location',
    );

    if (location) {
      // Remove `operation` property from `location`.
      // eslint-disable-next-line no-unused-vars
      const { operation, ...locationBase } = location;
      this.location = locationBase;
    }
  }
}
