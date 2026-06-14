import isRelativeUrl from './isRelativeUrl.js';
import parseQueryFromSearch from './parseQueryFromSearch.js';

export default function parseLocationUrl(url) {
  if (!isRelativeUrl(url)) {
    throw new Error('Must be a relative URL');
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
    query: parseQueryFromSearch(search) || {},
    hash,
  };
}
