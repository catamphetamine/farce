/* eslint-disable no-underscore-dangle */

import isPromise from './isPromise.js';

export function getNavigationBlockers(container) {
  return container._navigationBlockersList || [];
}

function addNavigationBlockerToTheList(blocker, container) {
  if (!container._navigationBlockersList) {
    container._navigationBlockersList = [];
  }
  container._navigationBlockersList.push(blocker);
}

function removeNavigationBlockerFromTheList(blocker, container) {
  if (container._navigationBlockersList) {
    container._navigationBlockersList =
      container._navigationBlockersList.filter((_) => _ !== blocker);
  }
}

export function removeAllNavigationBlockers(session) {
  // `navigationBlockers` are stored in `session`.
  const container = session;

  if (
    getNavigationBlockers(container).some(
      (blocker) => blocker.beforeTermination,
    )
  ) {
    if (!session._removeTerminationBlocker) {
      throw new Error(
        '`_removeTerminationBlocker` property not found in the `session`',
      );
    }
    session._removeTerminationBlocker();
    session._removeTerminationBlocker = undefined;
  }
  container._navigationBlockersList = [];
}

// Runs the `blocker` while ignoring any errors that might be thrown by it.
function runNavigationBlocker({ blocker }, location, environment) {
  let result;
  try {
    result = blocker(location);
  } catch (error) {
    environment.log.warn(
      `Ignoring navigation blocker \`${blocker.name}\` that failed with \`${error}\`.`,
    );
    environment.log.error(error);
  }

  // If the blocker returned a `Promise`, await for that `Promise`
  // and then return the result.
  if (isPromise(result)) {
    return result.catch((error) => {
      environment.log.warn(
        `Ignoring navigation blocker \`${blocker.name}\` that failed with \`${error}\`.`,
      );
      environment.log.error(error);
    });
  }
  // The blocker didn't return a `Promise`.
  // Return the "synchronous" result.
  return result;
}

// Runs all blockers in order.
// If any blocker returns `true`, it stops and returns the result.
// If there's no such blocker, returns `undefined`.
export function runNavigationBlockers(
  navigationBlockers,
  toLocation,
  environment,
) {
  if (navigationBlockers.length === 0) {
    return undefined;
  }

  // Call the first blocker in the list.
  const result = runNavigationBlocker(
    navigationBlockers[0],
    toLocation,
    environment,
  );

  const next = () => {
    // Proceed to the next blocker.
    return runNavigationBlockers(
      navigationBlockers.slice(1),
      toLocation,
      environment,
    );
  };

  if (isPromise(result)) {
    return result.then((resultValue) => {
      if (resultValue) {
        environment.log.debug('Navigation blocked', toLocation.pathname);
        return resultValue;
      }
      return next();
    });
  }

  if (result) {
    environment.log.debug('Navigation blocked', toLocation.pathname);
    return result;
  }
  return next();
}

/* istanbul ignore next: not testable with Karma */
function terminationBlocker(session) {
  // `navigationBlockers` are stored in `session`.
  const container = session;

  const result = runNavigationBlockers(
    getNavigationBlockers(container),
    null,
    session.environment,
  );

  // If no blocker returned anything, so don't prevent the navigation.
  if (!result) {
    return undefined;
  }

  // Web browsers don't allow displaying a custom modal in "beforeunload" phase.
  // They only allow displaying a standard one, with the default text.
  // Hence, "asynchronous" blockers should be ignored because web browsers won't wait for those to finish anyway.
  // https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeunload_event
  if (isPromise(result)) {
    return undefined;
  }

  // Block the navigation.
  return true;
}

export function addNavigationBlocker(session, blocker) {
  // `navigationBlockers` are stored in `session`.
  const container = session;

  // All navigation blockers also run on `beforeTermination` event.
  // If required, this could be a parameter of this function.
  // The rationale could be that adding a `beforeunload` listener
  // disables web page caching in some browsers like Firefox.
  const beforeTermination = true;

  // If it's the first "beforeTermination" blocker, add a `terminationBlocker`.
  //
  // Sidenote: Add the "beforeunload" event listener only as needed, as its presence
  // prevents the page from being added to the page navigation cache:
  //
  // "In Firefox, beforeunload is not compatible with the back/forward cache (bfcache):
  //  that is, Firefox will not place pages in the bfcache if they have "beforeunload" listeners,
  //  and this is bad for performance."
  //
  // https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeunload_event
  if (
    beforeTermination &&
    !getNavigationBlockers(container).some(
      (navigationBlocker) => navigationBlocker.beforeTermination,
    )
  ) {
    if (session._removeTerminationBlocker) {
      throw new Error(
        'Unexpected `_removeTerminationBlocker` property found in the `session`',
      );
    }
    session._removeTerminationBlocker =
      session.environment.lifecycle.addTerminationBlocker(() => {
        return terminationBlocker(session);
      });
  }

  const newNavigationBlocker = { blocker, beforeTermination };
  addNavigationBlockerToTheList(newNavigationBlocker, container);

  return () => {
    removeNavigationBlockerFromTheList(newNavigationBlocker, container);

    // If it was the last "beforeTermination" blocker, remove navigation blocker.
    if (
      beforeTermination &&
      !getNavigationBlockers(container).some(
        (navigationBlocker) => navigationBlocker.beforeTermination,
      )
    ) {
      if (!session._removeTerminationBlocker) {
        throw new Error(
          '`_removeTerminationBlocker` property not found in the `session`',
        );
      }
      session._removeTerminationBlocker();
      session._removeTerminationBlocker = undefined;
    }
  };
}
