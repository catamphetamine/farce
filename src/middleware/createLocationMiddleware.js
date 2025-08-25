import ActionTypes from '../ActionTypes';

function updateLocation(location) {
  return {
    type: ActionTypes.UPDATE,
    payload: location,
  };
}

// Creates a "middleware" that performs the actual navigation according to the `session` being used.
// For example, when `BrowserSession` is used, it calls methods of the `window.history` object.
export default function createLocationMiddleware(
  session,
  { shouldIgnoreLocationSubscriptionEvents },
) {
  return function locationMiddleware() {
    return (next) => {
      // Whenever browser location changes,
      // perform the same changes with the internal `location` object.
      const unsubscribe = session.navigation.subscribe((location) => {
        if (!shouldIgnoreLocationSubscriptionEvents()) {
          next(updateLocation(location));
        }
      });

      return (action) => {
        const { type, payload } = action;

        switch (type) {
          case ActionTypes.INIT:
            return next(updateLocation(session.navigation.init()));

          case ActionTypes.NAVIGATE:
            // `session.navigate()` doesn't trigger the `subscribe()` listener.
            return next(updateLocation(session.navigation.navigate(payload)));

          case ActionTypes.SHIFT:
            // `shift()` will trigger the `subscribe()` listener,
            // which will call `updateLocation()`.
            session.navigation.shift(payload);
            // eslint-disable-next-line consistent-return
            return;

          case ActionTypes.DISPOSE:
            unsubscribe();
            // eslint-disable-next-line consistent-return
            return;

          default:
            return next(action);
        }
      };
    };
  };
}
