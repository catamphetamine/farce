/* eslint-disable no-console */

import ActionTypes from './ActionTypes';
import Actions from './Actions';
import {
  getNavigationListenerEntries,
  onBeforeUnload,
  removeAllNavigationListenerEntries,
  removeBeforeUnloadListener,
  runListenerEntries,
} from './navigationListeners';

function maybeConfirm(result) {
  if (typeof result === 'boolean') {
    return result;
  }

  return window.confirm(result); // eslint-disable-line no-alert
}

function runAllowNavigation(listenerEntries, location, callback) {
  return runListenerEntries(listenerEntries, location, (result) =>
    callback(maybeConfirm(result)),
  );
}

export default function createNavigationListenerMiddleware() {
  let nextStep = null;

  function navigationListenerMiddleware({ dispatch }) {
    return (next) => (action) => {
      const { type, payload } = action;

      if (nextStep && type === ActionTypes.UPDATE_LOCATION) {
        const step = nextStep;
        nextStep = null;
        return step(next, action);
      }

      switch (type) {
        case ActionTypes.NAVIGATE:
          return runAllowNavigation(
            getNavigationListenerEntries(),
            payload,
            (allowNavigation) => {
              if (!allowNavigation) {
                return null;
              }

              // Skip the repeated navigation listener check on
              //  UPDATE_LOCATION.
              nextStep = (nextNext, nextAction) => nextNext(nextAction);

              return next(action);
            },
          );
        case ActionTypes.UPDATE_LOCATION: {
          // No navigation listeners to run.
          if (!getNavigationListenerEntries().length) {
            return next(action);
          }

          // This is the initial load. It doesn't make sense to block this
          //  navigation.
          if (payload.delta === 0) {
            return next(action);
          }

          // Without delta, we can't restore the location.
          if (payload.delta == null) {
            return runAllowNavigation(
              getNavigationListenerEntries(),
              payload,
              (allowNavigation) => (allowNavigation ? next(action) : null),
            );
          }

          const finishRunAllowNavigation = (result) => {
            if (!maybeConfirm(result)) {
              return null;
            }

            // Release the original UPDATE_LOCATION when the un-rewind
            //  happens. We need to do so here to maintain the invariant that
            //  the store location only updates after the window location.
            nextStep = () => next(action);

            dispatch(Actions.go(payload.delta));
            return undefined;
          };

          let sync = true;
          let rewindDone = false;

          const syncResult = runListenerEntries(
            getNavigationListenerEntries(),
            payload,
            (result) => {
              if (sync) {
                return result;
              }

              if (!rewindDone) {
                // The rewind hasn't finished yet. Replace the next step listener
                //  so we finish running when that happens.
                nextStep = () => finishRunAllowNavigation(result);
                return undefined;
              }

              return finishRunAllowNavigation(result);
            },
          );

          sync = false;

          switch (syncResult) {
            case true:
              // The navigation was synchronously allowed, so skip the rewind.
              return next(action);
            case false:
              // We're done as soon as the rewind finishes.
              nextStep = () => {};
              break;
            case undefined:
              // Let the callback from runListeners take care of things.
              nextStep = () => {
                rewindDone = true;
              };
              break;
            default:
              // Show the confirm dialog after the rewind.
              nextStep = () => finishRunAllowNavigation(syncResult);
          }

          dispatch(Actions.go(-payload.delta));
          return undefined;
        }
        case ActionTypes.DISPOSE:
          if (
            getNavigationListenerEntries().some((item) => item.beforeUnload)
          ) {
            removeBeforeUnloadListener(onBeforeUnload);
          }
          removeAllNavigationListenerEntries();

          return next(action);
        default:
          return next(action);
      }
    };
  }

  return navigationListenerMiddleware;
}
