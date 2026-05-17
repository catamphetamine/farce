import delay from 'delay';
import pDefer from 'p-defer';

import NavigationStack from '../src/NavigationStack';
import addNavigationBlockerOriginal from '../src/addNavigationBlocker';
import InMemoryEnvironment from '../src/environment/InMemoryEnvironment';

describe('NavigationStack (blockNonProgrammaticNavigationIfRequired)', () => {
  // const sandbox = sinon.createSandbox();

  let session;
  let navigationStack;

  function addNavigationBlocker(blocker) {
    return addNavigationBlockerOriginal(session, blocker);
  }

  beforeEach(() => {
    navigationStack = new NavigationStack(InMemoryEnvironment);

    // eslint-disable-next-line no-underscore-dangle
    session = navigationStack._session;

    navigationStack.init('/initial');

    sinon.spy(session.environment.lifecycle, 'addTerminationBlocker');
  });

  afterEach(() => {
    navigationStack.stop();

    // sandbox.restore();
  });

  describe('shift navigation', () => {
    beforeEach(() => {
      navigationStack.push('/new');
    });

    it('should allow navigation when blocker returns `undefined`', () => {
      const blocker = sinon.stub().returns(undefined);
      addNavigationBlocker(blocker);

      navigationStack.shift(-1);
      expect(navigationStack.current().pathname).to.equal('/initial');

      expect(blocker.firstCall.args[0]).to.include({
        // operation: 'shift',
        pathname: '/initial',
        // delta: -1,
      });
    });

    it('should block navigation when blocker returns `true`', () => {
      addNavigationBlocker(() => true);

      navigationStack.shift(-1);
      expect(navigationStack.current().pathname).to.equal('/new');
    });

    it('should allow navigation when blocker returns `undefined` (async)', async () => {
      const navigationBlockerDeferred = pDefer();
      addNavigationBlocker(() => navigationBlockerDeferred.promise);

      navigationStack.shift(-1);
      expect(navigationStack.current().pathname).to.equal('/new');

      navigationBlockerDeferred.resolve(undefined);
      await delay(10);

      expect(navigationStack.current().pathname).to.equal('/initial');
    });

    it('should block navigation when blocker returns `true` (async)', async () => {
      const navigationBlockerDeferred = pDefer();
      addNavigationBlocker(() => navigationBlockerDeferred.promise);

      navigationStack.shift(-1);
      expect(navigationStack.current().pathname).to.equal('/new');

      navigationBlockerDeferred.resolve(true);
      await delay(10);

      expect(navigationStack.current().pathname).to.equal('/new');
    });

    // it('should show a confirmation dialog and allow navigation on string', () => {
    //   sandbox.stub(window, 'confirm').returns(true);
    //
    //   addNavigationBlocker(({ pathname }) => pathname);
    //
    //   navigationStack.shift(-1));
    //   expect(navigationStack.current().pathname).to.equal('/initial');
    //
    //   expect(window.confirm)
    //     .to.have.been.calledOnce()
    //     .and.to.have.been.called.with('/new');
    // });

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

      navigationStack.shift(-1);

      // current location was updated immediately.
      // Any `.subscribe()` listeners haven't yet been called,
      // so current location in Redux state hasn't been updated yet.
      // That's why it uses `session._subscription._latest` here
      // instead of simply reading the current location from Redux state.
      // eslint-disable-next-line no-underscore-dangle
      expect(session._subscription._latest.pathname).to.equal('/initial');
      // navigation is waiting.
      expect(navigationStack.current().pathname).to.equal('/new');

      // proceed with navigation.
      navigationDeferred.resolve();
      await delay(10);

      // rewinded.
      // eslint-disable-next-line no-underscore-dangle
      expect(session._subscription._latest.pathname).to.equal('/new');
      // navigation almost finished: navigation blockers are running.
      expect(navigationStack.current().pathname).to.equal('/new');

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
      expect(navigationStack.current().pathname).to.equal('/initial');
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
    //       operation: 'shift',
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
    //   expect(navigationStack.current().pathname).to.equal('/initial');
    // });

    // it('should allow navigation when blocker returns `undefined` and `location.delta` is `null`', async () => {
    //   const navigationBlockerDeferred = pDefer();
    //   addNavigationBlocker(() => navigationBlockerDeferred.promise);
    //
    //   // Update location with a `SHIFT` operation.
    //   /* eslint-disable no-underscore-dangle */
    //   session._navigation._index = 0;
    //   session._navigation._subscriptionListener(session._navigation._createLocationObject({
    //     operation: 'shift',
    //     delta: null,
    //   }));
    //   /* eslint-enable no-underscore-dangle */
    //
    //   // Without delta, we can't rewind on the session.
    //   expect(currentNavigationLocation.pathname).to.equal('/initial');
    //   expect(navigationStack.current().pathname).to.equal('/new');
    //
    //   navigationBlockerDeferred.resolve(undefined);
    //   await delay(10);
    //
    //   expect(currentNavigationLocation.pathname).to.equal('/initial');
    //   expect(navigationStack.current().pathname).to.equal('/initial');
    // });

    // it('should block store update when blocker returns `true` and `location.delta` is `null`', async () => {
    //   const navigationBlockerDeferred = pDefer();
    //   addNavigationBlocker(() => navigationBlockerDeferred.promise);
    //
    //   /* eslint-disable no-underscore-dangle */
    //   session._navigation._index = 0;
    //   session._navigation._subscriptionListener(session._navigation._createLocationObject({
    //     operation: 'shift',
    //     delta: null,
    //   }));
    //   /* eslint-enable no-underscore-dangle */
    //
    //   expect(session._navigation.getInitialLocation().pathname).to.equal('/initial');
    //   expect(navigationStack.current().pathname).to.equal('/new');
    //
    //   navigationBlockerDeferred.resolve(true);
    //   await delay(10);
    //
    //   // These are out-of-sync now, but it's the best we can do.
    //   expect(session._navigation.getInitialLocation().pathname).to.equal('/initial');
    //   expect(navigationStack.current().pathname).to.equal('/new');
    // });
  });
});

describe('NavigationStack (blockNonProgrammaticNavigationIfRequired) (init)', () => {
  it('should allow the initial load even when a navigation blocker returns `true`', () => {
    const navigationStack = new NavigationStack(InMemoryEnvironment);
    // eslint-disable-next-line no-underscore-dangle
    const session = navigationStack._session;
    addNavigationBlockerOriginal(session, () => true);

    // eslint-disable-next-line no-underscore-dangle
    expect(navigationStack._location).to.be.undefined();
    navigationStack.init('/initial');
    // eslint-disable-next-line no-underscore-dangle
    expect(navigationStack._location.pathname).to.equal('/initial');
  });
});
