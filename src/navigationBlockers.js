/* eslint-disable no-underscore-dangle */

import isPromise from './isPromise';

export function getNavigationBlockers(session) {
  return session._navigationBlockersList || [];
}

function addNavigationBlockerToTheList(blocker, session) {
  if (!session._navigationBlockersList) {
    session._navigationBlockersList = [];
  }
  session._navigationBlockersList.push(blocker);
}

function removeNavigationBlockerFromTheList(blocker, session) {
  if (session._navigationBlockersList) {
    session._navigationBlockersList = session._navigationBlockersList.filter(
      (_) => _ !== blocker,
    );
  }
}

export function removeAllNavigationBlockers(session) {
  if (
    getNavigationBlockers(session).some((blocker) => blocker.beforeTermination)
  ) {
    if (!session._removeTerminationBlocker) {
      throw new Error(
        '`_removeTerminationBlocker` property not found in the `session`',
      );
    }
    session._removeTerminationBlocker();
    session._removeTerminationBlocker = undefined;
  }
  session._navigationBlockersList = [];
}

// Runs the `blocker` while ignoring any errors that might be thrown by it.
function runNavigationBlocker({ blocker }, location) {
  let result;
  try {
    result = blocker(location);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(
      `Ignoring navigation blocker \`${blocker.name}\` that failed with \`${error}\`.`,
    );
    // eslint-disable-next-line no-console
    console.error(error);
  }

  // If the blocker returned a `Promise`, await for that `Promise`
  // and then return the result.
  if (isPromise(result)) {
    return result.catch((error) => {
      // eslint-disable-next-line no-console
      console.warn(
        `Ignoring navigation blocker \`${blocker.name}\` that failed with \`${error}\`.`,
      );
      // eslint-disable-next-line no-console
      console.error(error);
    });
  }
  // The blocker didn't return a `Promise`.
  // Return the "synchronous" result.
  return result;
}

// Runs all blockers in order.
// If any blocker returns `true`, it stops and returns the result.
// If there's no such blocker, returns `undefined`.
export function runNavigationBlockers(navigationBlockers, toLocation) {
  if (navigationBlockers.length === 0) {
    return undefined;
  }

  // Call the first blocker in the list.
  const result = runNavigationBlocker(navigationBlockers[0], toLocation);

  const next = () => {
    // Proceed to the next blocker.
    return runNavigationBlockers(navigationBlockers.slice(1), toLocation);
  };

  if (isPromise(result)) {
    return result.then((resultValue) => {
      if (resultValue) {
        return resultValue;
      }
      return next();
    });
  }

  if (result) {
    return result;
  }
  return next();
}

/* istanbul ignore next: not testable with Karma */
function terminationBlocker(session) {
  const result = runNavigationBlockers(getNavigationBlockers(session), null);

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
    !getNavigationBlockers(session).some(
      (navigationBlocker) => navigationBlocker.beforeTermination,
    )
  ) {
    if (session._removeTerminationBlocker) {
      throw new Error(
        'Unexpected `_removeTerminationBlocker` property found in the `session`',
      );
    }
    session._removeTerminationBlocker =
      session.lifecycle.addTerminationBlocker(() => {
        return terminationBlocker(session);
      });
  }

  const newNavigationBlocker = { blocker, beforeTermination };
  addNavigationBlockerToTheList(newNavigationBlocker, session);

  return () => {
    removeNavigationBlockerFromTheList(newNavigationBlocker, session);

    // If it was the last "beforeTermination" blocker, remove navigation blocker.
    if (
      beforeTermination &&
      !getNavigationBlockers(session).some(
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
