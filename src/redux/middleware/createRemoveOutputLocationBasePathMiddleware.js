import { removeBasePath } from '../../basePath';
import ActionTypesInternal from '../ActionTypesInternal';

// Creates a "middleware" that, when a website is hosted under a certain path (`basePath`),
// automatically hides that starting segment from the `pathname` of `location`s.
export default function createRemoveOutputLocationBasePathMiddleware(
  basePath,
) {
  return function removeOutputLocationBasePathMiddleware() {
    return (next) => (action) => {
      const { type, payload } = action;

      switch (type) {
        // Transforms `UPDATE` action payload (input `location`).
        case ActionTypesInternal.INTERNAL_LOCATION_UPDATE:
          return next({
            type,
            payload: removeBasePath(payload, basePath),
          });

        default:
          return next(action);
      }
    };
  };
}
