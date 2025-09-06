export default class Subscription {
  constructor({ activateSubscription } = {}) {
    this._activateSubscription = activateSubscription;

    // This property is accessed in tests.
    this._listeners = [];
  }

  notifySubscribers = (argument) => {
    // `._latest` is only used in tests.
    this._latest = argument;
    for (const { listener } of this._listeners) {
      listener(argument);
    }
  };

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
      this._deactivateSubscription = this._activateSubscription(
        this.notifySubscribers,
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

    // If it was the last listener, deactivate subscription.
    if (this._listeners.length === 0) {
      this._deactivateSubscription();
      this._deactivateSubscription = undefined;
    }
  }
}
