import getLocationFromInternalLocation from '../../getLocationFromInternalLocation';
import isPromise from '../../isPromise';
import {
  getNavigationBlockers,
  runNavigationBlockers,
} from '../../navigationBlockers';
import NavigationOperations from '../../session/navigation/operation/operations';
import ActionTypesInternal from '../ActionTypesInternal';
import { createNavigationBlockersEvaluationStatus } from './createProgrammaticNavigationBlockerMiddleware';

// Creates a "middleware" that applies navigation blockers for non-programmatic navigation,
// i.e. the navigation that wasn't triggered by the application code and was triggered, say, by the user.
// It also handles programmatic `SHIFT` navigation because it doesn't know the new location until
// the environment performs the `delta` navigation and then tells the new location to `navigation-stack`.
export default function createNonProgrammaticNavigationBlockerMiddleware(
  session,
  { ignoreNavigationLocationSubscriptionEvents },
) {
  return function nonProgrammaticNavigationBlockerMiddleware() {
    return (next) => (action) => {
      const { type, payload } = action;

      // Declaring `result` variable here fixes ESLint error:
      // "Unexpected lexical declaration in case block".
      let result;

      switch (type) {
        // One could ask: Why run navigation blockers on `UPDATE` Redux action?
        // Why not just run navigation blockers on `NAVIGATE` and `SHIFT` Redux action?
        // The reason why it handles `UPDATE` Redux actions here is because
        // `NAVIGATE` Redux actions are only emitted for programmatic "push" or "replace" navigation
        // initiated by the application code, and there're other cases of navigation such as
        // programmatic "shift" navigation or when the user manually clicks "Back" or "Forward" button
        // in a web browser. And even if a "shift" navigation is initiated by the application code,
        // it still doesn't know yet what the new location is gonna be cause it only knows the `delta`.
        // Such "other" cases could only be handled by reacting to an `UPDATE` Redux action
        // which is only emitted after the URL in the browser's address bar has changed.
        //
        // There's no real drawback in reacting to an `UPDATE` Redux action "post factum" because
        // from the application's point of view the address bar doesn't matter and even doesn't exist.
        // All that exists from the application's point of view is the `location` object in the Redux state.
        // Until the `location` object in the Redux state is updated, the old page is still rendered.
        // The appliation is only concerned with the updates of the `location` object in the Redux state
        // and completely ignores any updates to the URL in the web browser's address bar.
        //
        // So here, the "middleware" attempts to prevent or allow navigation that has already happened
        // in the web browser's address bar but hasn't yet happened in Redux state.
        // For example, it could be a user clicking a "Back"/"Forward" button in their web browser.
        // If such navigation should've been blocked, it will simply not update the `locaiton` object in Redux state,
        // and it will also "rewind" the change of the URL in the web browser's address bar so that it's consistent
        // with the `location` in Redux state.
        //
        // eslint-disable-next-line no-underscore-dangle
        case ActionTypesInternal.INTERNAL_LOCATION_UPDATE:
          // Programmatic `PUSH`/`REPLACE` actions are handled in another middleware.
          if (
            payload.operation === NavigationOperations.PUSH ||
            payload.operation === NavigationOperations.REPLACE
          ) {
            return next(action);
          }

          // If no navigation blockers to run, don't do anything.
          if (getNavigationBlockers(session).length === 0) {
            return next(action);
          }

          // If it was the initial page load or a redirect,
          // it's not really a navigation that could be rolled back.
          if (payload.delta === 0) {
            return next(action);
          }

          result = runNavigationBlockers(
            getNavigationBlockers(session),
            // Here `getLocationFromInternalLocation(payload)` is `Location`.
            getLocationFromInternalLocation(payload),
          );

          if (isPromise(result)) {
            const status = createNavigationBlockersEvaluationStatus(session);

            // While location blockers are running, rewind to the previous location.
            ignoreNavigationLocationSubscriptionEvents(() => {
              session.shift(-payload.delta);
            });

            result.then((promiseResult) => {
              if (promiseResult) {
                // Navigation blocked.
                // Already rewound to a previous location.
              } else if (!status.cancelled) {
                // Navigation not blocked.
                // Rewind back to the new location.
                ignoreNavigationLocationSubscriptionEvents(() => {
                  session.shift(payload.delta);
                });
                // Update the location.
                next(action);
              }
            });
          } else if (result) {
            // Prevent the navigation: rewind to the previous location.
            ignoreNavigationLocationSubscriptionEvents(() => {
              session.shift(-payload.delta);
            });
          } else {
            // Update the location.
            return next(action);
          }
          // eslint-disable-next-line consistent-return
          return;

        default:
          return next(action);
      }
    };
  };
}
