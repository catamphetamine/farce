<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [navigation-stack](#navigation-stack)
  - [Install](#install)
  - [Use](#use)
  - [Current Location](#current-location)
  - [Why Redux?](#why-redux)
  - [Environment](#environment)
  - [Base Path](#base-path)
  - [Block Navigation](#block-navigation)
  - [Development](#development)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# navigation-stack

[![npm version](https://img.shields.io/npm/v/navigation-stack.svg?style=flat-square)](https://www.npmjs.com/package/navigation-stack)
[![npm downloads](https://img.shields.io/npm/dm/navigation-stack.svg?style=flat-square)](https://www.npmjs.com/package/navigation-stack)

Handles web browser navigation in a web application.

Originally forked from [`farce`](http://npmjs.com/package/farce) package.

## Install

```
npm install navigation-stack
```

## Use

`navigation-stack` provides "middlewares", "actions" and a "reducer" that could be used with `redux` or any other `redux`-compatible package such as [`mini-redux`](https://www.npmjs.com/package/mini-redux).

```js
import { createStore, applyMiddleware } from 'redux';
import {
  createMiddlewares,
  locationReducer,
  Actions,
  BrowserEnvironment,
} from 'navigation-stack';

const store = createStore(
  locationReducer, // optional
  applyMiddleware(
    ...createMiddlewares({ environment: new BrowserEnvironment() }),
  ),
);

store.dispatch(Actions.init());
```

After that, dispatch any of the `Actions` in order to navigate.

```js
// To navigate to a new page.
store.dispatch(Actions.push('/new/location'));

// To redirect to a new page.
store.dispatch(Actions.replace('/new/location'));

// To go back.
store.dispatch(Actions.shift(-1));

// To go forward.
store.dispatch(Actions.shift(1));
```

To view the current location:

```js
// When `locationReducer()` is used,
// `store.getState()` is the current location.
console.log(store.getState());
```

(optional) (advanced) Stop and clean up:

```js
store.dispatch(Actions.dispose());
```

## Current Location

To track the current location, the application could listen to `ActionTypes.UPDATE` action. The `payload` of the action is the current location.

For example, below is the source code for the default `locationReducer`.

```js
import { ActionTypes } from 'navigation-stack';

// With this reducer, `state` would always tell the current location.
function reducer(state, action) {
  if (action.type === ActionTypes.UPDATE) {
    // `action.payload` is the current location.
    return action.payload;
  }
  return state;
}
```

Calling `store.dispatch(Actions.init())` will trigger the initial `ActionTypes.UPDATE` action which will set the current location. From then on, the current location will always stay in sync with the web browser's URL bar.

The current location will also "magically" be updated when the user clicks "Back" or "Forward" button in the web browser.

## Why Redux?

Why complicate things by providing "middlewares", "actions" and a "reducer" when it could be just a conventional API? That's because always knowing the "current location" means having to deal with "state management" in one way or another, and the simplest and most popular "state management" toolkit to date seems to be Redux.

If it was just about dispatching the `Actions` then of course it wouldn't require any "state management". But it's the "get current location" piece that changes the whole picture. One could say that using Redux for such a simple task is an overkill but actually reinventing a wheel is what I would consider "overkill". It's like crafting your own screwdriver just because the one from Walmart feels too bulky.

## Environment

```js
import {
  BrowserEnvironment,
  ServerEnvironment,
  MemoryEnvironment,
} from 'navigation-stack';
```

- Use `BrowserEnvironment` in a web browser.
- Use `ServerEnvironment` in server-side rendering.
- Use `MemoryEnvironment` in tests.

## Base Path

If the web application is hosted under a certain URL prefix, it should be specified in `createMiddlewares()` call as `basePath` parameter.

```js
createMiddlewares({ environment, basePath: '/parent/path' });
```

## Block Navigation

```js
import { createStore, applyMiddleware } from 'redux';
import {
  createMiddlewares,
  locationReducer,
  Actions,
  BrowserEnvironment,
  addNavigationBlocker,
} from 'navigation-stack';

const environment = new BrowserEnvironment();

const store = createStore(
  locationReducer,
  applyMiddleware(...createMiddlewares({ environment })),
);

store.dispatch(Actions.init());

const removeNavigationBlocker = addNavigationBlocker(
  (newLocation) => {
    // Returning `true` blocks navigation.
    return true;
  },
  { environment },
);

// This navigation won't be performed.
store.dispatch(Actions.push('/new/location'));

// Disable the navigation blocker.
removeNavigationBlocker();

// This navigation now will be performed.
store.dispatch(Actions.push('/new/location'));
```

Navigation blocker should be a function that receives a `newLocation` argument and could be "synchronous" or "asynchronous" (i.e. return a `Promise`, aka `async`/`await`).

Navigation blockers fire both when navigating from one page to another and when closing the current browser tab. In the latter case, `newLocation` argument will be `null`, the function can't return a `Promise`, and returning `true` will cause the web browser to show a confirmation modal with a non-customizable browser-specific text.

## Development

Clone the repository. Then:

```
yarn
yarn format
yarn test
```
