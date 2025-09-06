import { addBasePath } from '../../basePath';
import ActionTypes from '../ActionTypes';

// Creates a "middleware" that, when a website is hosted under a certain path (`basePath`),
// automatically hides that starting segment from the `pathname` of `location`s.
export default function createAddInputLocationBasePathMiddleware(basePath) {
  return function addInputLocationBasePathMiddleware() {
    return (next) => (action) => {
      const { type, payload } = action;

      switch (type) {
        // Transforms `NAVIGATE` action payload (`location`).
        case ActionTypes.NAVIGATE:
          return next({
            type,
            payload: {
              ...payload,
              location: addBasePath(payload.location, basePath),
            },
          });

        default:
          return next(action);
      }
    };
  };
}
