import stringifyQuery from './stringifyQuery';

export default function stringifyQueryAsSearch(query) {
  const queryString = stringifyQuery(query);
  if (queryString) {
    return `?${queryString}`;
  }
  return '';
}
