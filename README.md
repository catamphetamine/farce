<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

**Table of Contents** _generated with [DocToc](https://github.com/thlorenz/doctoc)_

- [Farce [![Travis][build-badge]][build] [![npm][npm-badge]][npm]](#farce-travisbuild-badgebuild-npmnpm-badgenpm)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Farce [![Travis][build-badge]][build] [![npm][npm-badge]][npm]

This is a fork of the original [`farce`](https://github.com/4Catalyzer/farce/) package with some changes:

- [Fixed](https://github.com/catamphetamine/farce/commit/dfb46cd6f8b18987ac9e66a76a14261f14f764b8) empty `location.pathname` [bug](https://github.com/4Catalyzer/farce/issues/483) in `createBasenameMiddleware.js` when using a `basename`.
- Fixed a [bug](https://github.com/4Catalyzer/farce/issues/491) in `createNavigationListenerMiddleware.js` when it didn't correctly clear navigation listeners on `DISPOSE` event.
- Replaced `redux` with a basic stub of it. The rationale is that the `redux` that was used under the hood by this package would conflict with the redux used by the application itself.
- Removed unused `createHref()` and `createLocation()` actions.
- Removed unused `HashProtocol`.
- Removed `store.farce.addNavigationListener()` function. As a replacement, it now exports a new function `addNavigationListener()`.
- Removed `createHistoryEnhancer()` function. As a replacement, it now exports a new function `createReduxMiddlewares()`.

---

This fork is exclusively used by [`react-pages`](http://npmjs.com/package/react-pages) package.

The source code is available at [github.com](https://github.com/catamphetamine/farce) or [gitlab.com](https://gitlab.com/catamphetamine/farce).

---

How `farce` works in general:

- It provides Redux actions that could be dispatched:
  - `type: PUSH` — navigates to a page.
  - `type: REPLACE` — redirects to a page: replaces the current page with the new one without the ability to go "Back" to the current one.
  - `type: GO` — goes "Back"/"Forward".
- Whenever one of the Redux actions above is dispatched, it emits a `type: UPDATE_LOCATION` Redux action. The `action` property of the Redux action will be:
  - `"PUSH"` when dispatching a `type: PUSH` action.
  - `"REPLACE"` when dispatching a `type: REPLACE` action.
  - `"POP"` when dispatching a `type: GO` action.
- It listens to "Back"/"Forward" navigation: whenever it happens, it emits a `type: UPDATE_LOCATION` Redux action. The `action` property of the Redux action will be `"POP"`.
- The application could listen to `type: UPDATE_LOCATION` Redux action and read the `location` property from that action to always have the up-to-date `location` object.
- No `type: UPDATE_LOCATION` Redux action will be emitted in case of any changes that were made using [History API](https://developer.mozilla.org/en-US/docs/Web/API/History_API) directly, such as `history.pushState()`, `history.replaceState()`, etc. So those changes to the current URL will go unnoticed by this library.
