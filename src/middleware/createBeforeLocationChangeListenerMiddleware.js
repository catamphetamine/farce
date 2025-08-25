import ActionTypes from '../ActionTypes';
import {
  getBeforeLocationChangeListeners,
  removeAllBeforeLocationChangeListeners,
  runBeforeLocationChangeListeners,
} from '../beforeLocationChangeListeners';

// Creates a "middleware" that calls upcoming navigation listeners.
export default function createBeforeLocationChangeListenerMiddleware(session) {
  return function navigationListenerMiddleware() {
    return (next) => (action) => {
      const { type, payload } = action;

      switch (type) {
        // Trigger navigation listeners before the `location` has been updated in Redux state.
        // It doesn't matter that the new location URL has already been updated in the web browser's
        // address bar, or that the web browser's history has already switched to the new locaiton.
        // From the application's point of view, all of that doesn't matter and even doesn't exist.
        // All that exists from the application's point of view is the `location` object in the Redux state.
        // Until the `location` object in the Redux state is updated, the old page is still rendered.
        // The appliation is only concerned with the updates of the `location` object in the Redux state
        // and completely ignores any updates to the URL in the web browser's address bar.
        case ActionTypes.UPDATE:
          runBeforeLocationChangeListeners(
            getBeforeLocationChangeListeners(session),
            payload,
          );
          return next(action);

        // Remove any navigation listeners on `DISPOSE` event.
        case ActionTypes.DISPOSE:
          removeAllBeforeLocationChangeListeners(session);
          return next(action);

        default:
          return next(action);
      }
    };
  };
}
