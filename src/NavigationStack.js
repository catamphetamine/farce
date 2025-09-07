import { applyMiddleware, createStore } from 'redux';

import Actions from './redux/Actions';
import createMiddlewares from './redux/createMiddlewares';
import locationReducer from './redux/locationReducer';
import ScrollPositionRestoration from './scroll-position/ScrollPositionRestoration';

function getCreateMiddlewaresOptions(navigationStackOptions) {
  if (!navigationStackOptions) {
    return undefined;
  }
  // eslint-disable-next-line no-unused-vars
  const { maintainScrollPosition, ...restOptions } = navigationStackOptions;
  return restOptions;
}

export default class NavigationStack {
  constructor(session, options) {
    this._session = session;

    // Create a Redux store.
    this._store = createStore(
      locationReducer,
      applyMiddleware(
        ...createMiddlewares(session, getCreateMiddlewaresOptions(options)),
      ),
    );

    // Create `ScrollPositionRestoration`.
    if (options && options.maintainScrollPosition) {
      this._scrollPositionRestoration = new ScrollPositionRestoration(session);
    }
  }

  addScrollableContainer(scrollableContainerKey, scrollableContainer) {
    if (!this._scrollPositionRestoration) {
      throw new Error('`maintainScrollPosition: true` option not passed');
    }
    return this._scrollPositionRestoration.addScrollableContainer(
      scrollableContainerKey,
      scrollableContainer,
    );
  }

  subscribe(listener) {
    // Subscribe to any potential Redux state changes.
    return this._store.subscribe(() => {
      // Initially, calls the listener when setting the initial location.
      // After that, calls it on any location change.
      const location = this.current();
      if (!this._latestLocation || location !== this._latestLocation) {
        this._latestLocation = location;
        listener(location);
      }
    });
  }

  init(initialLocation) {
    if (this._latestLocation) {
      throw new Error('Already initialized');
    }

    this._store.dispatch(Actions.init(initialLocation));
    this._latestLocation = this.current();
  }

  current() {
    return this._store.getState();
  }

  push(location) {
    this._store.dispatch(Actions.push(location));
  }

  replace(location) {
    this._store.dispatch(Actions.replace(location));
  }

  shift(delta) {
    this._store.dispatch(Actions.shift(delta));
  }

  stop() {
    if (this._scrollPositionRestoration) {
      this._scrollPositionRestoration.stop();
    }
    this._store.dispatch(Actions.stop());
  }

  locationRendered() {
    if (this._scrollPositionRestoration) {
      const location = this.current();
      if (!location) {
        throw new Error('Not initialized');
      }
      return this._scrollPositionRestoration.locationRendered(location);
    }
    return Promise.resolve();
  }
}
