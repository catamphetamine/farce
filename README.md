# navigation-stack

[![npm version](https://img.shields.io/npm/v/navigation-stack.svg?style=flat-square)](https://www.npmjs.com/package/navigation-stack)
[![npm downloads](https://img.shields.io/npm/dm/navigation-stack.svg?style=flat-square)](https://www.npmjs.com/package/navigation-stack)

Handles navigation in a web browser. Represents web browser navigation history as a "stack" data structure. Provides operations to perform programmatic navigation such as "push" (go to new URL), "replace" (redirect to new URL), "shift" (rewind to a previously visited URL). Provides a subscription mechanism to get notified on location changes.

Also supports automatic [scroll position restoration](#scroll-position-restoration) on "Back"/"Forward" navigation.

Originally forked from [`farce`](http://npmjs.com/package/farce) package to fix a couple of small bugs ([1](https://github.com/4Catalyzer/farce/issues/483), [2](https://github.com/4Catalyzer/farce/issues/491)). Then merged it with [`scroll-behavior`](http://npmjs.com/package/scroll-behavior) package to fix a couple of small bugs ([1](https://github.com/taion/scroll-behavior/issues/215), [2](https://github.com/taion/scroll-behavior/pull/472)). Then decided to completely rewrite the entire code and changed the API to my liking.

## Install

```
npm install navigation-stack
```

## Use

Any changes to a `NavigationStack` instance are "magically" reflected in the web browser's address bar and navigation history, and vice versa: any changes to the URL in the web browser's address bar are "magically" reflected in the `NavigationStack` instance. So one could think of `NavigationStack` as a very convenient proxy to web browser's address bar and navigation history. What's left to the application is to subscribe to `navigationStack` changes and re-render the page accordingly.

Start by creating a `NavigationStack` instance.

```js
import { NavigationStack, WebBrowserSession } from 'navigation-stack'

// Create a `NavigationStack` instance.
// It should be tied to a navigation "session".
const navigationStack = new NavigationStack(new WebBrowserSession())
```

Then subscribe to changes:

```js
// Subscribe to location changes.
// The first call happens for the initial location.
// Next calls will happen in case of navigation.
const unsubscribe = navigationStack.subscribe((location) => {
  console.log('Current location', location)
  document.body.innerHTML = '<div>' + location.pathname + '</div>'
})
```

Now ready to perform navigation actions.

```js
// Sets the initial location.
navigationStack.init()

// Sets the `location` to be a new location.
//
// Also updates the URL in the web browser's address bar.
//
// Also adds a new entry in the web browser's navigation history.
//
navigationStack.push('/new-location')

// Sets the `location` to be a new location.
//
// Also updates the URL in the web browser's address bar.
//
// Does not add a new entry in the web browser's navigation history
// which is the only difference between this and `Actions.push()`.
//
navigationStack.replace('/new-location')

// Sets the `location` to be a previous one (if there is one).
// If there's no such `location` in the navigation history,
// throws a `NavigationOutOfBoundsError` error that has an `index` property.
//
// One could think of it as an equivalent of clicking a "Back" button in a web browser.
//
// Also updates the URL in the web browser's address bar.
//
// Also shifts the current position in the web browser's navigation history.
//
navigationStack.shift(-1)

// Sets the `location` to be a next one (if there is one).
// If there's no such `location` in the navigation history,
// throws a `NavigationOutOfBoundsError` error that has an `index` property.
//
// One could think of it as an equivalent of clicking a "Forward" button in a web browser.
//
// Also updates the URL in the web browser's address bar.
//
// Also shifts the current position in the web browser's navigation history.
//
navigationStack.shift(1)
```

To get the current location:

```js
const location = navigationStack.current()
console.log(location)
```

(optional) After the user is done using the app, stop the session and clean up any listeners.

```js
// (optional)
// When the user closes the application,
// stop the session and clean up any listeners.
// There's no need to do this in a web browser.
unsubscribe()
navigationStack.stop()
```

## Current Location

<!--
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

Calling `store.dispatch(Actions.init(window.location))` will trigger the initial `ActionTypes.UPDATE` action which will set the initial current location. From then on, the current location will always stay in sync with the web browser's URL bar, including "Back"/"Forward" navigation.
-->

To get the current location, use `navigationStack.current()`.

Current `location` object has all the properties of a [standard web browser location](https://developer.mozilla.org/en-US/docs/Web/API/Window/location) with the addition of:
* `query: object` — URL query parameters.
* `key: string` — A string ID of the location that is guaranteed to be unique within the session's limits and could be used as a "key" to store any supplementary data associated to this location.
* `index: number` — The index of the location in the navigation stack, starting with `0` for the initial location.

<!-- ## Subscribe to Location Changes -->

<!--
One could use Redux'es standard [subscription mechanisms](https://redux.js.org/api/store#subscribelistener) to immediately get notified of current location changes.

```js
let currentLocation

// Create a Redux store.
const store = createStore(
  locationReducer, // Reducer function. For example, `locationReducer()`.
  applyMiddleware(...createMiddlewares(new WebBrowserSession()))
)

// Subscribe to any potential Redux state changes.
const unsubscribe = store.subscribe(() => {
  const previousLocation = currentLocation
  currentLocation = store.getState() // In case of using `locationReducer()`.
  if (currentLocation !== previousLocation) {
    // The first time is for the initial location.
    // Next times will happen in case of navigation.
    console.log('Location has changed')
  }
})

// Initialize navigation with an initial location.
//
// It will trigger the listener.
//
store.dispatch(Actions.init(window.location))

// Stop listening to current location changes.
unsubscribe()
```
-->

<!--
One could subscribe to location changes by calling `navigationStack.subscribe()`.

```js
// Create a `NavigationStack` instance.
// It should be tied to a navigation "session".
const navigationStack = new NavigationStack(new WebBrowserSession())

// Subscribe to location changes.
// The first call happens for the initial location.
// Next calls will happen in case of navigation.
const unsubscribe = navigationStack.subscribe((location) => {
  console.log('Current location', location)
})

// Navigate to a new location.
// It will trigger the listener.
navigationStack.push('/new-location')

// Stop listening to location changes.
unsubscribe()
```
-->

<!--
## Why Redux?

Why complicate things by providing "middlewares", "actions" and a "reducer" when it could be just a conventional API? That's because always knowing the "current location" means having to deal with "state management" in one way or another, and the simplest and most popular "state management" toolkit to date seems to be Redux.

If it was just about dispatching the `Actions` then of course it wouldn't require any "state management". But it's the "get current location" piece that changes the whole picture. One could say that using Redux for such a simple task is an overkill but actually reinventing a wheel is what I would consider "overkill". It's like crafting your own screwdriver just because the one from Walmart feels too bulky.
-->

## Scroll Position Restoration

Pass `maintainScrollPosition: true` option to keep track of scroll position on every page and then automatically restore it on "Back" or "Forward" navigation.

```js
import { NavigationStack, WebBrowserSession } from 'navigation-stack'

// Create a `NavigationStack` instance with a `maintainScrollPosition: true` option.
const navigationStack = new NavigationStack(new WebBrowserSession(), {
  maintainScrollPosition: true
})

//----------------------------------------------------------------------------------------

// Sets the initial location.
navigationStack.init()

// Render the initial location.
document.body.innerHTML = '<div> Initial Location </div>'

// As soon as a page has been rendered, without any delay, tell `NavigationStack` to restore
// a previously-saved scroll position, if there's any.
//
// This method must be called both for the initial location and any subsequent location.
//
navigationStack.locationRendered()

//----------------------------------------------------------------------------------------

// Set the `location` to be a new location.
//
// This also updates the URL in the web browser's address bar
// and adds a new entry in the web browser's navigation history.
//
navigationStack.push('/new-location')

// Render the new location.
document.body.innerHTML = '<div> New Location </div>'

// The new location is now rendered.
// Immediately after it has been rendered, call `.locationRenered()`.
// There's no scroll position to restore because it's not a previously-visited location.
navigationStack.locationRendered()

//----------------------------------------------------------------------------------------

// Set `location` "back" to the initial location.
//
// This also updates the URL in the web browser's address bar
// and repositions the "current location" pointer in the web browser's navigation history.
//
navigationStack.shift(-1)

// Render the initial location.
document.body.innerHTML = '<div> Initial Location </div>'

// The initial location is now rendered.
// Immediately after it has been rendered, call `.locationRenered()`.
// Restores the scroll position at the initial location.
navigationStack.locationRendered()

//----------------------------------------------------------------------------------------

// (optional)
// When the user is about to close the application,
// stop the `NavigationStack` and clean up any of its listeners.
// This is not required in a web browser because it cleans up all listeners
// automatically when closing a tab.
navigationStack.stop()
```

`NavigationStack` provides methods:

* `addScrollableContainer(key: string, element: Element)` — Use it in cases when it should restore not only the page scroll position but also the scroll position(s) of any other scrollable container(s). Returns a "remove scrollable container" function.
* `locationRendered()` — Call it every time a different location has been rendered, including the initial location, without any delay, i.e. immediately after a different location has been rendered.

<details>
<summary>Using scroll position restoration feature without <code>NavigationStack</code></summary>

######

To use the scroll position restoration feature independently of a `NavigationStack` instance (e.g. without it), create a `ScrollPositionRestoration` instance and pass a `session` argument to it.

```js
import { WebBrowserSession } from 'navigation-stack'
import { ScrollPositionRestoration } from 'navigation-stack/scroll-position'

// Create a `ScrollPositionRestoration`.
const scrollPositionRestoration = new ScrollPositionRestoration(new WebBrowserSession())

//----------------------------------------------------------------------------------------

// If you decide to use `NavigationStack` or Redux-way `createMiddlewares()` for navigation,
// it should be tied to the same session.
//
// const navigationStack = new NavigationStack(session)
// navigationStack.init()
//
// Or, navigation could be performed by any other means such as using `window.history.pushState()`.
// The only requirement is for the "current location" object to have a `key` property
// which the standard `window.location` object doesn't provide.
//
window.history.replaceState({ key: '123' }, '', '/initial-location')

// Render the initial location.
document.body.innerHTML = '<div> Initial Location </div>'

// Immediately after a page has been rendered, without any delay,
// call `.locationRendered()` method with the "current location" object as the argument.
scrollPositionRestoration.locationRendered({ key: '123', pathname: '/initial-location' })

//----------------------------------------------------------------------------------------

// Navigate to a new location.
//
// For example, it could use `NavigationStack` for navigation.
//
// navigationStack.push('/new-location')
//
// Or, navigation could be performed by any other means such as using `window.history.pushState()`.
//
window.history.pushState({ key: '456' }, '', '/new-location')

// Render the new location.
document.body.innerHTML = '<div> New Location </div>'

// The new location is now rendered.
// Call `.locationRendered()` immediately after it has been rendered, i.e. without any delay.
// There's no scroll position to restore because it's not a previously-visited location.
// The "current location" object must have a `key`.
scrollPositionRestoration.locationRendered({ key: '456', pathname: '/new-location' })

//----------------------------------------------------------------------------------------

// Navigate "back" to the initial location.
//
// For example, it could use `NavigationStack` for navigation.
//
// navigationStack.shift(-1)
//
// Or, navigation could be performed by any other means such as using `window.history.go()`.
//
window.history.go(-1)

// Render the initial location.
document.body.innerHTML = '<div> Initial Location </div>'

// The initial location is now rendered.
// Call `.locationRendered()` immediately after it has been rendered, i.e. without any delay.
// It will restore the scroll position at the initial location.
// The "current location" object must have a `key`.
scrollPositionRestoration.locationRendered({ key: '123', pathname: '/initial-location' })

//----------------------------------------------------------------------------------------

// (optional)
// When the user is about to close the application,
// stop the `ScrollPositionRestoration` and clean up any of its listeners.
// This is not required in a web browser because it cleans up all listeners
// automatically when closing a tab.
scrollPositionRestoration.stop()

// (optional)
// In case of using `NavigationStack` for navigation,
// stop the `NavigationStack` and clean up any of its listeners.
//
// navigationStack.stop()
```

`ScrollPositionRestoration` provides methods:

* `addScrollableContainer(key: string, element: Element)` — Use it in cases when it should restore not only the page scroll position but also the scroll position(s) of any other scrollable container(s). Returns a "remove scrollable container" function.
* `locationRendered(location)` — Call it every time a different location has been rendered, including the initial location, without any delay, i.e. immediately after a different location has been rendered. The location argument must have a `key`.
* `stop()` — Stops scroll position restoration and clears any listeners or timers.
</details>

## Base Path

<!--
If the web application is hosted under a certain URL prefix, it should be specified in `createMiddlewares()` call as `basePath` parameter.

```js
createMiddlewares(session, { basePath?: '/base-path' })
```
-->

If the web application is hosted under a certain URL prefix, it should be specified as a `basePath` parameter when creating a `NavigationStack` instance. This prefix will automatically be added to the URL in the web browser's address bar while the `location` object itself won't include it in the `pathname`.

```js
new NavigationStack(new WebBrowserSession(), { basePath: '/base-path' })
```

## Session

A "session" ties `NavigationStack` to the environment it operates in, such as a web browser.

Three different "session" implementations are shipped with this package:

- Use `WebBrowserSession` in a web browser. Such session survives a page refresh and is automatically destroyed when the web browser tab gets closed.
- Use `ServerSideRenderSession` in server-side rendering. Create a separate session for each incoming HTTP request. Initialize it with a relative URL of the HTTP request. If, during server-side render, the application code attempts to navigate to another location, it will throw a `ServerSideNavigationError` with a `location` property in it.
- Use `InMemorySession` in tests to mimick a `WebBrowserSession`. Create a separate session for each separate navigation session. Initialize it with a relative URL or a location object.

<details>
<summary>See <code>ServerSideRenderSession</code> example</summary>

######

```js
const navigationStack = new NavigationStack(new ServerSideRenderSession())

navigationStack.subscribe((location) => {
  console.log('Current location', location)
})

// Sets the initial location.
// Triggers the subscription listener.
navigationStack.init('/initial-location')

// Navigates to a new location.
// Throws `ServerSideNavigationError` with a `location` property.
navigationStack.push('/new-location')
```
</details>


<details>
<summary>See <code>InMemorySession</code> example</summary>

######

```js
const navigationStack = new NavigationStack(new InMemorySession())

navigationStack.subscribe((location) => {
  console.log('Current location', location)
})

// Sets the initial location.
// Triggers the subscription listener.
navigationStack.init('/initial-location')

// Navigates to a new location.
// Triggers the subscription listener.
navigationStack.push('/new-location')
```
</details>

######

Every "session" has a unique `key`.

Once created, a "session" is simply passed to the `NavigationStack` constructor and then you don't have to deal with it anymore — `NavigationStack` will pull all the strings for you.

However, if someone prefers to completely bypass `NavigationStack` and interact with a "session" object directly, they could do so.

<details>
<summary>See "session" API</summary>

######

* `key: string` — A unique ID of the session.
* `subscribe(listener: (location) => {}): () => {}` — Subscribes to location changes, including setting the initial location. Returns an "unsubscribe" function. The `location` argument of the listener function is an "extended" location object having additional properties:
  * `operation: string` — The type of navigation that led to the location.
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
<!-- * `getInitialLocation(): object?` — Returns the initial location, if the session can get it from somewhere. For example, in a web browser, the initial location can be read from `window.location`. In other environments, such as server side, the initial location can't be read from anywhere. -->
* `start(initialLocation?: object)` — Starts the session. The `initialLocation` argument is optional when the session can read it from somewhere. For example, `WebBrowserSession` can read `initialLocation` from `window.location`.
* `stop()` — Stops the session. Cleans up any listeners, etc.
* `navigate(operation: string, location: object)` — Navigates to a `location` using either `"PUSH"` or `"REPLACE"` operation. The `location` argument should be a result of calling `parseInputLocation()` function.
* `shift(delta: number)` — Navigates "back" or "forward" by skipping a specified count of pages. Negative `delta` skips backwards, positive `delta` skips forward.
</details>

## Utility

This package exports a few utility functions for transforming locations.

```js
import {
  getLocationUrl,
  parseLocationUrl,
  parseInputLocation,
  addBasePath,
  removeBasePath
} from 'navigation-stack'

// The following two are "mutually inverse functions":
// one maps a `location` object to a URL string
// and the other maps a URL string to a `location` object.

// Converts a location object to a location URL.
getLocationUrl({ pathname: '/abc', search: '?d=e' }) === '/abc?d=e'

// Parses a location URL to a location object.
// If there're no query parameters, `query` property will be an empty object.
parseLocationUrl('/abc?d=e') === {
  pathname: '/abc',
  search: '?d=e',
  query: { d: 'e' },
  hash: ''
}

// The following function parses a non-strict location object to a strict one.
// It also parses a location URL to a location object.

parseInputLocation({ pathname: '/abc', search: '?d=e' }) === {
  pathname: '/abc',
  search: '?d=e',
  query: { d: 'e' },
  hash: ''
}

parseInputLocation('/abc?d=e') === {
  pathname: '/abc',
  search: '?d=e',
  query: { d: 'e' },
  hash: ''
}

// The following two functions can be used to add base path to a location
// or to remove it from it.

// Adds `basePath` to a location object or a location URL.
addBasePath('/abc', '/base-path') === '/base-path/abc'
addBasePath({ pathname: '/abc' }, '/base-path') === { pathname: '/base-path/abc' }

// Removes `basePath` from a location object or a location URL.
// If `basePath` is not present in location, it won't do anything.
removeBasePath('/base-path/abc', '/base-path') === '/abc';
removeBasePath({ pathname: '/base-path/abc' }, '/base-path') === { pathname: '/abc' }
```

## Block Navigation

`navigation-stack` provides the ability to block navigation. Call `addNavigationBlocker()` function to set up a "navigation blocker".

```js
import {
  NavigationStack,
  WebBrowserSession,
  addNavigationBlocker
} from 'navigation-stack'

// Create a session.
const session = new WebBrowserSession()

// Create a `NavigationStack` instance.
const navigationStack = new NavigationStack(session)

// Add a navigation blocker.
// It should be tied to the same "session".
const removeNavigationBlocker = addNavigationBlocker(
  session,
  (newLocation) => {
    // Returning `true` means "this navigation should be blocked".
    return true
  }
);

// Because the navigation is blocked, current location will not change here.
//
// The URL in the web browser's address bar will stay the same
// and no new entries will be added in the web browser's navigation history.
//
navigationStack.push('/new-location')

// Remove the navigation blocker.
removeNavigationBlocker()

// With the blocker removed, current location will be set to a new one.
//
// This also updates the URL in the web browser's address bar
// and adds a new entry in the web browser's navigation history.
//
navigationStack.push('/new-location')
```

Navigation blocker should be a function that receives a `newLocation` argument and could be "synchronous" or "asynchronous" (i.e. return a `Promise`, aka `async`/`await`).

The `newLocation` argument of a blocker function might not necessarily have a `key` or `index` property but other properties are present.

Navigation blockers fire both when navigating from one page to another and when closing the current browser tab. In the latter case, `newLocation` argument will be `null`, and also the blocker function can't return a `Promise` (because it won't wait), and returning `true` from it will cause the web browser will to show a confirmation modal with a non-customizable generic browser-specific text like "Leave site? Changes you made might not be saved".

## Data Storage

One could use `DataStorage` to store any kind of application-specific data in a given "session". The data will exist as long as the "session" exists.

Different types of data could be stored under a different `key`.

If each different location should have it's own data stored under the same `key`, one could use `LocationDataStorage` instead of just `DataStorage`. For example, one could store scroll position for each different page to be able to restore it when the user decides to navigate "Back" to that page. By the way, that's precisely what `ScrollPositionRestoration` does.

`DataStorage` constructor receives a `session` argument and a `namespace` parameter. The `namespace` just gets prepended to every `key`. The idea is that your `namespace` must not clash with anyone else's `namespace` who might potentially use the same `session` to store their own data.

```js
import { WebBrowserSession } from 'navigation-stack'
import { DataStorage, LocationDataStorage } from 'navigation-stack/data-storage'

const session = new WebBrowserSession()

// `DataStorage` example

const dataStorage = new DataStorage(session, { namespace: 'my-namespace' })

dataStorage.set('key', 123)
dataStorage.get('key') === 123

// `LocationDataStorage` example

const locationDataStorage = new LocationDataStorage(session, { namespace: 'my-namespace' })

const location = { pathname: '/abc' }

locationDataStorage.set(location, 'key', 123)
locationDataStorage.get(location, 'key') === 123
```

`DataStorage` or `LocationDataStorage` don't provide any guarantees about actually storing the data: if it encounters any errors in the process, it simply ignores them. This simplifies the API in a way that the application doesn't have to wrap `.get()`/`.set()` calls in a `try/catch` block. And judging by the nature of location-specific data, that type of data is inherently non-essential and rather "nice-to-have".

One might ask: Why use `DataStorage` or `LocationDataStorage` when one could simply store the data in a usual variable? The answer is that a usual variable doesn't survive if the user decides to refresh the page. But the entire navigation history does survive because that's how web browsers work. So if the user decides to go "Back" after refreshing the current page, the data associated to that previous location would already be lost and can't be recovered. In contrast, when using a `DataStorage` or `LocationDataStorage` with a `WebBrowserSession`, the stored data does survive a page refresh, which feels more consistent and coherent with the persistence behavior of the navigation history itself.

## Redux

Under the hood, `navigation-stack` uses [`redux`](https://redux.js.org/). Why? For no particular reason. The original [`farce`](http://npmjs.com/package/farce) package was published in September 2016, and by that time `redux` had still been a hot topic since [July 2025](https://www.youtube.com/watch?v=xsSnOQynTHs). This package could most certainly be rewritten without using `redux`, it's just that there seems to be no need to do that.

So since `navigation-stack` already implements all that `redux` stuff internally, such as "middlewares" or "actions", why not export it for public usage? Maybe there're still some `redux` fans out there.

Using `navigation-stack` `redux`-way is equivalent to using it the conventional way via `NavigationStack` class. `navigation-stack` exports "middlewares", "actions" and a "reducer" that could be used in conjunction with `redux` or any other `redux`-compatible package (e.g. [`mini-redux`](https://www.npmjs.com/package/mini-redux)).

<details>
<summary>See <code>redux</code>-style API</summary>

######

Start by creating a Redux "store" with `navigation-stack` middlewares.

```js
import { createStore, applyMiddleware } from 'redux';

import {
  createMiddlewares,
  locationReducer,
  Actions,
  WebBrowserSession,
} from 'navigation-stack';

// Create a Redux store.
const store = createStore(
  // Reducer function. For example, `locationReducer()`.
  locationReducer,
  // It should be tied to a navigation "session".
  applyMiddleware(...createMiddlewares(new WebBrowserSession())),
);
```

Next, set the initial location. Normally, `NavigationStack` class API automatically performs this step for a developer. When using Redux API though, it doesn't do that and the developer has to do it themself.

```js
// Sets the initial `location`.
//
// Accepts either a relative URL string or a location object.
//
// The initial location argument could be omitted for `WebBrowserSession`
// because it can read it by itself from `window.location`.
// Other types of session such as `InMemorySession` or `ServerSideRenderSession`
// don't have an initial location and require the initial location argument
// to be specified explicitly when creating an `Actions.init(initialLocation)` action.
//
store.dispatch(Actions.init());
```

Then subscribe to location changes. One could use Redux'es standard [subscription mechanisms](https://redux.js.org/api/store#subscribelistener) to immediately get notified of current location changes.

```js
let currentLocation;

// Create a Redux store.
const store = createStore(
  locationReducer, // Reducer function. For example, `locationReducer()`.
  applyMiddleware(...createMiddlewares(new WebBrowserSession())),
);

// Subscribe to any potential Redux state changes.
const unsubscribe = store.subscribe(() => {
  const previousLocation = currentLocation;
  currentLocation = store.getState(); // In case of using `locationReducer()`.
  if (currentLocation !== previousLocation) {
    console.log('Current location', currentLocation);
  }
});
```

Now ready to perform navigation actions by dispatching any of the available `Actions`.

```js
// Sets the `location` to be a new location.
//
// Also updates the URL in the web browser's address bar.
//
// Also adds a new entry in the web browser's navigation history.
//
store.dispatch(Actions.push('/new-location'));

// Sets the `location` to be a new location.
//
// Also updates the URL in the web browser's address bar.
//
// Does not add a new entry in the web browser's navigation history
// which is the only difference between this and `Actions.push()`.
//
store.dispatch(Actions.replace('/new-location'));

// Sets the `location` to be a previous one (if there is one).
// One could think of it as an equivalent of clicking a "Back" button in a web browser.
//
// Also updates the URL in the web browser's address bar.
//
// Also shifts the current position in the web browser's navigation history.
//
store.dispatch(Actions.shift(-1));

// Sets the `location` to be a next one (if there is one).
// One could think of it as an equivalent of clicking a "Forward" button in a web browser.
//
// Also updates the URL in the web browser's address bar.
//
// Also shifts the current position in the web browser's navigation history.
//
store.dispatch(Actions.shift(1));
```

To get the current location:

```js
// When `locationReducer()` is used, `store.getState()` returns the current location.
const location = store.getState();
console.log(location);
```

(optional) After the user is done using the app, stop the session and clean up any listeners.

```js
// (optional)
// When the user closes the application,
// stop the session and clean up any listeners.
// There's no need to do this in a web browser.
unsubscribe();
store.dispatch(Actions.stop());
```
</details>

## Development

Clone the repository. Then:

```
yarn
yarn format
yarn test
```

It runs tests in two web browsers (for no particular reason) — Chrome and Firefox (configurable in `karma.conf.cjs`). When running `yarn test`, it opens Chome and Firefox browser windows. Don't unfocus those windows, otherwise the tests will finish with errors.

## GitHub

On March 9th, 2020, GitHub, Inc. silently [banned](https://medium.com/@catamphetamine/how-github-blocked-me-and-all-my-libraries-c32c61f061d3) my account (erasing all my repos, issues and comments, even in my employer's private repos) without any notice or explanation. Because of that, all source codes had to be promptly moved to GitLab. The [GitHub repo](https://github.com/catamphetamine/navigation-stack) is now only used as a backup (you can star the repo there too), and the primary repo is now the [GitLab one](https://gitlab.com/catamphetamine/navigation-stack). Issues can be reported in any repo.
