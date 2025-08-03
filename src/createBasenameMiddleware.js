import createLocationMiddleware from './createLocationMiddleware';

export default function createBasenameMiddleware({ basename }) {
  if (!basename || basename === '/') {
    // Fast path in case basename is trivial.
    return () => (next) => next;
  }

  // Normalize away trailing slash on basename.
  const pathnamePrefix =
    basename.slice(-1) === '/' ? basename.slice(0, -1) : basename;

  return createLocationMiddleware({
    makeLocationDescriptor: (location) => ({
      ...location,
      pathname: `${pathnamePrefix}${location.pathname}`,
    }),
    makeLocation: (location) => ({
      ...location,
      pathname:
        // `farce` had a bug here:
        // `location.pathname` is supposed to always be non-empty.
        // If `basename` is set to `/basename` and the user navigates to `/basename` URL, `createBasenameMiddleware()` simply strips the whole string from the URL and the result is incorrect: `pathname: ""`.
        // The fix is adding `|| '/'` after `location.pathname.slice(pathnamePrefix.length)`.
        // https://github.com/4Catalyzer/farce/issues/483
        location.pathname.indexOf(pathnamePrefix) === 0
          ? location.pathname.slice(pathnamePrefix.length) || '/'
          : null,
    }),
  });
}
