import parseInputLocation from '../parseInputLocation';
import createSessionKey from './key/createSessionKey';
import Subscription from './subscription/Subscription';
import NavigationOutOfBoundsError from '../environment/navigation/error/NavigationOutOfBoundsError';
import NavigationOperations from '../environment/navigation/operation/operations';

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
    this._subscription = new Subscription();

    // Subscribing to location changes means subscribing to both "synchronous"
    // and "asynchronous" location changes. "synchronous" location changes
    // happen immediately when the code triggers them."asynchronous" location changes
    // either happen after an arbitrary delay or are even triggered from outside the code.
    //
    // Subscribing to "asynchronous" location changes is not necessary when
    // there're no actual subscribers, in order to not unnecessarily "waste" any resources.
    // Of course, this statement is rather far-fetched and in reality no one would ever tell any difference.
    // Still, I felt like randomly introducing this seemingly unnecessary minor optimization.
    //
    // So it only subscribes to "asynchronous" location changes if there's at least one active subscriber.
    // And in case all subscribers get unsubscribed, it will unsubscribe from "asynchronous" location changes too.
    // One might think of it as some form of "mental masturbation", but what can I do — I already wrote the code.
    //
    this._subscription.onFirstSubscriber(() => {
      return this.environment.navigation.subscribeToAsyncrhonousLocationUpdates(
        (location) => {
          // Notify all subscribers about this "asynchronous" location change.
          this._subscription.notifySubscribers(location);
        },
      );
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
        location.pathname,
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
    return this._subscription.subscribe((location) => {
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
    });
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

    this.environment.log.debug('▶ start session', initialLocation.pathname);

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
      // Notify all subscribers about this "synchronous" location change.
      this._subscription.notifySubscribers(locationResult);
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

    this.environment.log.debug(
      operation === NavigationOperations.PUSH ? '↓' : '⇅',
      operation,
      location.pathname,
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
      // Notify all subscribers about this "synchronous" location change.
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
      // Notify all subscribers about this "synchronous" location change.
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
