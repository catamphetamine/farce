import ActionTypes from './ActionTypes';

export default function createLocationMiddleware({
  makeLocationDescriptor,
  makeLocation,
}) {
  return function locationMiddleware() {
    return (next) => (action) => {
      const { type, payload } = action;

      switch (type) {
        case ActionTypes.NAVIGATE:
          return next({ type, payload: makeLocationDescriptor(payload) });
        case ActionTypes.UPDATE_LOCATION:
          return next({ type, payload: makeLocation(payload) });
        default:
          return next(action);
      }
    };
  };
}
