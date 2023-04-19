export default function ensureLocation(location, { origin } = {}) {
  if (!origin) {
    if (typeof window === 'undefined') {
      throw new Error(
        '[farce] `origin` parameter is required when calling `ensureLocation()`',
      );
    }
    origin = window.location.origin;
  }

  if (typeof location === 'object') {
    // Set default values for fields other than pathname.
    return {
      search: '',
      hash: '',
      origin,
      ...location,
    };
  }

  let remainingPath = location;

  const hashIndex = remainingPath.indexOf('#');
  let hash;
  if (hashIndex !== -1) {
    hash = remainingPath.slice(hashIndex);
    remainingPath = remainingPath.slice(0, hashIndex);
  } else {
    hash = '';
  }

  const searchIndex = remainingPath.indexOf('?');
  let search;
  if (searchIndex !== -1) {
    search = remainingPath.slice(searchIndex);
    remainingPath = remainingPath.slice(0, searchIndex);
  } else {
    search = '';
  }

  return {
    origin,
    pathname: remainingPath,
    search,
    hash,
  };
}
