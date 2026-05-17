// Converts `Location` object to a `LocationBase` object.
// It hides properties of location such as `key` or `index`.
export default function getLocationBaseFromLocation(location) {
  // eslint-disable-next-line no-unused-vars
  const { key, index, ...locationBase } = location;
  return locationBase;
}
