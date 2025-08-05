import { stringify as stringifyQuery } from 'query-string';

function parseLocationUrl(url) {
  if (url[0] !== '/') {
    throw new Error('Expected URL to start with a slash');
  }

  let remainingPath = url;

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
    pathname: remainingPath,
    search,
    hash,
  };
}

// * If `location` is a string, it parses it into a `NormalizedInputLocation`.
// * If `location` is an object, it ensures that `search` and `hash` properties aren't `undefined`,
//   i.e. it "ensures" that the `location` object can be used as a `NormalizedInputLocation`.
export default function normalizeInputLocation(location) {
  if (typeof location === 'string') {
    return parseLocationUrl(location);
  }

  // Convert `query` object into a `search` string.
  if (location.query !== undefined) {
    const { query, ...rest } = location;
    const queryString = stringifyQuery(query);
    return {
      ...rest,
      search: queryString ? `?${queryString}` : '',
      hash: location.hash || '',
    };
  }

  return {
    ...location,
    search: location.search || '',
    hash: location.hash || '',
  };
}
