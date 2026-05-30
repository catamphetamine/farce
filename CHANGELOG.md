# 0.6.11 / 30.05.2026

- Fixed restoration of scroll position on previously-visited pages after a page reload.

# 0.6.10 / 27.05.2026

- Fixed clicking an "anchor" link, or manually editing the "anchor" part of the URL.

# 0.6.9 / 27.05.2026

- Added a default export. It's the same `NavigationStack` class as before but with "hardcoded" `WebBrowserEnvironment`. This simplifies application code because applications most likely never use any other kind of environment.
  - Old: `import { NavigationStack, WebBrowserEnvironment } from "navigation-stack"` and `new NavigationStack(WebBrowserEnvironment)`
  - New: `import NavigationStack from "navigation-stack"` and `new NavigationStack()`

# 0.6.4 / 20.05.2026

- (unlikely breaking change) Changed the API of `scrollPositionSetter`:
  - Changed the arguments of `ScrollPositionSetter.set()` function:
    - Old: `(scrollableContainer, scrollPositionOrAnchor, scrollPositionApi)`
    - New: `(scrollPositionOrAnchor, scrollableContainer)`
  - Changed the arguments of `ScrollPositionSetter()` constructor:
    - Old: `()`
    - New: `({ scrollPositionApi })`
  - Renamed `ScrollPositionSetter.cancel()` method to `.stop()`

# 0.6.0 / 17.05.2026

- Removed Redux.
- Removed CommonJS compatiblity. This means that this package now can't be `require()`d. This package can only be `import`ed now.
- Only [ES6](https://caniuse.com/?search=es6)-compliant web browsers are now supported, which are basically any web browsers released since mid-2017.
- Renamed `maintainScrollPosition` parameter of `NavigationStack` constructor to `manageScrollPosition`.
- Added `shouldChangePageScrollPositionOnLocationChange` parameter function to `NavigationStack` constructor.
- Added `shouldChangeScrollPositionOnLocationChange` parameter function to the `options` of `navigationStack.addScrollableContainer()` method.
- Renamed `ServerSideNavigationError` class to `ServerSideRedirectError`.
- Moved `addNavigationBlocker()` function to a `NavigationStack` instance method (name's the same).
- Changed the argument of `new NavigationStack()` from a "session" instance to an "environment" class.
- Now it exports "environment" classes rather than "session" classes: `WebBrowserSession` → `WebBrowserEnvironment`, etc.
- Added `navigationStack.dataStorage` property. It could be used to access the "data storage".
- Removed `/data-storage` subpackage. Removed `DataStorage` and `LocationDataStorage` class exports. "Data storage" is now integrated in `NavigationStack` as a feature.
- Removed `/scroll-position` subpackage. Removed `ScrollPositionRestoration` class export. Scroll position restoration is now integrated in `NavigationStack` as a feature.
- Added `scrollPositionSetter` option to `NavigationStack` constructor.
- Created a new package called `navigation-stack-react`. It contains the adaptation of `NavigationStack` for use in React framework.

# 0.5.0 / 07.09.2025

- Added `location.index` property.
- `location.operation` is now lowercase:
  - `"INIT"` → `"init"`
  - `"PUSH"` → `"push"`
  - `"REPLACE"` → `"replace"`
  - `"SHIFT"` → `"shift"`

# 0.4.0 / 06.09.2025

- Initial release after a refactoring.
