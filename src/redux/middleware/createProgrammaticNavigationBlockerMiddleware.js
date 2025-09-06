import isPromise from '../../isPromise';
import {
  getNavigationBlockers,
  removeAllNavigationBlockers,
  runNavigationBlockers,
} from '../../navigationBlockers';
import ActionTypes from '../ActionTypes';

export function createNavigationBlockersEvaluationStatus(session) {
  /* eslint-disable no-underscore-dangle */
  if (session._navigationBlockersEvaluationStatus) {
    session._navigationBlockersEvaluationStatus.cancelled = true;
  }
  session._navigationBlockersEvaluationStatus = { cancelled: false };
  return session._navigationBlockersEvaluationStatus;
}

// Creates a "middleware" that applies navigation blockers for programmatic navigation,
// i.e. the navigation that was triggered by the application code.
// This only includes `PUSH` and `REPLACE` navigation, and other programmatic types of navigation
// such as `SHIFT` aren't able to be handled here due to not yet having `location` info,
// so they're handled in a different middleware.
export default function createProgrammaticNavigationBlockerMiddleware(
  session,
) {
  return function programmaticNavigationBlockerMiddleware() {
    return (next) => (action) => {
      const { type, payload } = action;

      // Declaring `result` variable here fixes ESLint error:
      // "Unexpected lexical declaration in case block".
      let result;

      switch (type) {
        // Prevent or allow navigation that was initiated by the application
        // by dispatching a `.push()` or `.replace()` action.
        //
        // It doesn't handle `.shift()` navigation actions because it doesn't yet know
        // the `location` that it's gonna `shift` to. Instead, it waits for the web browser
        // to "shift" to that `location` and then reads it and rewinds the "shift"
        // if it should've been blocked. That is handled by another "navigation blocker" middleware.
        //
        // This type of "shifting" and then rewinding the "shift" doesn't really matter to the application at all.
        // From the application's point of view, all of that doesn't matter and even doesn't exist.
        // All that exists from the application's point of view is the `location` object in the Redux state.
        // Until the `location` object in the Redux state is updated, the old page is still rendered.
        // The appliation is only concerned with the updates of the `location` object in the Redux state
        // and completely ignores any updates to the URL in the web browser's address bar.
        //
        case ActionTypes.NAVIGATE:
          // `resultValue` variable name works around a stupid javascript error:
          // "Cannot redeclare block-scoped variable 'result'".
          result = runNavigationBlockers(
            getNavigationBlockers(session),
            // Here `payload.location` is `LocationBase`.
            payload.location,
          );
          if (isPromise(result)) {
            const status = createNavigationBlockersEvaluationStatus(session);
            // eslint-disable-next-line consistent-return
            result.then((resultValue) => {
              if (!status.cancelled) {
                if (!resultValue) {
                  return next(action);
                }
              }
            });
          } else if (!result) {
            return next(action);
          }
          // eslint-disable-next-line consistent-return
          return;

        // Programmatic SHIFT actions aren't handled here.
        // Instead, they're handled in non-programmatic navigation blocker middleware.
        // The rationale is that there's no `location` argument on "SHIFT" actions,
        // so the navigation blockers don't know yet what is the new location gonna be.
        // They have to wait for the environment to restore the new location
        // and then tell it to `navigation-stack` by calling a listener.
        case ActionTypes.SHIFT:
          // New `location` isn't known yet. Proceed without blocking anything.
          return next(action);

        // Remove any navigation blockers on `STOP` event.
        case ActionTypes.STOP:
          removeAllNavigationBlockers(session);
          return next(action);

        default:
          return next(action);
      }
    };
  };
}
