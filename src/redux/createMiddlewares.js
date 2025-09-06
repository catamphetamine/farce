import createAddInputLocationBasePathMiddleware from './middleware/createAddInputLocationBasePathMiddleware';
import createNonProgrammaticNavigationBlockerMiddleware from './middleware/createNonProgrammaticNavigationBlockerMiddleware';
import createProgrammaticNavigationBlockerMiddleware from './middleware/createProgrammaticNavigationBlockerMiddleware';
import createRemoveOutputLocationBasePathMiddleware from './middleware/createRemoveOutputLocationBasePathMiddleware';
import createUpdateInternalLocationMiddleware from './middleware/createUpdateInternalLocationMiddleware';
import navigationActionMiddleware from './middleware/navigationOperationMiddleware';
import parseInputLocationMiddleware from './middleware/parseInputLocationMiddleware';
import updateLocationMiddleware from './middleware/updateLocationMiddleware';

export default function createMiddlewares(session, options) {
  // Allows temporarily ignoring location update events.
  let shouldIgnoreNavigationLocationSubscriptionEvents = false;
  const ignoreNavigationLocationSubscriptionEvents = (func) => {
    shouldIgnoreNavigationLocationSubscriptionEvents = true;
    func();
    shouldIgnoreNavigationLocationSubscriptionEvents = false;
  };

  const middlewares = [
    // Validates that the action "payload" (input location) is a proper `NormalizedInputLocation`.
    parseInputLocationMiddleware,

    // Transforms a "PUSH" / "REPLACE" action into a "NAVIGATE" action.
    navigationActionMiddleware,

    // If a website is hosted under a certain path (`basePath`)
    // then this middleware will automatically hide that starting segment from the `pathname` of `location`s.
    createAddInputLocationBasePathMiddleware(options && options.basePath),

    // Allows blocking navigation.
    // Handles `NAVIGATE` actions dispatched by the application itself.
    createProgrammaticNavigationBlockerMiddleware(session),

    // This "middleware" performs the actual navigation according to the `session` being used.
    // For example, when `WebBrowserSession` is used, it calls methods of the `history` object.
    createUpdateInternalLocationMiddleware(session, {
      shouldIgnoreNavigationLocationSubscriptionEvents: () =>
        shouldIgnoreNavigationLocationSubscriptionEvents,
    }),

    // If a website is hosted under a certain path (`basePath`)
    // then this middleware will automatically hide that starting segment from the `pathname` of `location`s.
    createRemoveOutputLocationBasePathMiddleware(options && options.basePath),

    // Allows blocking navigation.
    // Handles location `UPDATE` actions dispatched in response to location update events.
    createNonProgrammaticNavigationBlockerMiddleware(session, {
      ignoreNavigationLocationSubscriptionEvents,
    }),
  ];

  // Add `updateLocationMiddleware()`.
  // It dispatches an `UPDATE` action with the new location
  // so that the reducer could update it in global state.
  //
  // If `_internalLocationReducer` option is passed,
  // it will not add this middleware. This is only used in tests.
  //
  // eslint-disable-next-line no-underscore-dangle
  if (!(options && options._internalLocationReducer)) {
    middlewares.push(updateLocationMiddleware);
  }

  return middlewares;
}
