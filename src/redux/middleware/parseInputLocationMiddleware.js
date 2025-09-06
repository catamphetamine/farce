import parseInputLocation from '../../parseInputLocation';
import ActionTypes from '../ActionTypes';

// This "middleware" transforms input location argument into a proper `NormalizedInputLocation`.
export default function parseInputLocationMiddleware() {
  return (next) => (action) => {
    const { type, payload } = action;

    switch (type) {
      case ActionTypes.INIT:
      case ActionTypes.PUSH:
      case ActionTypes.REPLACE:
        return next({
          type,
          // `payload` is optional in `INIT` action.
          payload: payload && parseInputLocation(payload),
        });

      default:
        return next(action);
    }
  };
}
