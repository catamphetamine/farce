import ActionTypes from '../ActionTypes';
import ActionTypesInternal from '../ActionTypesInternal';

// Creates a "middleware" that performs the actual navigation according to the `session` being used.
// For example, when `WebBrowserSession` is used, it calls methods of the `window.history` object.
export default function createUpdateInternalLocationMiddleware(
  session,
  { shouldIgnoreNavigationLocationSubscriptionEvents },
) {
  return function updateInternalLocationMiddleware() {
    return (next) => {
      // Whenever browser location changes,
      // perform the same changes with the internal `location` object.
      const unsubscribe = session.subscribe((location) => {
        if (!shouldIgnoreNavigationLocationSubscriptionEvents()) {
          next({
            // eslint-disable-next-line no-underscore-dangle
            type: ActionTypesInternal.INTERNAL_LOCATION_UPDATE,
            payload: location,
          });
        }
      });

      return (action) => {
        const { type, payload } = action;

        switch (type) {
          case ActionTypes.INIT:
            // `init()` will trigger the `subscribe()` listener,
            // which will call `updateLocation()`.
            session.start(payload);
            // eslint-disable-next-line consistent-return
            return;

          case ActionTypes.NAVIGATE:
            // `navigate()` will trigger the `subscribe()` listener,
            // which will call `updateLocation()`.
            session.navigate(payload.operation, payload.location);
            // eslint-disable-next-line consistent-return
            return;

          case ActionTypes.SHIFT:
            // `shift()` will trigger the `subscribe()` listener,
            // which will call `updateLocation()`.
            session.shift(payload);
            // eslint-disable-next-line consistent-return
            return;

          case ActionTypes.STOP:
            // Remove location change subscription.
            unsubscribe();
            // Even if it calls `unsubscribe()` function above, any other subscriptions
            // would still stay. We're not talking about `navigationStack.subscribe()`
            // subscriptions because those don't really matter in terms of cleaning them up:
            // those're just Redux store subscriptions that don't have any side effects.
            // Subscriptions we're talking here are `Session`'s own subscription
            // via `session.subscribe()` and any hypothetical manual `session.subscribe()`
            // calls that could be made by the application code for whatever purpose.
            // Both of those should be cleared.
            // To work around that, `.stop()` function removes all subscriptions.
            session.stop();
            // eslint-disable-next-line consistent-return
            return next(action);

          default:
            // eslint-disable-next-line consistent-return
            return next(action);
        }
      };
    };
  };
}
