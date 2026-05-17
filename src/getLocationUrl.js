import stringifyQueryAsSearch from './stringifyQueryAsSearch';

export default function getLocationUrl({ pathname, search, query, hash }) {
  if (!search && query) {
    search = stringifyQueryAsSearch(query);
  }

  return `${pathname}${search || ''}${hash || ''}`;
}
