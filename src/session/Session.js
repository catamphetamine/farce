import getLocationUrl from '../getLocationUrl.js';
import parseInputLocation from '../parseInputLocation.js';
import createSessionKey from './key/createSessionKey.js';
import Subscription from './subscription/Subscription.js';
import NavigationOutOfBoundsError from '../environment/navigation/error/NavigationOutOfBoundsError.js';
import NavigationOperations from '../environment/navigation/operation/operations.js';

const INITIAL_KEY_INDEX = -1;
const INITIAL_INDEX = -1;

const INIT_LOCATION_DELTA = 0;

export default class Session {
  constructor(EnvironmentClass) {
    // `key` is used in `WebBrowserSession` to uniquely identify a session
    // when storing data in a `WebBrowserDataStorage` which uses `window.sessionStorage`
    // under the hood, and `window.sessionStorage` is shared between different sessions.
    this.key = createSessionKey();

    // Create an environment instance.
    this.environment = new EnvironmentClass();

    // `this._locationKeyIndex` is incremented every time the current location changes.
    this._locationKeyIndex = INITIAL_KEY_INDEX;

    // `this._currentLocationIndex` is the index of the top element in the navigation stack.
    // I.e. it's the index of the "current" location in the navigation stack.
    this._currentLocationIndex = INITIAL_INDEX;

    // The `index` of the terminal (rightmost) location in the navigation history.
    // In other words, this is the last location index that it can `.shift()` to.
    this._terminalLocationIndex = this._currentLocationIndex;

    // Allows subscribing to location updates.
    //
    // Subscribing to location changes means subscribing to both "synchronous"
    // and "asynchronous" location changes.
    //
    // "synchronous" location changes happen immediately when the code triggers them.
    // These location changes are manually pushed to subscribers by calling
    // `.notifySubscribers()` method of `this._synchronousLocationChangesSubscription`.
    //
    this._synchronousLocationChangesSubscription = new Subscription();
    //
    // "asynchronous" location changes either happen after an arbitrary delay
    // or are even triggered from outside the code. These location changes should
    // themselves be subscribed to due to the "asynchoronous" nature of them.
    // So first the environment notifies `this._asynchronousLocationChangesSubscription`
    // about an "asynchronous" location change, and after that
    // `this._asynchronousLocationChangesSubscription` notifies all subscribers.
    //
    this._asynchronousLocationChangesSubscription = new Subscription({
      // Subscribe to "asynchronous" location changes.
      // The environment will trigger this subscription when location is changed "asynchronously".
      subscribe: (notifySubscribers) => {
        return this.environment.navigation.subscribeToAsyncrhonousLocationUpdates(
          (location) => {
            // `this._latestLocation` is only used in tests.
            this._latestLocation = location;
            // Notify all subscribers about this "asynchronous" location change.
            notifySubscribers(location);
          },
          {
            getNextLocationKey: this._getNextLocationKey,
          },
        );
      },
    });

    // This subscription is triggered in two cases:
    // * Set initial current location index at initial page load.
    // * Update current location index whenever a location change is not initiated
    //   by this session but rather by the user clicking "Back" or "Forward" button.
    this._unsubscribe = this.subscribe((location) => {
      // Update `this._currentLocationIndex` when the location change was not initiated
      // by this session but rather by the user clicking "Back" or "Forward" button.
      this._currentLocationIndex = location.index;
      // Since `currentLocationIndex` has been updated, update `terminalLocationIndex`.
      // It's not really currently possible to see a "PUSH" or a "REPLACE" operation here,
      // but if it was possible, this call would be required. It would also be required
      // by `navigation` to call `session.getNextKey()` function to increment `locationKeyIndex`.
      this._updateTerminalLocationIndex(location);

      this.environment.log.debug(
        'current location',
        'is',
        '"' + getLocationUrl(location) + '"',
        'index',
        this._currentLocationIndex,
      );
    });
  }

  // Subscribes to changes in location.
  // The first subscriber is always the `Session` itself:
  // its listener keeps the current location index up-to-date.
  // Any additional application-specific listeners could be added, if required.
  // Applications should prefer adding any such listeners by calling `NavigationStack.subscribe()`
  // method instead of calling this method directly, in order to "normalize" the `location` argument.
  subscribe(listener) {
    // Validates the state of things and then calls the listener.
    const onLocationDidChange = (location) => {
      if (
        !this._isStarted() &&
        location.operation !== NavigationOperations.INIT
      ) {
        this.environment.log.error('Unexpected location change', location);
        throw new Error('Not started');
      } else {
        // Call the listener.
        listener(location);
      }
    };

    const unsubscribeFromSynchronousLocationChanges =
      this._synchronousLocationChangesSubscription.subscribe(
        onLocationDidChange,
      );

    const unsubscribeFromAsynchronousLocationChanges =
      this._asynchronousLocationChangesSubscription.subscribe(
        onLocationDidChange,
      );

    return () => {
      unsubscribeFromSynchronousLocationChanges();
      unsubscribeFromAsynchronousLocationChanges();
    };
  }

  // Starts a navigation session.
  //
  // When run in a web browser, it could not only "start" a new session
  // but also "resume" a previously-started session. That could happen
  // when the user refreshes a page in a web browser which still retains
  // the previous session's data but at the same time restarts the javascript code
  // from scratch.
  //
  // So this `start()` method handles both cases: when there's previous session's data
  // that should be restored and when there's no previous session's data.
  //
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
      initialLocation = this.environment.navigation.getInitialLocation();
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

    this.environment.log.debug(
      '▶ start session',
      'at',
      '"' + getLocationUrl(initialLocation) + '"',
    );

    this._started = true;

    const key = this._getNextLocationKey();
    const index = INITIAL_INDEX + 1;
    const delta = INIT_LOCATION_DELTA;

    const locationResult = this.environment.navigation.init(initialLocation, {
      operation: NavigationOperations.INIT,
      key,
      index,
      delta,
    });

    if (locationResult) {
      // `this._latestLocation` is only used in tests.
      this._latestLocation = locationResult;
      // Notify all subscribers about this "synchronous" location change.
      this._synchronousLocationChangesSubscription.notifySubscribers(
        locationResult,
      );
    }
  }

  stop() {
    if (this._stopped) {
      throw Error('Already stopped');
    }

    this.environment.log.debug('⏹ stop session');

    // Once stopped, it won't be able to be restarted.
    this._stopped = true;

    // Remove location change subscription.
    this._unsubscribe();

    // Even if the session itself unsubscribes from location changes,
    // any other existing subscriptions would still stay.
    // For example, those could be some additional subscriptions
    // created in the application code.
    // So all those subscriptions should be removed too.
    this._synchronousLocationChangesSubscription.stop();
    this._asynchronousLocationChangesSubscription.stop();
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

    this.environment.log.debug(
      operation === NavigationOperations.PUSH ? '↓' : '⇅',
      operation,
      '"' + getLocationUrl(location) + '"',
      'index',
      index,
    );

    // Navigate to the location.
    const locationResult = this.environment.navigation.navigate(location, {
      operation,
      key,
      index,
      delta,
    });

    if (locationResult) {
      // `this._latestLocation` is only used in tests.
      this._latestLocation = locationResult;
      // Notify all subscribers about this "synchronous" location change.
      this._synchronousLocationChangesSubscription.notifySubscribers(
        locationResult,
      );
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

    this.environment.log.debug(
      delta > 0 ? '→' : '←',
      'shift',
      delta,
      'index',
      index,
    );

    // Validate that the new `index` is not out of bounds.
    if (index < 0 || index > this._terminalLocationIndex) {
      throw new NavigationOutOfBoundsError(index);
    }

    // Navigate to the location.
    const locationResult = this.environment.navigation.shift({
      operation: NavigationOperations.SHIFT,
      index,
      delta,
    });

    if (locationResult) {
      // `this._latestLocation` is only used in tests.
      this._latestLocation = locationResult;
      // Notify all subscribers about this "synchronous" location change.
      this._synchronousLocationChangesSubscription.notifySubscribers(
        locationResult,
      );
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

  _getNextLocationKey = () => {
    this._locationKeyIndex++;
    return this._locationKeyIndex.toString(36);
  }

  _isStarted() {
    return !this._stopped && this._currentLocationIndex !== INITIAL_INDEX;
  }
}
