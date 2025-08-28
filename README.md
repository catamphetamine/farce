# navigation-stack

[![npm version](https://img.shields.io/npm/v/navigation-stack.svg?style=flat-square)](https://www.npmjs.com/package/navigation-stack)
[![npm downloads](https://img.shields.io/npm/dm/navigation-stack.svg?style=flat-square)](https://www.npmjs.com/package/navigation-stack)

Handles navigation in a web browser. Represents web browser navigation history as a "stack" data structure. Provides operations to perform programmatic navigation such as "push" (go to new URL), "replace" (redirect to new URL), "shift" (rewind to a previously visited URL). Provides a subscription mechanism to get notified on current location change.

Originally forked from [`farce`](http://npmjs.com/package/farce) package to fix a [bug](https://github.com/4Catalyzer/farce/issues/483).

## Install

```
npm install navigation-stack
```

## Use

`navigation-stack` provides "middlewares", "actions" and a "reducer" that could be used with `redux` or any other `redux`-compatible package such as [`mini-redux`](https://www.npmjs.com/package/mini-redux).

```js
import { createStore, applyMiddleware } from 'redux'

import {
  createMiddlewares,
  locationReducer,
  Actions,
  BrowserSession
} from 'navigation-stack'

// Create a Redux store.
const store = createStore(
  locationReducer, // Reducer function. For example, `locationReducer()`.
  applyMiddleware(...createMiddlewares(new BrowserSession()))
)

// Initialize navigation.
store.dispatch(Actions.init())
```

After that, dispatch any of the `Actions` in order to navigate.

```js
// To navigate to a new page.
store.dispatch(Actions.push('/new/location'))

// To redirect to a new page.
store.dispatch(Actions.replace('/new/location'))

// To go back.
store.dispatch(Actions.shift(-1))

// To go forward.
store.dispatch(Actions.shift(1))
```

To view the current location:

```js
// When `locationReducer()` is used,
// `store.getState()` is the current location.
console.log(store.getState())
```

(optional) (advanced) Stop and clean up:

```js
store.dispatch(Actions.dispose())
```

## Current Location

To track the current location, the application could listen to `ActionTypes.UPDATE` action. The `payload` of the action is the current location.

For example, below is the source code for the default `locationReducer`.

```js
import { ActionTypes } from 'navigation-stack'

// With this reducer, `state` would always tell the current location.
function reducer(state, action) {
  if (action.type === ActionTypes.UPDATE) {
    // `action.payload` is the current location.
    return action.payload
  }
  return state
}
```

With this reducer, `store.getState()` will return the current location.

Calling `store.dispatch(Actions.init())` will trigger the initial `ActionTypes.UPDATE` action which will set the initial current location. From then on, the current location will always stay in sync with the web browser's URL bar, including "Back"/"Forward" navigation.

A `location` object has all the properties of a [standard web browser location](https://developer.mozilla.org/en-US/docs/Web/API/Window/location) with the addition of:
* `query: object` — URL query parameters.
* `index: number` — The index of the location in the navigation history, starting with `0` for the initial location.
* `action: string` — The type of navigation that led to the location.
  * `INIT` in case of the initial location before any navigation has taken place.
  * `SHIFT` when the user performs a "Back" or "Forward" navigation, or after a `.shift()` navigation which is essentially a "back or forward navigation".
  * `PUSH` in case of a `.push()` navigation, i.e. "normal navigation via a hyperlink".
  * `REPLACE` in case of a `.replace()` navigation, i.e. "redirect".
* `delta: number` — the difference between the `index` of the current location and the `index` of the previous location.
  * `0` for the initial location before any navigation has taken place.
  * `1` after a `.push()` navigation, i.e. "normal navigation via a hyperlink".
  * `0` after a `.replace()` navigation, i.e. "redirect".
  * `delta: number` after a `.shift(delta)` navigation, i.e. "back or forward navigation".
  * `-1` after the user clicks a "Back" button in their web browser.
  * `1` after the user clicks a "Forward" button in their web browser.
* `key: string` — a unique ID of the `location` object within the navigation history.

## Subscribe to Location Changes

One could use Redux'es standard [subscription mechanisms](https://redux.js.org/api/store#subscribelistener) to immediately get notified of current location changes.

```js
let currentLocation

// Create a Redux store.
const store = createStore(
  locationReducer, // Reducer function. For example, `locationReducer()`.
  applyMiddleware(...createMiddlewares(new BrowserSession()))
)

// Subscribe to any potential Redux state changes.
const unsubscribe = store.subscribe(() => {
  const previousLocation = currentLocation
  currentLocation = store.getState() // In case of using `locationReducer()`.
  if (currentLocation !== previousLocation) {
    console.log('Location has changed')
  }
})

// Initialize navigation.
// Emitting a Redux action will trigger the listener.
store.dispatch(Actions.init())

// Stop listening to current location changes.
unsubscribe()
```

## Why Redux?

Why complicate things by providing "middlewares", "actions" and a "reducer" when it could be just a conventional API? That's because always knowing the "current location" means having to deal with "state management" in one way or another, and the simplest and most popular "state management" toolkit to date seems to be Redux.

If it was just about dispatching the `Actions` then of course it wouldn't require any "state management". But it's the "get current location" piece that changes the whole picture. One could say that using Redux for such a simple task is an overkill but actually reinventing a wheel is what I would consider "overkill". It's like crafting your own screwdriver just because the one from Walmart feels too bulky.

## Session

Navigation is performed within a given "session". A "session" sets the boundaries within a given navigation session exists, so that each user (and then each their browser tab) would have a separate navigation session. A specific "session" implementation maps `navigation-stack` concepts to their physical execution, such as web browser API. Three different "session" implementations are shipped with this package: `BrowserSession`, `ServerSession` and `MemorySession`.

```js
import {
  BrowserSession,
  ServerSession,
  MemorySession
} from 'navigation-stack'

new BrowserSession()
new ServerSession('/initial-location-url')
new MemorySession('/initial-location-url')
```

- Use `BrowserSession` in a web browser. The navigation session is automatically limited to a given web browser tab and survives a page refresh.
- Use `ServerSession` in server-side rendering. Create a separate `ServerSession` for each incoming HTTP request.
- Use `MemorySession` in tests to mimick a `BrowserSession`. Create a separate `MemorySession` for each separate navigation session.
  - `MemorySession` supports saving and restoring its state, althrough there doesn't seem to be any real-world use for this feature. Yet, it exists. To enable state restoration, pass an optional second argument — an `options` object with properties:
    - `save(key: string, data: string)` — Saves `data` under the `key`.
    - `load(key: string)` — Loads the data stored under the `key`.

## Base Path

If the web application is hosted under a certain URL prefix, it should be specified in `createMiddlewares()` call as `basePath` parameter.

```js
createMiddlewares(session, { basePath?: '/base/path' })
```

## Location State Storage

One could use `LocationDataStorage` in order to store location-specific data. For example, one could store scroll position of a page and then restore that scroll position when the user decides to navigate "Back" to the page.

```js
import { BrowserSession, LocationDataStorage } from 'navigation-stack'

const session = new BrowserSession()

const storage = new LocationDataStorage(session, { namespace?: 'optional-namespace' })

const location = { pathname: '/abc' }

storage.set(location, 'key', 123)
storage.get(location, 'key') === 123
```

`LocationDataStorage` doesn't provide any guarantees about actually storing the data: if it encounters any errors in the process, it simply ignores them. This simplifies the API in a way that the application doesn't have to wrap `.get()`/`.set()` calls in a `try/catch` block. And judging by the nature of location-specific data, that type of data is inherently non-essential and rather "nice-to-have".

One might ask: Why use `LocationDataStorage` when one could simply store the data in a usual variable? The answer is that a usual variable doesn't survive if the user decides to refresh the page. But the entire navigation history does survive because that's how web browsers work. So if the user decides to go "Back" after refreshing the current page, the data associated to that previous location would already be lost and can't be recovered. In contrast, when using a `LocationDataStorage` with a `BrowserSession`, the stored data does survive a page refresh, which feels more consistent and coherent with the persistence behavior of the navigation history itself.

## Get Notified Before Location Changes

One could subscribe to "before change" events of the current location by calling `addBeforeLocationChangeListener()` exported function. The listener function will be called before the `location` object in Redux state is updated. This might be a suitable opportunity to save location-specific state such as the scroll position.

```js
import { createStore, applyMiddleware } from 'redux'

import {
  createMiddlewares,
  locationReducer,
  Actions,
  BrowserSession,
  addBeforeLocationChangeListener
} from 'navigation-stack'

const session = new BrowserSession()

// Create a Redux store.
const store = createStore(
  locationReducer, // Reducer function. For example, `locationReducer()`.
  applyMiddleware(...createMiddlewares(session))
)

// Subscribe to "before location change" events.
const removeBeforeLocationChangeListener = addBeforeLocationChangeListener(
  session,
  (newLocation) => {
    console.log(newLocation)
  }
);

// Initialize navigation.
// This will not trigger the listener because it's not a navigation.
store.dispatch(Actions.init())

// This navigation event will trigger the listener.
// `newLocation.action` will be "PUSH".
store.dispatch(Actions.push('/new/location'))

// Unsubscribe from "before location change" events.
removeBeforeLocationChangeListener()
```

## Block Navigation

`navigation-stack` provides the ability to block navigation. Call `addNavigationBlocker()` exported function to set up a navigation blocker.

```js
import { createStore, applyMiddleware } from 'redux'

import {
  createMiddlewares,
  locationReducer,
  Actions,
  BrowserSession,
  addNavigationBlocker
} from 'navigation-stack'

const session = new BrowserSession()

// Create a Redux store.
const store = createStore(
  locationReducer, // Reducer function. For example, `locationReducer()`.
  applyMiddleware(...createMiddlewares(session))
)

// Initialize navigation.
store.dispatch(Actions.init())

// Add navigation blocker.
const removeNavigationBlocker = addNavigationBlocker(
  session,
  (newLocation) => {
    // Returning `true` means "block this navigation".
    return true
  }
);

// This navigation won't be performed.
store.dispatch(Actions.push('/new/location'))

// Remove the navigation blocker.
removeNavigationBlocker()

// This navigation now will be performed.
store.dispatch(Actions.push('/new/location'))
```

Navigation blocker should be a function that receives a `newLocation` argument and could be "synchronous" or "asynchronous" (i.e. return a `Promise`, aka `async`/`await`).

The `newLocation` argument of a blocker function won't necessarily have a `key` or `index` property but other properties are present.

Navigation blockers fire both when navigating from one page to another and when closing the current browser tab. In the latter case, `newLocation` argument will be `null`, the function can't return a `Promise`, and returning `true` will cause the web browser to show a confirmation modal with a non-customizable browser-specific text.

## Utility

This package exports a couple of utility functions.

```js
import {
  addBasePath,
  removeBasePath,
  getLocationUrl,
  parseLocationUrl
} from 'navigation-stack'

// Parses a location URL to a location object.
// If there're no query parameters, `query` property will be an empty object.
parseLocationUrl('/abc?d=e') === {
  pathname: '/abc',
  search: '?d=e',
  query: { d: 'e' },
  hash: ''
}

// Converts a location object to a location URL.
getLocationUrl({ pathname: '/abc', search: '?d=e', hash: '' }) === '/abc?d=e'

// Adds `basePath` to a location object or a location URL.
addBasePath('/abc', '/base-path') === '/base-path/abc'
addBasePath({ pathname: '/abc' }, '/base-path') === { pathname: '/base-path/abc' }

// Removes `basePath` from a location object or a location URL.
// If `basePath` is not present in location, it won't do anything.
removeBasePath('/base-path/abc', '/base-path') === '/abc';
removeBasePath({ pathname: '/base-path/abc' }, '/base-path') === { pathname: '/abc' }
```

## Development

Clone the repository. Then:

```
yarn
yarn format
yarn test
```
