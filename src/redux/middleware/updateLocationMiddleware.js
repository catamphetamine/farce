import getLocationFromInternalLocation from '../../getLocationFromInternalLocation';
import ActionTypes from '../ActionTypes';
import ActionTypesInternal from '../ActionTypesInternal';

export default function updateLocationMiddleware() {
  return (next) => (action) => {
    const { type, payload } = action;

    switch (type) {
      // Convert `LocationInternal` object to a publicly-visible `Location` object.
      // It hides non-essential properties of location such as `operation`, `index`, `delta`.
      // eslint-disable-next-line no-underscore-dangle
      case ActionTypesInternal.INTERNAL_LOCATION_UPDATE:
        // Dispatch a "public" `UPDATE` Redux action.
        // This is what users of this package should use
        // rather than `INTERNAL_LOCATION_UPDATE` which is for internal purposes.
        next({
          type: ActionTypes.UPDATE,
          payload: getLocationFromInternalLocation(payload),
        });
        return;

      default:
        // eslint-disable-next-line consistent-return
        return next(action);
    }
  };
}
