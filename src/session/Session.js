import getLocationUrl from '../getLocationUrl.js';
import parseInputLocation from '../parseInputLocation.js';
import createSessionKey from './key/createSessionKey.js';
import Subscription from './subscription/Subscription.js';
import NavigationOutOfBoundsError from '../environment/navigation/error/NavigationOutOfBoundsError.js';
import NavigationOperations from '../environment/navigation/operation/operations.js';
import DataStorage from '../data-storage/DataStorage.js';

const DATA_STORAGE_NAMESPACE = 'navigation-stack-session'
const LOCATION_KEY_INDEX_DATA_STORAGE_KEY = 'location-key-index'

const INITIAL_KEY_INDEX = -1;
const INITIAL_INDEX = -1;

const INIT_LOCATION_DELTA = 0;

export default class Session {
  constructor(EnvironmentClass) {
    // Previously, `key` was used in a `WebBrowserSession` to uniquely identify a `session`
    // instance when storing data in a `WebBrowserDataStorage` which uses `window.sessionStorage`
    // under the hood, and the data in that storage exists until the browser tab is closed
    // and is shared between all pages that ever get opened in that tab and hosted at same HTTP origin.
    //
    // But then it was found out that restricting each `session` instance to its own isolated data
    // broke scroll position restoration after a page reload. And really, there wasn't any rationale
    // behind why shouldn't different `session` instances share the same data.
    //
    // So eventually, the use of `session.key` was removed from the `DataStorage` class.
    //
    // But then another requirement for uniqueness had to be met:
    // whenever a page is reloaded, it creates a new `session` instance with the
    // "next location ID" counter being reset to `0`, meaning that location IDs
    // would start repeating after a page reload, breaking the uniqueness contract.
    //
    // There could be a couple solutions to that issue:
    // * Prepend `session.key` to each `location.key`.
    //   This way, different `session` instances would produce different `location.key`s.
    // * Store the "next location ID" in the data storage that "survives" page reload.
    //   This way, a new `session` instance would "pick up" the counter from the previous one.
    //
    // Eventually, the latter solution was chosen just because it produces cleaner IDs.
    // But both are valid.
    //
    // The cons of choosing the latter solution would be that "data storage" concept
    // becomes mandatory to the "session" concept, but it doesn't look like a big thing
    // because currently all supported types of environment provide correct "data storage"
    // implementations, so it wouldn't restrict any current environment from being supported
    // in this package.
    //
    // this.key = createSessionKey();

    // Create an environment instance.
    this.environment = new EnvironmentClass();

    // Because location key index is stored in the "data storage",
    // create an instance of `DataStorage` class to read and write data.
    this._dataStorage = new DataStorage({
      dataStorage: this.environment.dataStorage,
      log: this.environment.log,
      namespace: DATA_STORAGE_NAMESPACE,
    });

    // Keeps a history of visited locations.
    //
    // It doesn't "survive" a page reload because it's a regular variable.
    // To "survive" a page reload, it could be stored in `this.environment.dataStorage`
    // but then it would introduce an unnecessary dependency on the "data storage"
    // while not really providing anything useful in terms of the public API.
    // I.e. what would be the point of exposing a public method `.getHistory()`
    // rather than just the mental satisfaction of feature-completeness
    // and "flexing" one's engineering erudition in public.
    //
    // For the reason above, it's only used in tests.
    //
    this._history = [];

    // `this._locationKeyIndex` is incremented every time the current location changes.
    // this._locationKeyIndex = INITIAL_KEY_INDEX;
    const locationKeyIndexBeforePageReload = this._dataStorage.get(LOCATION_KEY_INDEX_DATA_STORAGE_KEY);
    this._locationKeyIndex = typeof locationKeyIndexBeforePageReload === 'number'
      ? locationKeyIndexBeforePageReload
      : INITIAL_KEY_INDEX;

    // Current location.
    // It is only used in tests.
    this._currentLocation = undefined;

    // `this._currentLocationIndex` is the index of the top element in the navigation stack.
    // I.e. it's the index of the "current" location in the navigation stack.
    this._currentLocationIndex = INITIAL_INDEX;

    // The `index` of the terminal (rightmost) location in the navigation history.
    // In other words, this is the last location index that it can `.shift()` to.
    //
    // It doesn't "survive" a page reload because it's a regular variable.
    // To "survive" a page reload, it could be stored in `this.environment.dataStorage`
    // but then it would introduce an unnecessary dependency on the "data storage"
    // while not really providing anything useful in terms of the public API.
    // Yeah, validation of the maximum allowed location index to shift to
    // is a nice feature but it doesn't really add anything substantial
    // because the environment would've thrown an error anyway if the location index
    // being shifted to is too large. Receiving that type of "native" error
    // rather than a `NavigationOutOfBounds` error doesn't really change anything
    // in a real-world application.
    //
    // For the reason above, this property was commented out.
    //
    // this._terminalLocationIndex = this._currentLocationIndex;

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
            // Notify all subscribers about this "asynchronous" location change.
            notifySubscribers(location);
          },
          {
            getNextLocationKey: this._getNextLocationKey,
          },
        );
      },
    });

    // This subscription will be triggered in two cases:
    // * When reading initial location.
    // * Whenever the current location changes.
    this._unsubscribe = this.subscribe((location) => {
      // `this._currentLocation` is only used in tests.
      this._currentLocation = location;

      // Update `this._currentLocationIndex` when the location change was not initiated
      // by this session but rather by the user clicking "Back" or "Forward" button.
      this._currentLocationIndex = location.index;

      if (location.operation === NavigationOperations.PUSH) {
        // Trim the history of visited locations.
        this._history = this._history.slice(0, location.index);
      }

      // Update the history of visited locations.
      if (location.operation === NavigationOperations.INIT || location.operation === NavigationOperations.PUSH) {
        this._history.push(location)
      } else if (location.operation === NavigationOperations.REPLACE) {
        this._history[location.index] = location
      } else {
        // Replace the `location` on "shift" operation
        // because it now has different properties: `operation` and `delta`.
        this._history[location.index] = location
      }

      // Since `currentLocationIndex` has been updated, update `terminalLocationIndex`.
      // It's not really currently possible to see a "PUSH" or a "REPLACE" operation here,
      // but if it was possible, this call would be required. It would also be required
      // by `navigation` to call `session.getNextKey()` function to increment `locationKeyIndex`.
      //
      // `_terminalLocationIndex` property was commented out.
      //
      //   if (
      //     location.operation === NavigationOperations.PUSH ||
      //     location.operation === NavigationOperations.INIT
      //   ) {
      //     this._terminalLocationIndex = location.index;
      //   }
      // }

      this.environment.log.debug(
        'current location',
        'is',
        '"' + getLocationUrl(location) + '"',
        'index',
        location.index,
      );
    });
  }

  // Subscribes to changes in location.
  //
  // A subscription will be triggered in two cases:
  // * When reading initial location.
  // * Whenever the current location changes.
  //
  // The first subscriber is always the `Session`'s own internal listener:
  // it keeps the current location index variable value up-to-date.
  // Any additional application-specific listeners could be added, if required.
  //
  // Applications should prefer adding any such listeners by calling `NavigationStack.subscribe()`
  // method instead of calling `Session.subscribe()` directly in order to "normalize" the `location` argument:
  // the `location` argument exposed in a `NavigationStack.subscribe()` listener drops some internal-use properties.
  //
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

    // This new `key` will not necessarily be used:
    // if this `session` instance is created after a page reload,
    // the properties of the already-existing location from history
    // will be reused, and this new `key` will be discarded.
    // Discarding a `key` in situations like this is fine
    // because `key`s are not required to be sequential, unlike `index`es.
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
    if (index < 0) {
      throw new NavigationOutOfBoundsError(index);
    }

    // `_terminalLocationIndex` property was commented out.
    // if (index > this._terminalLocationIndex) {
    //   throw new NavigationOutOfBoundsError(index);
    // }

    // Navigate to the location.
    const locationResult = this.environment.navigation.shift({
      operation: NavigationOperations.SHIFT,
      index,
      delta,
    });

    if (locationResult) {
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

  _getNextLocationKey = () => {
    this._locationKeyIndex++;
    this._dataStorage.set(LOCATION_KEY_INDEX_DATA_STORAGE_KEY, this._locationKeyIndex);
    return this._locationKeyIndex.toString(36);
  }

  _isStarted() {
    return !this._stopped && this._currentLocationIndex !== INITIAL_INDEX;
  }
}
