import createBasePathMiddleware from './middleware/createBasePathMiddleware';
import createBeforeLocationChangeListenerMiddleware from './middleware/createBeforeLocationChangeListenerMiddleware';
import createLocationMiddleware from './middleware/createLocationMiddleware';
import createNavigationBlockerMiddleware from './middleware/createNavigationBlockerMiddleware';
import navigationActionMiddleware from './middleware/navigationActionMiddleware';
import normalizeInputLocationMiddleware from './middleware/normalizeInputLocationMiddleware';

export default function createMiddlewares(session, options) {
  // Allows temporarily ignoring location update events.
  let shouldIgnoreLocationSubscriptionEvents = false;
  const ignoreLocationSubscriptionEvents = (func) => {
    shouldIgnoreLocationSubscriptionEvents = true;
    func();
    shouldIgnoreLocationSubscriptionEvents = false;
  };

  return [
    // Validates that the action "payload" (input location) is a proper `NormalizedInputLocation`.
    normalizeInputLocationMiddleware,
    // Transforms a "PUSH" / "REPLACE" action into a "NAVIGATE" action.
    navigationActionMiddleware,
    // If a website is hosted under a certain path (`basePath`)
    // then this middleware will automatically strip that starting segment from the `pathname` of `location`s.
    createBasePathMiddleware(options && options.basePath),
    // Allows blocking navigation.
    // Handles `NAVIGATE` actions dispatched by the application itself.
    createNavigationBlockerMiddleware(session, {
      ignoreLocationSubscriptionEvents,
    }),
    // This "middleware" performs the actual navigation according to the `session` being used.
    // For example, when `BrowserSession` is used, it calls methods of the `history` object.
    createLocationMiddleware(session, {
      shouldIgnoreLocationSubscriptionEvents: () =>
        shouldIgnoreLocationSubscriptionEvents,
    }),
    // Allows blocking navigation.
    // Handles location `UPDATE` actions dispatched in response to location update events.
    createNavigationBlockerMiddleware(session, {
      ignoreLocationSubscriptionEvents,
    }),
    // Allows subscribing to upcoming location changes
    // before those changes are applied in the `location` object in the state.
    createBeforeLocationChangeListenerMiddleware(session),
  ];
}
