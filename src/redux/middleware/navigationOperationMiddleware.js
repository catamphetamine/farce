import Operations from '../../session/navigation/operation/operations';
import ActionTypes from '../ActionTypes';

// This "middleware" transforms a `PUSH` / `REPLACE` action into a `NAVIGATE` action.
export default function navigationOperationMiddleware() {
  return (next) => (action) => {
    const { type, payload } = action;

    switch (type) {
      // Converts a `PUSH` action into a `NAVIGATE` action.
      case ActionTypes.PUSH:
        return next({
          type: ActionTypes.NAVIGATE,
          payload: {
            operation: Operations.PUSH,
            location: payload,
          },
        });

      // Converts a `REPLACE` action into a `NAVIGATE` action.
      case ActionTypes.REPLACE:
        return next({
          type: ActionTypes.NAVIGATE,
          payload: {
            operation: Operations.REPLACE,
            location: payload,
          },
        });

      default:
        return next(action);
    }
  };
}
