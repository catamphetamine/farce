export default class Subscription {
  constructor() {
    // This property is accessed in tests.
    this._listeners = [];

    // These listeners will be called when the subscription enters "active" or "inactive" state.
    // A subscription enters "active" state when it has at least one listener rather than zero.
    // A subscription enters "inactive" state when it has no more listeners.
    this._subscriptionActiveStateListeners = [];
    this._subscriptionInactiveStateListeners = [];
  }

  // Adds a subscription active state listener.
  // Returns a function that removes the subscription active state listener.
  onFirstSubscriber(activeStateListener) {
    this._subscriptionActiveStateListeners.push(activeStateListener);
    // Return a function that removes the subscription active state listener.
    return () => {
      this._subscriptionActiveStateListeners =
        this._subscriptionActiveStateListeners.filter(
          (_) => _ !== activeStateListener,
        );
    };
  }

  notifySubscribers(argument) {
    // `._latest` is only used in tests.
    this._latest = argument;
    for (const { listener } of this._listeners) {
      listener(argument);
    }
  }

  subscribe(listener) {
    // If subscriptions are stopped, i.e. no new subscriptions are to be added,
    // then don't add any listeners and return a "do nothing" function.
    if (this._stopped) {
      return () => {};
    }

    // Creating a `listenerEntry` object ensures that the `.filter()` function
    // during "unsubscribe" step doesn't accidentally remove another listeners
    // having the same `listener` function.
    // I.e. it's not illegal to call `.subscribe(listener)` multiple times
    // with the same argument, and those would be considered different subscriptions.
    const listenerEntry = { listener };

    // If it's the first listener, activate subscription.
    if (this._listeners.length === 0) {
      // Run all subscription active state listeners.
      // The functions returned from those will become subscription inactive state listeners.
      this._subscriptionInactiveStateListeners =
        this._subscriptionActiveStateListeners.map((activeStateListener) =>
          activeStateListener(),
        );
    }

    // Add the `listener` to the list.
    this._listeners.push(listenerEntry);

    // The returned `unsubscribe()` function is "idempotent", i.e. it can be called multiple times.
    return () => {
      // Remove the listener, if not already removed.
      this._removeListener(listenerEntry);
    };
  }

  stop() {
    if (this._stopped) {
      throw new Error('Already stopped');
    }

    this._stopped = true;

    // Clear any remaining listeners.
    for (const listener of this._listeners.slice()) {
      this._removeListener(listener);
    }
  }

  _removeListener(listenerEntry) {
    // If no listeners are left, no need to do anything.
    if (this._listeners.length === 0) {
      return;
    }

    // Remove the `listener` from the list.
    this._listeners = this._listeners.filter((_) => _ !== listenerEntry);

    // If it was the last listener.
    if (this._listeners.length === 0) {
      // Run any subscription inactive state listeners,
      // after which clear the list of such listeners.
      for (const inactiveStateListener of this
        ._subscriptionInactiveStateListeners) {
        inactiveStateListener();
      }
      this._subscriptionInactiveStateListeners = [];
    }
  }
}
