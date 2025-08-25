import ActionTypes from '../ActionTypes';
import isPromise from '../isPromise';
import {
  getNavigationBlockers,
  removeAllNavigationBlockers,
  runNavigationBlockers,
} from '../navigationBlockers';

// Creates a "middleware" that applies navigation blockers.
export default function createNavigationBlockerMiddleware(
  session,
  { ignoreLocationSubscriptionEvents },
) {
  function createNavigationBlockersEvaluationStatus() {
    /* eslint-disable no-underscore-dangle */
    if (session._navigationBlockersEvaluationStatus) {
      session._navigationBlockersEvaluationStatus.cancelled = true;
    }
    session._navigationBlockersEvaluationStatus = { cancelled: false };
    return session._navigationBlockersEvaluationStatus;
  }

  return function navigationBlockerMiddleware() {
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
        // if it should've been blocked. That is handled in the `case ActionTypes.UPDATE` block.
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
            payload,
          );
          if (isPromise(result)) {
            const status = createNavigationBlockersEvaluationStatus();
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

        // One can notice that this "middleware" handles both `NAVIGATE` and `UPDATE` Redux actions,
        // even though a `NAVIGATE` action normally always causes a follow-up `UPDATE` Redux action.
        // There's no contradiction here: if a navigation blocker should block a certain navigation,
        // it will do that at the `NAVIGATION` stage and it won't get to the `UPDATE` stage, so it
        // won't be called "second time" or something like that.
        //
        // One could ask then: Why handle `UPDATE` Redux action at all?
        // The reason why it handles `UPDATE` Redux actions here is because
        // `NAVIGATE` Redux actions are only emitted for programmatic "push" or "replace" navigation
        // initiated by the application code, and there're other cases of navigation such as
        // programmatic "shift" navigation or when the user manually clicks "Back" or "Forward" button
        // in a web browser. Such "other" cases could only be handled by reacting to an `UPDATE` Redux action
        // which is only emitted after the URL in the browser's address bar has changed.
        //
        // But there's no real drawback in reacting to an `UPDATE` Redux action "post factum" because
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
        case ActionTypes.UPDATE:
          // If no navigation blockers to run, don't do anything.
          if (getNavigationBlockers(session).length === 0) {
            return next(action);
          }

          // If it was the initial page load or a redirect,
          // it's not really a navigation that could be rolled back.
          if (payload.delta === 0) {
            return next(action);
          }

          // It's not really possible for a location to not have a `delta` property in a web browser session.
          // So this case is not something that's supposed to happen in real life.
          // Rather, it's a guard against an unsupported or incorrect session implementation or something like that.
          // If there's no `delta` property on the location, it means that the previous location can't be rewound to,
          // so it can't really "prevent" the navigation that has just happened.
          if (payload.delta === null) {
            return next(action);
          }

          result = runNavigationBlockers(
            getNavigationBlockers(session),
            payload,
          );

          if (isPromise(result)) {
            const status = createNavigationBlockersEvaluationStatus();

            // While location blockers are running, rewind to the previous location.
            ignoreLocationSubscriptionEvents(() => {
              session.navigation.shift(-payload.delta);
            });

            result.then((promiseResult) => {
              if (promiseResult) {
                // Navigation blocked.
                // Already rewound to a previous location.
              } else if (!status.cancelled) {
                // Navigation not blocked.
                // Rewind back to the new location.
                ignoreLocationSubscriptionEvents(() => {
                  session.navigation.shift(payload.delta);
                });
                // Update the location.
                next(action);
              }
            });
          } else if (result) {
            // Prevent the navigation: rewind to the previous location.
            ignoreLocationSubscriptionEvents(() => {
              session.navigation.shift(-payload.delta);
            });
          } else {
            // Update the location.
            return next(action);
          }
          // eslint-disable-next-line consistent-return
          return;

        // Remove any navigation blockers on `DISPOSE` event.
        case ActionTypes.DISPOSE:
          removeAllNavigationBlockers(session);
          return next(action);

        default:
          return next(action);
      }
    };
  };
}
