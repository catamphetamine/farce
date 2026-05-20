export default class NavigationOutOfBoundsError extends Error {
  constructor(index) {
    super(`Location index ${index} is out of navigation history bounds`);

    // The `index` property is publicly exposed.
    this.index = index;
  }
}
