// import { describe, it } from 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';

import delay from 'delay';
import pDefer from 'p-defer';

import NavigationStack from '../src/NavigationStack.js';
import addNavigationBlockerOriginal from '../src/addNavigationBlocker.js';
import InMemoryEnvironment from '../src/environment/InMemoryEnvironment.js';

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
    //   expect(window.confirm.callCount).to.equal(1)
    //   expect(window.confirm.calledWith('/new')).to.equal(true)
    // });

    it('should support async rewinding', async () => {
      /* eslint-disable no-underscore-dangle */
      // Validate that 2 listeners are currently attached:
      // * The "main" listener of the `Session` which updates current location index property value.
      // * The "main" listener of the `NavigationStack` which updates current location property value, and also runs any navigation blockers.
      if (
        !(
          session._synchronousLocationChangesSubscription._listeners.length ===
            2 &&
          session._asynchronousLocationChangesSubscription._listeners
            .length === 2
        )
      ) {
        throw new Error(
          "Expected 2 listeners: 1 session's own and 1 from ...",
        );
      }
      /* eslint-enable no-underscore-dangle */

      // "Synchronous" location change listener.
      const originalListenerSynchronous =
        // eslint-disable-next-line no-underscore-dangle
        session._synchronousLocationChangesSubscription._listeners[1].listener;

      // "Asynchronous" location change listener.
      const originalListenerAsynchronous =
        // eslint-disable-next-line no-underscore-dangle
        session._asynchronousLocationChangesSubscription._listeners[1]
          .listener;

      // Will be used to block location change events from being processed
      // until they're manually unblocked by calling `navigationDeferred.resolve()`.
      let navigationDeferred;

      // Patch the location change listeners of ...
      //
      // Patch the "synchonous" location change listener.
      // eslint-disable-next-line no-underscore-dangle
      session._synchronousLocationChangesSubscription._listeners[1].listener =
        async (...args) => {
          // Block this location change event from being processed
          // until it's manually unblocked by calling `navigationDeferred.resolve()`.
          navigationDeferred = pDefer();
          await navigationDeferred.promise;
          // Call "synchronous" location change lisneters.
          originalListenerSynchronous(...args);
        };
      // Patch the "asynchonous" location change listener.
      // eslint-disable-next-line no-underscore-dangle
      session._asynchronousLocationChangesSubscription._listeners[1].listener =
        async (...args) => {
          // Block this location change event from being processed
          // until it's manually unblocked by calling `navigationDeferred.resolve()`.
          navigationDeferred = pDefer();
          await navigationDeferred.promise;
          // Call "asynchronous" location change lisneters.
          originalListenerAsynchronous(...args);
        };

      const navigationBlockerDeferred = pDefer();
      addNavigationBlocker(() => navigationBlockerDeferred.promise);

      navigationStack.shift(-1);

      // current location was updated immediately.
      // Any `.subscribe()` listeners haven't yet been called,
      // so current location in Redux state hasn't been updated yet.
      // That's why it uses `session._latestLocation` here
      // instead of simply reading the current location from the `NavigationStack` state.
      // eslint-disable-next-line no-underscore-dangle
      expect(session._latestLocation.pathname).to.equal('/initial');
      // navigation is waiting.
      expect(navigationStack.current().pathname).to.equal('/new');

      // proceed with navigation.
      navigationDeferred.resolve();
      await delay(10);

      // rewinded.
      // eslint-disable-next-line no-underscore-dangle
      expect(session._latestLocation.pathname).to.equal('/new');
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
      expect(session._latestLocation.pathname).to.equal('/initial');
      // navigation finished.
      // wasn't blocked.
      expect(navigationStack.current().pathname).to.equal('/initial');
    });
  });
});

describe('NavigationStack (blockNonProgrammaticNavigationIfRequired) (init)', () => {
  it('should allow the initial load even when a navigation blocker returns `true`', () => {
    const navigationStack = new NavigationStack(InMemoryEnvironment);
    // eslint-disable-next-line no-underscore-dangle
    const session = navigationStack._session;
    addNavigationBlockerOriginal(session, () => true);

    // eslint-disable-next-line no-underscore-dangle
    expect(navigationStack._location).to.be.undefined;
    navigationStack.init('/initial');
    // eslint-disable-next-line no-underscore-dangle
    expect(navigationStack._location.pathname).to.equal('/initial');
  });
});
