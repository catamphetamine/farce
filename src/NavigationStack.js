import { addBasePath, removeBasePath } from './basePath.js';
import LocationDataStorage from './data-storage/LocationDataStorage.js';
import getLocationFromInternalLocation from './getLocationFromInternalLocation.js';
import isPromise from './isPromise.js';
import {
  addNavigationBlocker,
  removeAllNavigationBlockers,
} from './navigationBlockers.js';
import {
  blockNonProgrammaticNavigationIfRequired,
  blockProgrammaticNavigationIfRequired,
} from './navigationBlockersEvaluation.js';
import parseInputLocation from './parseInputLocation.js';
import ScrollPositionRestoration from './scroll-position/ScrollPositionRestoration.js';
import Session from './session/Session.js';

export default class NavigationStack {
  constructor(
    Environment,
    { basePath, manageScrollPosition, scrollPositionSetter } = {},
  ) {
    // Create a session.
    this._session = new Session(Environment);

    // Base path, if used.
    this._basePath = basePath;

    // Create location data storage.
    this.dataStorage = new LocationDataStorage(this._session, {
      namespace: 'navigation-stack',
    });

    // Allows temporarily ignoring location update events when set to `true`.
    this._ignoreLocationUpdates = false;

    // Subscribe to location updates.
    // * Ignores location updates if `_ignoreLocationUpdates` flag is temporarily set.
    // * Runs navigation blockers to see if the location update should be reverted.
    // * Updates `this._location` if the update wasn't ignored or blocked.
    this._unsubscribe = this._session.subscribe((location) => {
      // If this location update shouldn't be temporarily ignored.
      if (!this._ignoreLocationUpdates) {
        // Remove `basePath` from `location`.
        location = removeBasePath(location, this._basePath);

        // See if the location update should've been blocked.
        // If it should've, it will automatically "rewind" it.
        const result = blockNonProgrammaticNavigationIfRequired(
          location,
          this._session,
          this._doAndIgnoreLocationUpdates,
        );

        const onResult = (blocked) => {
          if (!blocked) {
            // Update `this._location`.
            // Since it's gonna be returned from the public `this.current()` method,
            // convert it from `LocationInternal` to `Location`.
            this._location = getLocationFromInternalLocation(location);
          }
        };

        if (isPromise(result)) {
          result.then(onResult);
        } else {
          onResult(result);
        }
      }
    });

    // Create `ScrollPositionRestoration`.
    if (manageScrollPosition) {
      this._scrollPositionRestoration = new ScrollPositionRestoration(
        this._session,
        // Custom `ScrollPositionSetter`.
        { scrollPositionSetter },
      );
    }
  }

  // Subscribes to any changes of the current location.
  // The first subscriber is always the `NavigationStack` itself
  // because its listener is what drives the actual navigation.
  // Any additional application-specific listeners could be added, if required.
  subscribe(listener) {
    // `NavigationStack.subscribe()` is simply a proxy to `Session.subscribe()`
    // with the only convenience feature that it "normalizes" the `location` argument.
    return this._session.subscribe((locationInternal) => {
      listener(getLocationFromInternalLocation(locationInternal));
    });
  }

  addNavigationBlocker(blocker) {
    return addNavigationBlocker(this._session, blocker);
  }

  addScrollableContainer(scrollableContainerKey, scrollableContainer) {
    if (!this._scrollPositionRestoration) {
      throw new Error('`manageScrollPosition: true` option not passed');
    }
    return this._scrollPositionRestoration.addScrollableContainer(
      scrollableContainerKey,
      scrollableContainer,
    );
  }

  // This function could potentially be exposed but there seems to be no use for it.
  //
  // getEntries() {
  //   return this._session._history.map(getLocationFromInternalLocation);
  // }

  // This function could potentially be exposed but there seems to be no use for it.
  //
  // getSavedScrollPositionForLocation(location, scrollableContainerKey) {
  //   if (!this._scrollPositionRestoration) {
  //     throw new Error('`manageScrollPosition: true` option not passed');
  //   }
  //   return this._scrollPositionRestoration._getSavedScrollPositionForLocation(location, scrollableContainerKey)
  // }

  init(initialLocation) {
    if (this._location) {
      throw new Error('Already initialized');
    }

    this._session.start(
      initialLocation && this._parseInputLocation(initialLocation),
    );

    if (this._scrollPositionRestoration) {
      this._scrollPositionRestoration.start();
    }
  }

  current() {
    // TypeScript definition of the `.current()` method tells that it always returns
    // some non-`undefined` location.
    // But `this._location` is `undefined` until `.init(initialLocation?)` is called.
    // To work around that limitation, it simply throws if `.current()` is called before `.init()`.
    if (!this._location) {
      throw new Error('Not initialized');
    }
    return this._location;
  }

  push(location) {
    this._navigate('push', location);
  }

  replace(location) {
    this._navigate('replace', location);
  }

  _navigate(operation, location) {
    const toLocation = this._parseInputLocation(location);

    const result = blockProgrammaticNavigationIfRequired(
      toLocation,
      this._session,
    );

    const onResult = (blocked) => {
      if (!blocked) {
        this._session.navigate(operation, toLocation);
      }
    };

    if (isPromise(result)) {
      result.then(onResult);
    } else {
      onResult(result);
    }
  }

  shift(delta) {
    this._session.shift(delta);
  }

  stop() {
    if (!this._unsubscribe) {
      throw new Error('Already stopped');
    }

    this._unsubscribe();
    this._unsubscribe = undefined;

    // Even if it calls `unsubscribe()` function above, any other subscriptions
    // would still stay. We're not talking about `navigationStack.subscribe()`
    // subscriptions because those don't really matter in terms of cleaning them up:
    // those're just Redux store subscriptions that don't have any side effects.
    // Subscriptions we're talking here are `Session`'s own subscription
    // via `session.subscribe()` and any hypothetical manual `session.subscribe()`
    // calls that could be made by the application code for whatever purpose.
    // Both of those should be cleared.
    // To work around that, `.stop()` function removes all subscriptions.
    this._session.stop();

    removeAllNavigationBlockers(this._session);

    if (this._scrollPositionRestoration) {
      this._scrollPositionRestoration.stop();
    }
  }

  locationRendered(location) {
    if (!this._scrollPositionRestoration) {
      throw new Error('`manageScrollPosition: true` option not passed');
    }
    return this._scrollPositionRestoration.locationRendered(location);
  }

  _parseInputLocation(inputLocation) {
    // Parse input location (string or incomplete object) to a proper `location` object.
    // Add `basePath` to `location`.
    return addBasePath(parseInputLocation(inputLocation), this._basePath);
  }

  // Allows temporarily ignoring location update events.
  _doAndIgnoreLocationUpdates = (func) => {
    this._ignoreLocationUpdates = true;
    func();
    this._ignoreLocationUpdates = false;
  };
}
