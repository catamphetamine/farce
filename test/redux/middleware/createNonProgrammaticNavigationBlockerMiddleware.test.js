import delay from 'delay';
import pDefer from 'p-defer';
import { applyMiddleware, createStore } from 'redux';

import addNavigationBlockerOriginal from '../../../src/addNavigationBlocker';
import Actions from '../../../src/redux/Actions';
import createMiddlewares from '../../../src/redux/createMiddlewares';
import internalLocationReducer from '../../../src/redux/internalLocationReducer';
import InMemorySession from '../../../src/session/InMemorySession';

describe('createNonProgrammaticNavigationBlockerMiddleware', () => {
  // const sandbox = sinon.createSandbox();

  let session;
  let store;

  function addNavigationBlocker(blocker) {
    return addNavigationBlockerOriginal(session, blocker);
  }

  beforeEach(() => {
    session = new InMemorySession();

    store = createStore(
      internalLocationReducer,
      applyMiddleware(
        ...createMiddlewares(session, {
          _internalLocationReducer: true,
        }),
      ),
    );
    store.dispatch(Actions.init('/initial'));

    sinon.spy(session.lifecycle, 'addTerminationBlocker');
  });

  afterEach(() => {
    store.dispatch(Actions.stop());

    // sandbox.restore();
  });

  describe('SHIFT navigation', () => {
    beforeEach(() => {
      store.dispatch(Actions.push('/new'));
    });

    it('should allow navigation when blocker returns `undefined`', () => {
      const blocker = sinon.stub().returns(undefined);
      addNavigationBlocker(blocker);

      store.dispatch(Actions.shift(-1));
      expect(store.getState().pathname).to.equal('/initial');

      expect(blocker.firstCall.args[0]).to.include({
        // operation: 'SHIFT',
        pathname: '/initial',
        // delta: -1,
      });
    });

    it('should block navigation when blocker returns `true`', () => {
      addNavigationBlocker(() => true);

      store.dispatch(Actions.shift(-1));
      expect(store.getState().pathname).to.equal('/new');
    });

    it('should allow navigation when blocker returns `undefined` (async)', async () => {
      const navigationBlockerDeferred = pDefer();
      addNavigationBlocker(() => navigationBlockerDeferred.promise);

      store.dispatch(Actions.shift(-1));
      expect(store.getState().pathname).to.equal('/new');

      navigationBlockerDeferred.resolve(undefined);
      await delay(10);

      expect(store.getState().pathname).to.equal('/initial');
    });

    it('should block navigation when blocker returns `true` (async)', async () => {
      const navigationBlockerDeferred = pDefer();
      addNavigationBlocker(() => navigationBlockerDeferred.promise);

      store.dispatch(Actions.shift(-1));
      expect(store.getState().pathname).to.equal('/new');

      navigationBlockerDeferred.resolve(true);
      await delay(10);

      expect(store.getState().pathname).to.equal('/new');
    });

    // it('should show a confirmation dialog and allow navigation on string', () => {
    //   sandbox.stub(window, 'confirm').returns(true);
    //
    //   addNavigationBlocker(({ pathname }) => pathname);
    //
    //   store.dispatch(Actions.shift(-1));
    //   expect(store.getState().pathname).to.equal('/initial');
    //
    //   expect(window.confirm)
    //     .to.have.been.calledOnce()
    //     .and.to.have.been.called.with('/new');
    // });

    it('should ignore the initial load when blocker returns `true`', () => {
      // Get rid of the old store. We'll replace it with a new one.
      store.dispatch(Actions.stop());

      store = createStore(
        internalLocationReducer,
        applyMiddleware(
          ...createMiddlewares(new InMemorySession(), {
            _internalLocationReducer: true,
          }),
        ),
      );
      addNavigationBlocker(() => true);

      expect(store.getState()).to.be.undefined();
      store.dispatch(Actions.init('/initial'));
      expect(store.getState().pathname).to.equal('/initial');
    });

    it('should support async rewinding', async () => {
      // eslint-disable-next-line no-underscore-dangle
      if (session._subscription._listeners.length !== 2) {
        throw new Error(
          "Expected 2 listeners: 1 session's own and 1 from `updateInternalLocationMiddleware()`",
        );
      }

      const originalListener =
        // eslint-disable-next-line no-underscore-dangle
        session._subscription._listeners[1].listener;

      let navigationDeferred;

      // Alternatively to overwriting `_listeners[1].listener`,
      // it could pass the `deferred` to `createMiddlewares()` function,
      // which would then pass it to `updateInternalLocationMiddleware()`'s listener.
      // eslint-disable-next-line no-underscore-dangle
      session._subscription._listeners[1].listener = async (...args) => {
        navigationDeferred = pDefer();
        await navigationDeferred.promise;

        originalListener(...args);
      };

      const navigationBlockerDeferred = pDefer();
      addNavigationBlocker(() => navigationBlockerDeferred.promise);

      store.dispatch(Actions.shift(-1));

      // current location was updated immediately.
      // Any `.subscribe()` listeners haven't yet been called,
      // so current location in Redux state hasn't been updated yet.
      // That's why it uses `session._subscription._latest` here
      // instead of simply reading the current location from Redux state.
      // eslint-disable-next-line no-underscore-dangle
      expect(session._subscription._latest.pathname).to.equal('/initial');
      // navigation is waiting.
      expect(store.getState().pathname).to.equal('/new');

      // proceed with navigation.
      navigationDeferred.resolve();
      await delay(10);

      // rewinded.
      // eslint-disable-next-line no-underscore-dangle
      expect(session._subscription._latest.pathname).to.equal('/new');
      // navigation almost finished: navigation blockers are running.
      expect(store.getState().pathname).to.equal('/new');

      // finish navigation blockers.
      navigationBlockerDeferred.resolve(undefined);
      await delay(10);

      // finish navigation.
      navigationDeferred.resolve();
      await delay(10);

      // the rewind was undone.
      // eslint-disable-next-line no-underscore-dangle
      expect(session._subscription._latest.pathname).to.equal('/initial');
      // navigation finished.
      // wasn't blocked.
      expect(store.getState().pathname).to.equal('/initial');
    });

    // it('should allow navigation without calling any blockers when `location.delta` is `null`', async () => {
    //   const navigationBlockerDeferred = pDefer();
    //   addNavigationBlocker(() => navigationBlockerDeferred.promise);
    //
    //   // Update location with a `SHIFT` operation.
    //   /* eslint-disable no-underscore-dangle */
    //   session._currentLocationIndex = 0;
    //   session._navigation._triggerUpdateInternalLocationMiddlewareListener(
    //     session._navigation._createLocationObject({
    //       operation: 'SHIFT',
    //       delta: null,
    //     }),
    //   );
    //   /* eslint-enable no-underscore-dangle */
    //
    //   navigationBlockerDeferred.resolve(true);
    //   await delay(10);
    //
    //   // Without delta, we can't rewind the location change,
    //   // so navigation is allowed without calling any blockers.
    //   expect(currentNavigationLocation.pathname).to.equal('/initial');
    //   expect(store.getState().pathname).to.equal('/initial');
    // });

    // it('should allow navigation when blocker returns `undefined` and `location.delta` is `null`', async () => {
    //   const navigationBlockerDeferred = pDefer();
    //   addNavigationBlocker(() => navigationBlockerDeferred.promise);
    //
    //   // Update location with a `SHIFT` operation.
    //   /* eslint-disable no-underscore-dangle */
    //   session._navigation._index = 0;
    //   session._navigation._subscriptionListener(session._navigation._createLocationObject({
    //     operation: 'SHIFT',
    //     delta: null,
    //   }));
    //   /* eslint-enable no-underscore-dangle */
    //
    //   // Without delta, we can't rewind on the session.
    //   expect(currentNavigationLocation.pathname).to.equal('/initial');
    //   expect(store.getState().pathname).to.equal('/new');
    //
    //   navigationBlockerDeferred.resolve(undefined);
    //   await delay(10);
    //
    //   expect(currentNavigationLocation.pathname).to.equal('/initial');
    //   expect(store.getState().pathname).to.equal('/initial');
    // });

    // it('should block store update when blocker returns `true` and `location.delta` is `null`', async () => {
    //   const navigationBlockerDeferred = pDefer();
    //   addNavigationBlocker(() => navigationBlockerDeferred.promise);
    //
    //   /* eslint-disable no-underscore-dangle */
    //   session._navigation._index = 0;
    //   session._navigation._subscriptionListener(session._navigation._createLocationObject({
    //     operation: 'SHIFT',
    //     delta: null,
    //   }));
    //   /* eslint-enable no-underscore-dangle */
    //
    //   expect(session._navigation.getInitialLocation().pathname).to.equal('/initial');
    //   expect(store.getState().pathname).to.equal('/new');
    //
    //   navigationBlockerDeferred.resolve(true);
    //   await delay(10);
    //
    //   // These are out-of-sync now, but it's the best we can do.
    //   expect(session._navigation.getInitialLocation().pathname).to.equal('/initial');
    //   expect(store.getState().pathname).to.equal('/new');
    // });
  });
});
