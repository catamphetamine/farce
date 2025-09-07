import debug from '../debug';
import parseInputLocation from '../parseInputLocation';
import createSessionKey from './key/createSessionKey';
import NavigationOutOfBoundsError from './navigation/error/NavigationOutOfBoundsError';
import NavigationOperations from './navigation/operation/operations';
import Subscription from './subscription/Subscription';

const INITIAL_KEY_INDEX = -1;
const INITIAL_INDEX = -1;

const INIT_LOCATION_DELTA = 0;

export default class Session {
  constructor({ navigation }) {
    // `key` is used in `WebBrowserSession` to uniquely identify a session
    // when storing data in a `WebBrowserDataStorage` which uses `window.sessionStorage`
    // under the hood, and `window.sessionStorage` is shared between different sessions.
    this.key = createSessionKey();

    // `this._locationKeyIndex` is incremented every time the current location changes.
    this._locationKeyIndex = INITIAL_KEY_INDEX;

    // `this._currentLocationIndex` is the index of the top element in the navigation stack.
    // I.e. it's the index of the "current" location in the navigation stack.
    this._currentLocationIndex = INITIAL_INDEX;

    // The `index` of the terminal (rightmost) location in the navigation history.
    // In other words, this is the last location index that it can `.shift()` to.
    this._terminalLocationIndex = this._currentLocationIndex;

    // Create `navigation`.
    this._navigation = navigation;

    // Manages subscriptions.
    this._subscription = new Subscription({
      activateSubscription: (listener) => {
        return this._navigation.subscribe(listener);
      },
    });

    // Update current location index when a location change was not initiated
    // by this session but rather by the user clicking "Back" or "Forward" button.
    this._unsubscribe = this.subscribe((location) => {
      // Update `this._currentLocationIndex` when the location change was not initiated
      // by this session but rather by the user clicking "Back" or "Forward" button.
      this._currentLocationIndex = location.index;
      // Since `currentLocationIndex` has been updated, update `terminalLocationIndex`.
      // It's not really currently possible to see a "PUSH" or a "REPLACE" operation here,
      // but if it was possible, this call would be required. It would also be required
      // by `navigation` to call `session.getNextKey()` function to increment `locationKeyIndex`.
      this._updateTerminalLocationIndex(location);

      debug(
        'current location',
        location.pathname,
        'index',
        this._currentLocationIndex,
      );
    });
  }

  // Subscribes to changes in location.
  subscribe(listener) {
    return this._subscription.subscribe((location) => {
      if (
        !this._isStarted() &&
        location.operation !== NavigationOperations.INIT
      ) {
        // eslint-disable-next-line no-console
        console.error('Unexpected location change', location);
        throw new Error('Not started');
      } else {
        // Call the listener.
        listener(location);
      }
    });
  }

  start(initialLocation) {
    if (this._stopped) {
      throw new Error('Can not be restarted');
    }

    // Simplify "developer experience" by automatically calling
    // `.init(initialLocation)` in case of using a `WebBrowserSession`.
    //
    // That's because `WebBrowserSession` environment already knows
    // the initial location by the time javascript code starts execution.
    //
    if (!initialLocation) {
      initialLocation = this._navigation.getInitialLocation();
      if (initialLocation) {
        initialLocation = parseInputLocation(initialLocation);
      }
    }

    if (!initialLocation) {
      throw new Error('`initialLocation` is required');
    }

    if (this._currentLocationIndex !== INITIAL_INDEX) {
      throw new Error('Already started');
    }

    debug('▶ start session', initialLocation.pathname);

    this._started = true;

    const key = this._getNextLocationKey();
    const index = INITIAL_INDEX + 1;
    const delta = INIT_LOCATION_DELTA;

    const locationResult = this._navigation.init(initialLocation, {
      operation: NavigationOperations.INIT,
      key,
      index,
      delta,
    });

    if (locationResult) {
      this._subscription.notifySubscribers(locationResult);
    }
  }

  stop() {
    if (this._stopped) {
      throw Error('Already stopped');
    }

    debug('⏹ stop session');

    // Once stopped, it won't be able to be restarted.
    this._stopped = true;

    // Remove location change subscription.
    this._unsubscribe();

    // Even if it calls `unsubscribe()` function above, any other subscriptions
    // would still stay. For example, subscriptions created by the application code.
    // To work around that, `.stop()` function removes all subscriptions.
    this._subscription.stop();
  }

  navigate(operation, location) {
    if (!this._isStarted()) {
      throw Error('Not started');
    }

    if (
      operation !== NavigationOperations.PUSH &&
      operation !== NavigationOperations.REPLACE
    ) {
      throw Error(`Unknown navigation operation: ${operation}`);
    }

    const delta = operation === NavigationOperations.PUSH ? 1 : 0;

    this._updateTerminalLocationIndex({ operation });

    const key = this._getNextLocationKey();
    const index = this._currentLocationIndex + delta;

    debug(
      operation === NavigationOperations.PUSH ? '↓' : '⇅',
      operation,
      location.pathname,
      'index',
      index,
    );

    // Navigate to the location.
    const locationResult = this._navigation.navigate(location, {
      operation,
      key,
      index,
      delta,
    });

    if (locationResult) {
      this._subscription.notifySubscribers(locationResult);
    }
  }

  shift(delta) {
    if (!this._isStarted()) {
      throw Error('Not started');
    }

    // If there'll be no navigation, return.
    if (delta === 0) {
      return;
    }

    const index = this._currentLocationIndex + delta;

    debug(delta > 0 ? '→' : '←', 'shift', delta, 'index', index);

    // Validate that the new `index` is not out of bounds.
    if (index < 0 || index > this._terminalLocationIndex) {
      throw new NavigationOutOfBoundsError(index);
    }

    // Navigate to the location.
    const locationResult = this._navigation.shift({
      operation: NavigationOperations.SHIFT,
      index,
      delta,
    });

    if (locationResult) {
      this._subscription.notifySubscribers(locationResult);
    }
  }

  // This function is used by navigation.
  _getCurrentLocationIndex = () => {
    return this._currentLocationIndex;
  };

  _updateTerminalLocationIndex({ operation }) {
    // A `PUSH` navigation sets a new terminal (rightmost) location.
    if (
      operation === NavigationOperations.PUSH ||
      operation === NavigationOperations.INIT
    ) {
      this._terminalLocationIndex = this._currentLocationIndex;
    }
  }

  _getNextLocationKey() {
    this._locationKeyIndex++;
    return this._locationKeyIndex.toString(36);
  }

  _isStarted() {
    return !this._stopped && this._currentLocationIndex !== INITIAL_INDEX;
  }
}
