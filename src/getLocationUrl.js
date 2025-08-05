export default function getLocationUrl({ pathname, search, hash }) {
  return `${pathname}${search}${hash}`;
}
