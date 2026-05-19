import getLocationBaseFromLocation from './getLocationBaseFromLocation.js';
import getLocationFromInternalLocation from './getLocationFromInternalLocation.js';
import isPromise from './isPromise.js';
import {
  getNavigationBlockers,
  runNavigationBlockers,
} from './navigationBlockers.js';

// Creates "navigation blockers evaluation" status object.
// It tracks the "cancelled" status of the evaluation:
// when next navigation happens, the previous one is no longer relevant
// so the evaluation of navigation blockers for it can be cancelled.
function createNavigationBlockersEvaluationStatus(container) {
  /* eslint-disable no-underscore-dangle */
  if (container._navigationBlockersEvaluationStatus) {
    container._navigationBlockersEvaluationStatus.cancelled = true;
  }
  container._navigationBlockersEvaluationStatus = { cancelled: false };
  return container._navigationBlockersEvaluationStatus;
}

// Prevents or allows navigation that was initiated by the application code
// by making a `.push()` or `.replace()` method call.
//
// It doesn't handle `.shift()` method calls because it doesn't yet know
// the `location` that it's gonna `shift` to. Instead, it waits for the web browser
// to "shift" to that `location` and then reads the `location` from the address bar
// and, if such "shift" should've been blocked, it "rewinds" the address bar back
// to the previous location. This part is handled by another function.
//
// Such type of "shifting" and then rewinding the "shift" doesn't really matter to the application code at all.
// From the application code's point of view, all web browser's address bar doesn't matter and even doesn't exist.
// All that exists from the application code's point of view is the `location` object in the `NavigationStack`'s state.
// Until the `location` object in the `NavigationStack`'s state is updated, the "old" page is still rendered.
// The appliation is only concerned with the updates of the `location` object in the `NavigationStack`'s state
// and completely ignores any updates to the URL in the web browser's address bar.
//
export function blockProgrammaticNavigationIfRequired(
  toLocationBase, // `location` of type `LocationBase`
  session,
) {
  // `resultValue` variable name works around a stupid javascript error:
  // "Cannot redeclare block-scoped variable 'result'".
  const result = runNavigationBlockers(
    getNavigationBlockers(session),
    // Here `payload.location` is `LocationBase`.
    toLocationBase,
    session.environment,
  );

  if (isPromise(result)) {
    const evaluationStatus = createNavigationBlockersEvaluationStatus(session);
    // eslint-disable-next-line consistent-return
    return result.then((promiseResult) => {
      if (evaluationStatus.cancelled) {
        return true;
      }
      return promiseResult;
    });
  }
  return result;
}

// Runs navigation blockers on internal location update and "undoes" the location update
// if it should've been blocked.
//
// One could ask: Why the hassle of running navigation blockers on internal location update
// and then rewinding back if the location change should've been blocked?
// Why not just run navigation blockers on `.push()`/`.replace()`/`.shift()`?
//
// The reason why it runs on internal location update here is because
// aside from programmatic `.shift()` that can be initiated from the application code,
// there's non-programmatic "shift" navigation when the user manually clicks "Back" or "Forward" button
// in a web browser. And even if a "shift" navigation is initiated programmatically in the application code,
// it still doesn't know yet what the new location is gonna be cause it only knows the numeric `delta`.
// Such cases could only be handled by reacting to internal location updates which,
// in case of "Back"/"Forward", only happen after the URL in the browser's address bar has changed.
//
// There's no real drawback in reacting to an internal location update "post factum" because
// from the application code's point of view, web browser's address bar doesn't matter and even doesn't exist.
// All that exists from the application code's point of view is the `navigationStack.current` location
// returned from  the `NavigationStack`. Until that location is updated, the "old" page is still rendered.
// The appliation is only concerned with the updates of the internal `location` object in the `NavigationStack``
// and completely ignores any updates to the URL in the web browser's address bar.
//
// So here, the code attempts to prevent or allow navigation that has already happened
// in the web browser's address bar but hasn't yet happened in the `NavigationStack`'s state.
// For example, it could be a user clicking a "Back"/"Forward" button in a web browser.
// If such navigation should've been blocked, it will simply not update the `location` object
// in the `NavigationStack`'s state, and it will also "rewind" the change of the URL in the web browser's
// address bar so that it's consistent with the `location` in the `NavigationStack`'s state.
//
// Returns either a `boolean` value or a `Promise` that resolves to a `boolean` value:
// * `false` when navigation should not have been blocked and therefore was not "rewinded".
// * `true` when navigation should have been blocked and therefore was "rewinded".
// * `true` when it "rewinded" the navigation "just in case" and then started evaluating async blockers,
//   but while doing that, next navigation already happened so this one is no longer relevant.
//
export function blockNonProgrammaticNavigationIfRequired(
  toLocationInternal, // `location` of type `LocationInternal`
  session,
  doAndIgnoreLocationUpdates,
) {
  // If there're no navigation blockers to run, don't do anything.
  if (getNavigationBlockers(session).length === 0) {
    return false;
  }

  // If it was the initial page load or a redirect,
  // it's not really a navigation that could be rolled back.
  if (toLocationInternal.delta === 0) {
    return false;
  }

  const result = runNavigationBlockers(
    getNavigationBlockers(session),
    getLocationBaseFromLocation(
      getLocationFromInternalLocation(toLocationInternal),
    ),
    session.environment,
  );

  // If some navigation blocker returned a `Promise`.
  if (isPromise(result)) {
    const evaluationStatus = createNavigationBlockersEvaluationStatus(session);

    // While location blockers are running, rewind to the previous location.
    doAndIgnoreLocationUpdates(() => {
      session.shift(-toLocationInternal.delta);
    });

    return result.then((promiseResult) => {
      if (evaluationStatus.cancelled) {
        return true;
      }
      if (promiseResult) {
        // Navigation blocked.
        // Already rewound to a previous location.
        return true;
      }
      // Navigation not blocked.
      // Rewind back to the new location.
      doAndIgnoreLocationUpdates(() => {
        session.shift(toLocationInternal.delta);
      });
      // Update the location.
      return false;
    });
  }

  // Navigation blockers did not return a `Promise`.
  if (result) {
    // Prevent the navigation: rewind to the previous location.
    doAndIgnoreLocationUpdates(() => {
      session.shift(-toLocationInternal.delta);
    });
    return true;
  }
  // Update the location.
  return false;
}
