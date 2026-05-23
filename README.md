# navigation-stack

[![npm version](https://img.shields.io/npm/v/navigation-stack.svg?style=flat-square)](https://www.npmjs.com/package/navigation-stack)
[![npm downloads](https://img.shields.io/npm/dm/navigation-stack.svg?style=flat-square)](https://www.npmjs.com/package/navigation-stack)

Navigation Stack provides a clean and easy-to-use API for handling navigation in a Single-Page Application.

* Web browser navigation history is exposed in the form of a "stack" data structure.
* The "stack" exposes the following operations to trigger navigation:
  * "push" — go to new URL
  * "replace" — redirect to new URL
  * "shift" — rewind to a previously visited URL
* Subscribe to get notified whenever someone triggers a navigation.
* Automatically restore [scroll position](#scroll-position-restoration) on "Back"/"Forward" navigation.
* [Block navigation](#blocking-navigation), if required.

<!-- If you're using React, see [`navigation-stack-react`](http://npmjs.com/package/navigation-stack-react) package. -->

## Why

* The "native" browser API is clumsy. This package wraps the "native" API in a clean, coherent and easy-to-use interface.

* The "native" browser API doesn't provide the control of scroll position restoration.
  * It doesn't scroll to top when navigating to a new page. This package does.
  * It only restores the window scroll position and ignores any other scrollable containers. This package restores scroll position in all scrollable containers.
  * It restores scroll position immediately after a "Back"/"Forward" navigation has taken place, without waiting for the page to prepare itself. Meawhile, frameworks like React render pages "asynchronously", not immediately, so the content is not rendered yet by the time it attempts to scroll to a certain position, and that scroll position is lost. This package lets a developer specify exactly when the page is ready.
  * When restoring scroll position, it does that "abruptly", with no option for "smooth" scrolling. I'm not saying that "smooth" scrolling is a good idea, but why not let developers decide. This package lets a developer use their own "smooth" scrolling implementation.

* This package adds other quality-of-life improvements which the "native" browser API doesn't have:
  * A centralized place to subscribe for any kind of location changes.
  * Automatically ignore "base path" in the application URL.
  * Read or write the location in a form of a human-readable JSON object with separate query parameters.
  * Store location-specific data that is accessible from any page and survives page reload.
  * Prevent accidental navigation away from a page when there're unsaved changes.

## Install

```
npm install navigation-stack --save
```

## Use

Any changes made in a `NavigationStack` instance are "magically" reflected in the web browser's address bar and navigation history, and vice versa: any changes to the URL in the web browser's address bar are "magically" reflected in the `NavigationStack` instance. So one could think of `NavigationStack` as a very convenient proxy to web browser's address bar and navigation history. What's left to the application is to subscribe to `navigationStack` changes and re-render the page accordingly.

Start by creating a `NavigationStack` instance:

```js
import { NavigationStack, WebBrowserEnvironment } from 'navigation-stack'

// Create a `NavigationStack` instance.
const navigationStack = new NavigationStack(WebBrowserEnvironment)
```

Then subscribe to location changes:

```js
// Subscribe to location changes.
// The listener function will be called immediately after the current location has changed.
// The first call happens for the initial location.
// Next calls will happen in case of any navigation.
const unsubscribe = navigationStack.subscribe((location) => {
  console.log('Current location', location)
})
```

<!-- document.body.innerHTML = '<div>' + location.pathname + '</div>' -->

Now ready to perform navigation actions:

```js
// "init" — reads the initial location.
//
// Until this is done, the stack is not operational.
//
// No argument when using `WebBrowserEnvironment`.
//
navigationStack.init()

// "push" — updates the current location.
//
// One could think of it as an equivalent of clicking a link.
//
// Updates the URL in the web browser's address bar.
//
// Adds a new entry in the web browser's navigation history.
//
navigationStack.push('/new-location')

// "replace" — updates the current location.
//
// Updates the URL in the web browser's address bar.
//
// Does not add a new entry in the web browser's navigation history
// which is the only difference between this and "push".
//
navigationStack.replace('/new-location')

// Negative "shift" — updates the current location to be a previous one from the history.
//
// If no such location exists in the history, throws a `NavigationOutOfBoundsError` error.
//
// One could think of it as an equivalent of clicking a "Back" button in a web browser.
//
// Updates the URL in the web browser's address bar.
//
// Shifts the current position in the web browser's navigation history.
//
navigationStack.shift(-1)

// Positive "shift" — updates the current location to be a next one from the history.
//
// If no such location exists in the history, throws a `NavigationOutOfBoundsError` error.
//
// One could think of it as an equivalent of clicking a "Forward" button in a web browser.
//
// Updates the URL in the web browser's address bar.
//
// Shifts the current position in the web browser's navigation history.
//
navigationStack.shift(1)
```

To get the current location at any time:

```js
const location = navigationStack.current()
```

<!-- console.log(location) -->

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

To get the current location, use `navigationStack.current()`.

Current `location` object has all the properties of a [standard web browser location](https://developer.mozilla.org/en-US/docs/Web/API/Window/location) with the addition of:
* `query: object` — URL query parameters.
* `key: string` — A string ID of the location that is guaranteed to be unique within the session's limits and could be used as a "key" to store any supplementary data associated to this location.
* `index: number` — The index of the location in the navigation stack, starting with `0` for the initial location.

## Scroll Position Restoration

By default, `NavigationStack` doesn't do anything with the scroll position when performing navigation. This means that it neither scrolls to the top of the page when calling `.push()` or `.replace()`, nor restores the previous scroll position on "Back" or "Forward" navigation, including `.shift()` navigation.

To fix that, enable automatic scroll position management feature by passing `manageScrollPosition: true` parameter when creating a `NavigationStack` instance, and then call `.locationRendered(location)` every time a different location has been rendered (including the initial location) immediately after it has been rendered.

```js
import { NavigationStack, WebBrowserEnvironment } from 'navigation-stack'

// Create a `NavigationStack` instance with a `manageScrollPosition: true` option.
const navigationStack = new NavigationStack(WebBrowserEnvironment, {
  manageScrollPosition: true
})

//----------------------------------------------------------------------------------------

function onLocationChange(location) {
  // Render the page.
  if (location.pathname === '/initial') {
    document.body.innerHTML = '<div> Initial Location </div>'
  } else if (location.pathame === '/new') {
    document.body.innerHTML = '<div> New Location </div>'
  } else {
    throw new Error(`Unknown location: ${location.pathname}`)
  }

  // As soon as a page has been rendered, without any delay, tell `NavigationStack` to restore
  // a previously-saved scroll position, if there's any.
  //
  // This method must be called both for the initial location and any subsequent location.
  //
  navigationStack.locationRendered(location)
}

// Subscribe to location changes.
navigationStack.subscribe(onLocationChange)

//----------------------------------------------------------------------------------------

// Start at the current location which is assumed to be "/initial-location".
// No argument when using `WebBrowserEnvironment`.
navigationStack.init()

// Set the `location` to be "/new-location".
//
// This also updates the URL in the web browser's address bar
// and adds a new entry in the web browser's navigation history.
//
navigationStack.push('/new-location')

// Set `location` "back" to "/initial-location".
//
// This also updates the URL in the web browser's address bar
// and repositions the "current location" pointer in the web browser's navigation history.
//
navigationStack.shift(-1)

//----------------------------------------------------------------------------------------

// (optional)
// When the user is about to close the application,
// stop the `NavigationStack` and clean up any of its listeners.
// This is not required in a web browser because it cleans up all listeners
// automatically when closing a tab.
navigationStack.stop()
```

`NavigationStack` constructor relevant options:

* `manageScrollPosition: true` — Enables the automatic scroll position management feature.
* `shouldChangePageScrollPositionOnLocationChange(prevLocation?, newLocation): boolean` — Allows one to disable the automatic page scroll position management for any transition from a given `prevLocation` to a given `newLocation`. Is only relevant when `manageScrollPosition: true` option is passed to `NavigationStack` constructor. As the most obvious use case, it allows an application to selectively disable the effect of resetting page scroll position when updating the query parameters of the URL.


`NavigationStack` relevant methods:

* `addScrollableContainer(key: string, element: Element, options?: object)` — Use it in cases when it should restore not only the page scroll position but also the scroll position(s) of any other scrollable container(s). Returns a "remove scrollable container" function.
  * `options` object could have properties:
    * `shouldChangeScrollPositionOnLocationChange(prevLocation?, newLocation): boolean` — Allows one to disable the automatic scroll position management inside this scrollable container for any transition from a given `prevLocation` to a given `newLocation`. Is only relevant when `manageScrollPosition: true` option is passed to `NavigationStack` constructor. As the most obvious use case, it allows an application to selectively disable the effect of resetting scroll position inside this scrollable container when updating the query parameters of the URL.

* `locationRendered()` — Call it every time a different location has been rendered, including the initial location, without any delay, i.e. immediately after a location has been rendered.

### Smooth Scrolling

By default, when restoring scroll position, it uses basic "immediate" scrolling. A developer could supply a custom `scrollPositionSetter` option with an implementation of custom scrolling behavior. For example, it could be some kind of "smooth" scrolling or something like that.

<details>
<summary>Example</summary>

######

```js
new NavigationStack(WebBrowserEnvironment, {
  manageScrollPosition: true,
  // Custom `scrollPositionSetter`.
  scrollPositionSetter: SmoothScrollPositionSetter
})

class SmoothScrollPositionSetter {
  // Class constructor.
  constructor({ scrollPositionApi }) {
    // `scrollPositionApi` provides the "core" functions for setting scroll position according to the environment.
    // For example, in the context of a `WebBrowserEnvironment`, it provides the functions for setting scroll position in a web browser.
    // Developers of "custom" scrolling behaviors could use these "core" functions to implement the "custom" scrolling behavior on top of them.
    //
    // this.scrollPositionApi = scrollPositionApi
  }

  // Sets scroll position on a page or inside a scrollable container.
  //
  // Returns a `Promise` that resolves when it has finished setting the scroll position.
  //
  // Arguments:
  //
  // `scrollPositionOrAnchor: string | [number, number]`
  //
  // This is the scroll position to set.
  // * When setting page scroll position, it could be either an anchor or numeric coordinates.
  // * When setting scrollable element scroll position, it could only be numeric coordinates.
  //
  // `scrollableContainer: Element`
  //
  // This is the scrollable container whose scroll position should be set.
  // * When setting page scroll position, `scrollableContainer` is `undefined`.
  // * When setting scrollable element scroll position, `scrollableContainer` is the scrollable element.
  //
  async set(scrollPositionOrAnchor, scrollableContainer) {
    if (scrollableContainer) {
      await smoothScrollToCoordinatesInContainer(scrollableContainer, scrollPositionOrAnchor)
    } else {
      if (typeof scrollPositionOrAnchor === 'string') {
        await smoothScrollToAnchor(scrollPositionOrAnchor)
      } else {
        await smoothScrollToCoordinates(scrollPositionOrAnchor)
      }
    }
  }

  // Cancels any pending (or in-progress) setting of scroll position.
  stop() {
    stopSmoothScrolling()
  }
}
```
</details>

<!--
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

// If you decide to use `NavigationStack`,
// it should be tied to the same environment.
//
// const navigationStack = new NavigationStack(WebBrowserEnvironment)
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
-->

## Blocking Navigation

`NavigationStack` provides the ability to block navigation. Call `.addNavigationBlocker()` method to set up a "navigation blocker".

```js
import {
  NavigationStack,
  WebBrowserEnvironment
} from 'navigation-stack'

// Create a `NavigationStack` instance.
const navigationStack = new NavigationStack(WebBrowserEnvironment)

// Add a navigation blocker.
const removeNavigationBlocker = navigationStack.addNavigationBlocker(
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

The `newLocation` argument of a blocker function is an object that has all the properties of a [standard web browser location](https://developer.mozilla.org/en-US/docs/Web/API/Window/location) with the addition of a `query` object.

Navigation blockers fire both when navigating from one page to another and when closing the current browser tab. In the latter case, `newLocation` argument will be `null`, and also the blocker function can't return a `Promise` (because the browser won't wait for it), and returning `true` from it will cause the web browser will to show a confirmation modal with a non-customizable generic browser-specific text like "Leave site? Changes you made might not be saved".

## Base Path

<!--
If the web application is hosted under a certain URL prefix, it should be specified in `createMiddlewares()` call as `basePath` parameter.

```js
createMiddlewares(session, { basePath?: '/base-path' })
```
-->

If the web application is hosted under a certain URL prefix, it should be specified as a `basePath` parameter when creating a `NavigationStack` instance. This prefix will automatically be added to the URL in the web browser's address bar, and the `location` object will automatically strip it from its `pathname`.

```js
new NavigationStack(WebBrowserEnvironment, { basePath: '/base-path' })
```

## Environment

An "environment" class ties `NavigationStack` to the physical environment it operates in, such as a web browser.

Three different "environment" implementations are shipped with this package:

- Use `WebBrowserEnvironment` in a web browser. Navigation session survives a page refresh and is only destroyed when the web browser tab gets closed. Create a single `NavigationStack` instance per web browser tab.
- Use `ServerSideRenderEnvironment` in server-side rendering. Create a separate `NavigationStack` instance for each incoming HTTP request. Initialize it with a relative URL of the HTTP request. If, during server-side render, the application code attempts to navigate to another location, it will throw a `ServerSideRedirectError` with a `location` property in it.
- Use `InMemoryEnvironment` in tests to mimick a `WebBrowserEnvironment`. One can create as many separate `NavigationStack` instances as required because they're completely independent/isolated from one another. Initialize it with a relative URL or a location object.

<details>
<summary>See <code>ServerSideRenderEnvironment</code> example</summary>

######

```js
const navigationStack = new NavigationStack(ServerSideRenderEnvironment)

navigationStack.subscribe((location) => {
  console.log('Current location', location)
})

// Sets the initial location.
// Triggers the subscription listener.
navigationStack.init('/initial-location')

// Navigates to a new location.
// Throws `ServerSideRedirectError` with a `location` property.
navigationStack.push('/new-location')
```
</details>


<details>
<summary>See <code>InMemoryEnvironment</code> example</summary>

######

```js
const navigationStack = new NavigationStack(InMemoryEnvironment)

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

<!--
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
<!- * `getInitialLocation(): object?` — Returns the initial location, if the session can get it from somewhere. For example, in a web browser, the initial location can be read from `window.location`. In other environments, such as server side, the initial location can't be read from anywhere. ->
* `start(initialLocation?: object)` — Starts the session. The `initialLocation` argument is optional when the session can read it from somewhere. For example, `WebBrowserSession` can read `initialLocation` from `window.location`.
* `stop()` — Stops the session. Cleans up any listeners, etc.
* `navigate(operation: string, location: object)` — Navigates to a `location` using either `"PUSH"` or `"REPLACE"` operation. The `location` argument should be a result of calling `parseInputLocation()` function.
* `shift(delta: number)` — Navigates "back" or "forward" by skipping a specified count of pages. Negative `delta` skips backwards, positive `delta` skips forward.
</details>
-->

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

## Data Storage

One could use `NavigationStack`'s "data storage" to store any kind of application-specific data within the bounds of a given "session", which could be defined as the time from "opening" the application to  "closing" it. As long as the "session" exists, so does the data in the "data storage".

For example, in a web browser environment, a "session" starts when the user opens a website in a web browser window or tab, and ends when the user closes that web browser window or tab, and such "session" also survives a "page refresh".

Different types of data could be stored under a different `key`.

Each different location has it's own isolated data storage compartment, so the same `key` could be reused by different locations and there'd be no conflict. For example, one could store scroll position for each different page under `key: "scroll-position"` to be able to restore it when the user decides to navigate "Back" to that page. By the way, that's how `manageScrollPosition: true` feature works.

```js
import { NavigationStack, WebBrowserEnvironment } from 'navigation-stack'

const navigationStack = new NavigationStack(WebBrowserEnvironment)

navigationStack.init()

const location = navigationStack.current()

navigationStack.dataStorage.set(location, 'key', 123)
navigationStack.dataStorage.get(location, 'key') === 123
```

The data storage doesn't provide strict guarantees about actually storing the data: if it encounters an unexpected storage error in the process, it will simply ignore it. This simplifies the API in a way that the application doesn't have to wrap `.get()`/`.set()` calls in a `try/catch` block. And judging by the nature of location-specific data, that type of data is inherently non-essential (non-critical) and rather "nice-to-have".

<details>
<summary>Examples of ignored errors in a <code>WebBrowserEnvironment</code>.</summary>

######

* `SecurityError` — In "Private"/"Incognito" browsing mode, many browsers block write access to storage APIs to enhance privacy. Attempting to call `sessionStorage.setItem()` will throw a `SecurityError` in such case. Same error could be a result of using a really strict privacy blocker extension or opening the website from an `*.html` file directly from disk (`file://` URL).

* `QuotaExceededError` — Could happen if the application attempts to store too much data in `navigation-stack`'s "data storage", or if the application has already used up all available space in `sessionStorage` for some other purposes. The maximum available space in `sessionStorage` depends on the web browser and is usually assumed to be around `5 MB` per URL origin.
</details>

######

One might ask: Why use `NavigationStack`'s data storage when one could simply store the data in a usual variable? The answer is that a usual variable doesn't survive if the user decides to refresh the page. But the entire navigation history does survive because that's how web browsers work. So if the user decides to go "Back" after refreshing the current page, the data associated to that previous location would already be lost and can't be recovered. In contrast, when using `NavigationStack` with a `WebBrowserEnvironment`, the stored data does survive a page refresh, which feels more consistent and coherent with the persistence behavior of the navigation history itself.

## Development

Clone the repository. Then:

```
npm install
npm test
```

`npm test` command will "virtually" open two web browser windows — Firefox and Chrome — and run the tests "live" in those browsers. This is implemented through [Web Test Runner](https://modern-web.dev) + [`playwright`](https://www.npmjs.com/package/playwright). In case these tests suddenly start failing with random non-sensical errors, see if increasing the waiting interval in `await delay(100)` calls throughout the tests' code fixes the issue.

Also, if required, the internal debug log of `navigation-stack` could be enabled for easier debugging. For example, one could use it in case some test "breaks" and it's not clear what's even going on there. To enable the internal debug log, set `DEBUG_ENABLED` variable to `true` in `InMemoryLog.js` file. That will enable a "debug" log in the terminal when running non-browser tests, i.e. the tests that use `InMemoryEnvironment`, but in-browser tests will stay unaffected. That's because in-browser tests use a different environment — `WebBrowserEnvironment` — and hence, a different log implementation — `WebBrowserLog.js`. In order to enable a "debug" log in the terminal when running in-browser tests, set `window.NAVIGATION_STACK_DEBUG_ENABLED` variable to `true`.

## Development History

Originally it started from a fork of [`farce`](http://npmjs.com/package/farce) package to fix a couple of small bugs there ([1](https://github.com/4Catalyzer/farce/issues/483), [2](https://github.com/4Catalyzer/farce/issues/491)).

Then I decided to merge it with [`scroll-behavior`](http://npmjs.com/package/scroll-behavior) package to fix a couple of small bugs there ([1](https://github.com/taion/scroll-behavior/issues/215), [2](https://github.com/taion/scroll-behavior/pull/472)).

Then I decided to completely reorganize and refactor the entire code.

Then I decided to drop the reliance on [`redux`](http://npmjs.com/package/redux) and expose a more conventional and intuitive API — in the form of a "stack" rather than Redux "middleware". The original [`farce`](http://npmjs.com/package/farce) package was published in September 2016, and by that time Redux [still was](https://medium.com/@dan_abramov/you-might-not-need-redux-be46360cf367) a hot topic since [July 2015](https://www.youtube.com/watch?v=xsSnOQynTHs). But in retrospect, there were no legitimate reasons to heavily rely on Redux when implementing such a small and universal package. Apparently, in 2016, everyone went crazy over Redux and it became a de-facto standard when building just about any React web application, to the point of assuming that if you're building a React web app, you're 100% building it on Redux, so all hot frameworks should reuse that Redux for both the internal implementation and the public API. ["Why I Stopped Using Redux"](https://dev.to/g_abud/why-i-quit-redux-1knl).

The result is the present "stack" API.

## GitHub

On March 9th, 2020, GitHub, Inc. silently [banned](https://medium.com/@catamphetamine/how-github-blocked-me-and-all-my-libraries-c32c61f061d3) my account (erasing all my repos, issues and comments, even in my employer's private repos) without any notice or explanation. Because of that, all source codes had to be promptly moved to GitLab. The [GitHub repo](https://github.com/catamphetamine/navigation-stack) is now only used as a backup (you can star the repo there too), and the primary repo is now the [GitLab one](https://gitlab.com/catamphetamine/navigation-stack). Issues can be reported in any repo.
