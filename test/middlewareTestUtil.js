import ActionTypes from '../src/redux/ActionTypes';
import ActionTypesInternal from '../src/redux/ActionTypesInternal';

export function invokeLocationMiddleware(middleware, action) {
  let result;

  function next(nextAction) {
    result = nextAction;
  }

  middleware()(next)(action);

  return result;
}

export function transformInputLocationUsingMiddleware(middleware, location) {
  return invokeLocationMiddleware(middleware, {
    type: ActionTypes.NAVIGATE,
    payload: {
      operation: 'PUSH',
      location,
    },
  }).payload.location;
}

export function transformOutputLocationUsingMiddleware(middleware, location) {
  return invokeLocationMiddleware(middleware, {
    type: ActionTypesInternal.INTERNAL_LOCATION_UPDATE,
    payload: location,
  }).payload;
}
