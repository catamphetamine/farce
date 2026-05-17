import delay from 'delay';
import pDefer from 'p-defer';

import shouldWarn from './shouldWarn';
import NavigationStack from '../src/NavigationStack';
import addNavigationBlockerOriginal from '../src/addNavigationBlocker';
import InMemoryEnvironment from '../src/environment/InMemoryEnvironment';

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

      expect(blocker).to.have.been.calledOnce();

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

      expect(blocker1).to.have.been.calledOnce();
      expect(blocker2).to.have.been.calledOnce();
    });

    it('should not fall through when first blocker returns `true`', () => {
      const blocker1 = sinon.stub().returns(true);
      const blocker2 = sinon.stub().returns(undefined);

      addNavigationBlocker(blocker1);
      addNavigationBlocker(blocker2);

      navigationStack.push('/new');
      expect(navigationStack.current().pathname).to.equal('/initial');

      expect(blocker1).to.have.been.calledOnce();
      expect(blocker2).not.to.have.been.called();
    });

    it('should warn on and ignore blockers that throw', () => {
      shouldWarn(
        'Ignoring navigation blocker `syncBlocker` that failed with `Error: Navigation blocker error example`.',
      );

      const syncBlocker = () => {
        throw new Error('Navigation blocker error example');
      };

      addNavigationBlocker(syncBlocker);

      navigationStack.push('/new');
      expect(navigationStack.current().pathname).to.equal('/new');
    });

    // it('should show a confirmation dialog and allow navigation on string', () => {
    //   sandbox.stub(window, 'confirm').returns(true);
    //
    //   addNavigationBlocker(({ pathname }) => pathname);
    //
    //   navigationStack.push('/new'));
    //   expect(navigationStack.current().pathname).to.equal('/new');
    //
    //   expect(window.confirm)
    //     .to.have.been.calledOnce()
    //     .and.to.have.been.called.with('/new');
    // });

    // it('should show a confirmation dialog and block navigation on string', () => {
    //   sandbox.stub(window, 'confirm').returns(false);
    //
    //   addNavigationBlocker(({ pathname }) => pathname);
    //
    //   navigationStack.push('/new'));
    //   expect(navigationStack.current().pathname).to.equal('/initial');
    //
    //   expect(window.confirm)
    //     .to.have.been.calledOnce()
    //     .and.to.have.been.called.with('/new');
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
      shouldWarn(
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
      session.environment.lifecycle.addTerminationBlocker,
    ).not.to.have.been.called();
    // expect(window.addEventListener).not.to.have.been.called();

    const removeNavigationBlocker1 = addNavigationBlocker(() => null, {
      beforeUnload: true,
    });
    expect(
      session.environment.lifecycle.addTerminationBlocker,
    ).to.have.been.calledOnce();
    // expect(window.addEventListener)
    //   .to.have.been.calledOnce()
    //   .and.to.have.been.called.with('beforeunload');

    const removeNavigationBlocker2 = addNavigationBlocker(() => null, {
      beforeUnload: true,
    });
    expect(
      session.environment.lifecycle.addTerminationBlocker,
    ).to.have.been.calledOnce();
    // expect(window.addEventListener)
    //   .to.have.been.calledOnce()
    //   .and.to.have.been.called.with('beforeunload');

    const removeTerminationBlocker = sinon.stub();
    // eslint-disable-next-line no-underscore-dangle
    session._removeTerminationBlocker = removeTerminationBlocker;

    removeNavigationBlocker1();
    // expect(window.removeEventListener).not.to.have.been.called();
    expect(removeTerminationBlocker).not.to.have.been.called();

    removeNavigationBlocker2();
    // expect(window.removeEventListener)
    //   .to.have.been.calledOnce()
    //   .and.to.have.been.called.with('beforeunload');
    expect(removeTerminationBlocker).to.have.been.calledOnce();
  });

  // it('should not add a global "before destroy" listener when no `beforeTermination` blocker has been added', () => {
  //   const removeNavigationBlocker = addNavigationBlocker(() => null);
  //   expect(window.addEventListener).not.to.have.been.called();
  //
  //   removeNavigationBlocker();
  //   expect(window.removeEventListener).not.to.have.been.called();
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

    // expect(window.removeEventListener).not.to.have.been.called();
    expect(removeTerminationBlocker).not.to.have.been.called();

    navigationStack.stop();

    // expect(window.removeEventListener)
    //   .to.have.been.calledOnce()
    //   .and.to.have.been.called.with('beforeunload');
    expect(removeTerminationBlocker).to.have.been.calledOnce();
  });
});
