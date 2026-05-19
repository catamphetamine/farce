import parseQueryString from './parseQueryString.js';

export default function parseQueryFromSearch(search) {
  if (search.length > '?'.length) {
    return parseQueryString(search.slice('?'.length));
  }
  return {};
}
