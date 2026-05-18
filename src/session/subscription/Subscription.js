export default class Subscription {
  constructor({ subscribe } = {}) {
    // This property is accessed in tests.
    this._listeners = [];

    // A `Subscription` could either manually trigger events
    // or relay events from some other source.
    // * If it will be manually triggering events then the code
    //   should manually call `subscription.notifySubscribers(event)` on every event.
    // * If it will be relaying events from some other source
    //   then it should specify a `subscribe` function in constructor parameters.
    if (subscribe) {
      // It won't call `subscribe()` right away.
      // Instead, it exhibits a slightly smarter behavior.
      // Subscribing to external events is not necessary when
      // there're no actual subscribers, in order to not unnecessarily "hold" any resources.
      // So it only subscribes to external events when there's at least one active subscriber.
      // And in case all subscribers get unsubscribed, it will unsubscribe from external events.
      // If anyone re-subscribes after that, it will call `subscribe()` again.
      this._subscribe = subscribe;
      this._unsubscribe = undefined;
    }
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
      if (this._subscribe) {
        this._unsubscribe = this._subscribe(this.notifySubscribers);
      }
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
      if (this._unsubscribe) {
        this._unsubscribe();
        this._unsubscribe = undefined;
      }
    }
  }
}
