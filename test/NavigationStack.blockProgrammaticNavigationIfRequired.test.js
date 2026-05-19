// import { describe, it } from 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';

import delay from 'delay';
import pDefer from 'p-defer';

import { stubConsoleWarn } from './console.warn.js';
import NavigationStack from '../src/NavigationStack.js';
import addNavigationBlockerOriginal from '../src/addNavigationBlocker.js';
import InMemoryEnvironment from '../src/environment/InMemoryEnvironment.js';

describe('NavigationStack (blockProgrammaticNavigationIfRequired)', () => {
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

  describe('push navigation', () => {
    it('should block navigation when blocker returns `true`', () => {
      const blocker = sinon.stub().returns(true);
      addNavigationBlocker(blocker);

      navigationStack.push('/new');
      expect(navigationStack.current().pathname).to.equal('/initial');

      expect(blocker.callCount).to.equal(1);

      expect(blocker.firstCall.args[0]).to.include({
        // operation: 'push',
        pathname: '/new',
      });
    });

    it('should allow navigation when blocker returns `undefined`', () => {
      addNavigationBlocker(() => undefined);

      navigationStack.push('/new');
      expect(navigationStack.current().pathname).to.equal('/new');
    });

    it("should fall through when first blocker doesn't return `true`", () => {
      const blocker1 = sinon.stub().returns(undefined);
      const blocker2 = sinon.stub().returns(true);

      addNavigationBlocker(blocker1);
      addNavigationBlocker(blocker2);

      navigationStack.push('/new');
      expect(navigationStack.current().pathname).to.equal('/initial');

      expect(blocker1.callCount).to.equal(1);
      expect(blocker2.callCount).to.equal(1);
    });

    it('should not fall through when first blocker returns `true`', () => {
      const blocker1 = sinon.stub().returns(true);
      const blocker2 = sinon.stub().returns(undefined);

      addNavigationBlocker(blocker1);
      addNavigationBlocker(blocker2);

      navigationStack.push('/new');
      expect(navigationStack.current().pathname).to.equal('/initial');

      expect(blocker1.callCount).to.equal(1)
      expect(blocker2.callCount).to.equal(0)
    });

    it('should warn on and ignore blockers that throw', () => {
      const consoleWarnStub = stubConsoleWarn()

      consoleWarnStub.expect(
        'Ignoring navigation blocker `syncBlocker` that failed with `Error: Navigation blocker error example`.',
      );

      const syncBlocker = () => {
        throw new Error('Navigation blocker error example');
      };

      addNavigationBlocker(syncBlocker);

      navigationStack.push('/new');
      expect(navigationStack.current().pathname).to.equal('/new');

      consoleWarnStub.restoreAndCheckExpected()
    });

    // it('should show a confirmation dialog and allow navigation on string', () => {
    //   sandbox.stub(window, 'confirm').returns(true);
    //
    //   addNavigationBlocker(({ pathname }) => pathname);
    //
    //   navigationStack.push('/new'));
    //   expect(navigationStack.current().pathname).to.equal('/new');
    //
    //   expect(window.confirm.callCount).to.equal(1)
    //   expect(window.confirm.calledWith('/new')).to.equal(true)
    // });

    // it('should show a confirmation dialog and block navigation on string', () => {
    //   sandbox.stub(window, 'confirm').returns(false);
    //
    //   addNavigationBlocker(({ pathname }) => pathname);
    //
    //   navigationStack.push('/new'));
    //   expect(navigationStack.current().pathname).to.equal('/initial');
    //
    //   expect(window.confirm.callCount).to.equal(1)
    //   expect(window.confirm.calledWith('/new')).to.equal(true)
    // });

    it('should allow navigation when blocker returns `undefined` (async)', async () => {
      const navigationBlockerDeferred = pDefer();
      addNavigationBlocker(() => navigationBlockerDeferred.promise);

      navigationStack.push('/new');
      expect(navigationStack.current().pathname).to.equal('/initial');

      navigationBlockerDeferred.resolve(undefined);
      await delay(10);

      expect(navigationStack.current().pathname).to.equal('/new');
    });

    it('should block navigation when blocker returns `true` (async)', async () => {
      const navigationBlockerDeferred = pDefer();
      addNavigationBlocker(() => navigationBlockerDeferred.promise);

      navigationStack.push('/new');
      expect(navigationStack.current().pathname).to.equal('/initial');

      navigationBlockerDeferred.resolve(true);
      await delay(10);

      expect(navigationStack.current().pathname).to.equal('/initial');
    });

    it('should allow chaining async blockers', async () => {
      const navigationBlockerDeferred1 = pDefer();
      const navigationBlockerDeferred2 = pDefer();

      addNavigationBlocker(() => navigationBlockerDeferred1.promise);
      addNavigationBlocker(() => navigationBlockerDeferred2.promise);

      navigationStack.push('/new');
      expect(navigationStack.current().pathname).to.equal('/initial');

      navigationBlockerDeferred1.resolve(undefined);
      await delay(10);

      expect(navigationStack.current().pathname).to.equal('/initial');

      navigationBlockerDeferred2.resolve(undefined);
      await delay(10);

      expect(navigationStack.current().pathname).to.equal('/new');
    });

    it('should warn on and ignore async blockers that throw an error', async () => {
      const consoleWarnStub = stubConsoleWarn()

      consoleWarnStub.expect(
        'Ignoring navigation blocker `asyncBlocker` that failed with `Error: Navigation blocker error example`.',
      );

      // eslint-disable-next-line require-await
      const asyncBlocker = async () => {
        throw new Error('Navigation blocker error example');
      };

      addNavigationBlocker(asyncBlocker);

      navigationStack.push('/new');
      expect(navigationStack.current().pathname).to.equal('/initial');

      await delay(10);

      expect(navigationStack.current().pathname).to.equal('/new');

      consoleWarnStub.restoreAndCheckExpected();
    });

    it('should allow removing blockers', () => {
      const removeNavigationBlocker = addNavigationBlocker(() => true);

      navigationStack.push('/new');
      expect(navigationStack.current().pathname).to.equal('/initial');

      removeNavigationBlocker();

      navigationStack.push('/new');
      expect(navigationStack.current().pathname).to.equal('/new');
    });
  });
});

describe('addTerminationBlocker', () => {
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

    // sandbox.stub(window, 'addEventListener');
    // sandbox.stub(window, 'removeEventListener');
  });

  afterEach(() => {
    if (navigationStack) {
      navigationStack.stop();
    }

    // sandbox.restore();
  });

  it('should add/remove event blocker', () => {
    expect(
      session.environment.lifecycle.addTerminationBlocker.callCount,
    ).to.equal(0);
    // expect(window.addEventListener.callCount).to.equal(0);

    const removeNavigationBlocker1 = addNavigationBlocker(() => null, {
      beforeUnload: true,
    });
    expect(
      session.environment.lifecycle.addTerminationBlocker.callCount,
    ).to.equal(1);
    // expect(window.addEventListener.callCount).to.equal(1)
    // expect(window.addEventListener.calledWith('beforeunload')).to.equal(true)

    const removeNavigationBlocker2 = addNavigationBlocker(() => null, {
      beforeUnload: true,
    });
    expect(
      session.environment.lifecycle.addTerminationBlocker.callCount,
    ).to.equal(1);
    // expect(window.addEventListener.callCount).to.equal(1)
    // expect(window.addEventListener.calledWith('beforeunload')).to.equal(true)

    const removeTerminationBlocker = sinon.stub();
    // eslint-disable-next-line no-underscore-dangle
    session._removeTerminationBlocker = removeTerminationBlocker;

    removeNavigationBlocker1();
    // expect(window.removeEventListener.callCount).to.equal(0);
    expect(removeTerminationBlocker.callCount).to.equal(0)

    removeNavigationBlocker2();
    // expect(window.removeEventListener.callCount).to.equal(1)
    // expect(window.removeEventListener.calledWith('beforeunload')).to.equal(true)
    expect(removeTerminationBlocker.callCount).to.equal(1);
  });

  // it('should not add a global "before destroy" listener when no `beforeTermination` blocker has been added', () => {
  //   const removeNavigationBlocker = addNavigationBlocker(() => null);
  //   expect(window.addEventListener.callCount).to.equal(0);
  //
  //   removeNavigationBlocker();
  //   expect(window.removeEventListener.callCount).to.equal(0);
  // });
});

describe('NavigationStack (blockProgrammaticNavigationIfRequired) (stop)', () => {
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
    // Don't call `navigationStack.stop()` here because it was already stopped in the test case.
    // navigationStack.stop();
  });

  it('should remove event blocker on stop', () => {
    addNavigationBlocker(() => null);

    const removeTerminationBlocker = sinon.stub();
    // eslint-disable-next-line no-underscore-dangle
    session._removeTerminationBlocker = removeTerminationBlocker;

    // expect(window.removeEventListener.callCount).to.equal(0);
    expect(removeTerminationBlocker.callCount).to.equal(0);

    navigationStack.stop();

    // expect(window.removeEventListener.callCount).to.equal(1)
    // expect(window.removeEventListener.calledWith('beforeunload')).to.equal(true)
    expect(removeTerminationBlocker.callCount).to.equal(1);
  });
});
