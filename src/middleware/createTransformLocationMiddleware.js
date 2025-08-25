import ActionTypes from '../ActionTypes';

// Creates a "middleware" that transforms action payload (location).
export default function createTransformLocationMiddleware({
  transformInputLocation,
  transformSubscriptionLocation,
}) {
  return function transformLocationMiddleware() {
    return (next) => (action) => {
      const { type, payload } = action;

      switch (type) {
        // Transforms `NAVIGATE` action payload (`location`).
        case ActionTypes.NAVIGATE:
          return next({ type, payload: transformInputLocation(payload) });

        // Transforms `UPDATE` action payload (input `location`).
        case ActionTypes.UPDATE:
          return next({
            type,
            payload: transformSubscriptionLocation(payload),
          });

        default:
          return next(action);
      }
    };
  };
}
