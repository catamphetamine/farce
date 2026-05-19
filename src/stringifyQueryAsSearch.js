import stringifyQuery from './stringifyQuery.js';

export default function stringifyQueryAsSearch(query) {
  const queryString = stringifyQuery(query);
  if (queryString) {
    return `?${queryString}`;
  }
  return '';
}
