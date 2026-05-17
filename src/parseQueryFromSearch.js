import parseQueryString from './parseQueryString';

export default function parseQueryFromSearch(search) {
  if (search.length > '?'.length) {
    return parseQueryString(search.slice('?'.length));
  }
  return {};
}
