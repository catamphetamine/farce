import ActionTypes from './ActionTypes';
import ensureLocation from './ensureLocation';

export default function ensureLocationMiddleware() {
  return (next) => (action) => {
    const { type, payload } = action;

    switch (type) {
      case ActionTypes.PUSH:
        return next({
          type: ActionTypes.NAVIGATE,
          payload: { ...ensureLocation(payload), action: 'PUSH' },
        });
      case ActionTypes.REPLACE:
        return next({
          type: ActionTypes.NAVIGATE,
          payload: { ...ensureLocation(payload), action: 'REPLACE' },
        });
      default:
        return next(action);
    }
  };
}
