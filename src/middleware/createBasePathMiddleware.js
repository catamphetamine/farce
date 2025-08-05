import createTransformLocationMiddleware from './createTransformLocationMiddleware';

// Creates a "middleware" that, when a website is hosted under a certain path (`basePath`),
// automatically strips that starting segment from the `pathname` of `location`s.
export default function createBasePathMiddleware(basePath) {
  if (!basePath || basePath === '/') {
    // Fast path in case basePath is trivial.
    return () => (next) => next;
  }

  // Validate `basePath`.
  if (basePath[0] !== '/') {
    throw new Error('`basePath` must start with a slash');
  }

  // Remove trailing slash from `basePath`.
  const pathnamePrefix =
    basePath.slice(-1) === '/' ? basePath.slice(0, -1) : basePath;

  return createTransformLocationMiddleware({
    // Transforms input `Location`:
    // prepends `basePath` to the URL.
    transformInputLocation: (location) => ({
      ...location,
      pathname: `${pathnamePrefix}${location.pathname}`,
    }),

    // Transforms environment `Location` object:
    // removes `basePath` from the URL.
    transformEnvironmentLocation: (location) => ({
      ...location,
      pathname:
        // `farce` had a bug here:
        // `location.pathname` is supposed to always be non-empty.
        // If `basePath` is set to `/basePath` and the user navigates to `/basePath` URL, `createbasePathMiddleware()` simply strips the whole string from the URL and the result is incorrect: `pathname: ""`.
        // The fix is adding `|| '/'` after `location.pathname.slice(pathnamePrefix.length)`.
        // https://github.com/4Catalyzer/farce/issues/483
        location.pathname.indexOf(pathnamePrefix) === 0
          ? location.pathname.slice(pathnamePrefix.length) || '/'
          : null,
    }),
  });
}
