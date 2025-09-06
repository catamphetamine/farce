// Converts `LocationInternal` object to a publicly-visible `Location` object.
// It hides non-essential properties of location such as `operation`, `index`, `delta`.
export default function getLocationFromInternalLocation(internalLocation) {
  // eslint-disable-next-line no-unused-vars
  const { operation, index, delta, ...location } = internalLocation;
  return location;
}
