import parseLocationUrl from './parseLocationUrl.js';
import parseQueryFromSearch from './parseQueryFromSearch.js';
import stringifyQueryAsSearch from './stringifyQueryAsSearch.js';

function stringifyQueryParameterValue(value) {
  if (value === null || value === undefined) {
    return value;
  }
  return String(value);
}

// * If `location` is a string, it parses it into a `LocationBase`.
// * If `location` is an object, it ensures that `search` and `hash` properties aren't `undefined`,
//   i.e. it "ensures" that the `location` object can be used as a `LocationBase`.
export default function parseInputLocation(location) {
  if (typeof location === 'string') {
    return parseLocationUrl(location);
  }

  // Convert `query` property values to strings.
  if (location.query) {
    for (const key of Object.keys(location.query)) {
      if (typeof location.query[key] !== 'string') {
        location = {
          ...location,
          query: {
            ...location.query,
            [key]: stringifyQueryParameterValue(location.query[key]),
          },
        };
      }
    }
  }

  // Create `query` from `search`.
  if (location.search && !location.query) {
    location = {
      ...location,
      query: parseQueryFromSearch(location.search),
    };
  }

  // Convert `query` object into a `search` string
  // if `query` is present but `search` is not.
  if (location.query && !location.search) {
    location = {
      ...location,
      search: stringifyQueryAsSearch(location.query),
    };
  }

  // Set default values for properties that're not present.
  // Ignore unknown properties.
  const { state } = location;
  location = {
    pathname: location.pathname,
    query: location.query || {},
    search: location.search || '',
    hash: location.hash || '',
  };
  if (state) {
    location.state = state;
  }

  // Return `location`.
  return location;
}
