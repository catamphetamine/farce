import delay from 'delay';

import NavigationStack from '../src/NavigationStack';
import InMemorySession from '../src/session/InMemorySession';
import WebBrowserSession from '../src/session/WebBrowserSession';

describe('NavigationStack', () => {
  let navigationStack;

  beforeEach(() => {
    navigationStack = new NavigationStack(new InMemorySession());
    navigationStack.init('/initial');
  });

  afterEach(() => {
    // Even if a test errors, the `NavigationStack` should still be stopped
    // in order to remove the potential "popstate" listener so that it doesn't
    // interfere with other tests.
    navigationStack.stop();
  });

  it('should support `push` and `shift` navigation operations', () => {
    navigationStack.push('/new');
    expect(navigationStack.current()).to.include({
      pathname: '/new',
      // index: 1,
    });

    navigationStack.shift(-1);
    expect(navigationStack.current()).to.include({
      pathname: '/initial',
      // index: 0,
    });

    navigationStack.shift(+1);
    expect(navigationStack.current()).to.include({
      pathname: '/new',
      // index: 1,
    });
  });

  it('should support `replace` navigation operation', () => {
    navigationStack.replace('/new');
    expect(navigationStack.current()).to.include({
      pathname: '/new',
      // index: 0,
    });
  });
});

describe('NavigationStack (WebBrowserSession)', () => {
  let navigationStack;

  beforeEach(() => {
    window.history.replaceState(null, null, '/initial');

    navigationStack = new NavigationStack(new WebBrowserSession());

    navigationStack.init();
  });

  afterEach(() => {
    // Even if a test errors, the `NavigationStack` should still be stopped
    // in order to remove the potential "popstate" listener so that it doesn't
    // interfere with other tests.
    navigationStack.stop();
  });

  it('should allow calling `init()` without an argument, and then support `push` and `shift` navigation operations', async () => {
    navigationStack.push('/new');
    await delay(20);
    expect(navigationStack.current()).to.include({
      pathname: '/new',
      // index: 1,
    });

    navigationStack.shift(-1);
    await delay(20);
    expect(navigationStack.current()).to.include({
      pathname: '/initial',
      // index: 0,
    });

    navigationStack.shift(+1);
    await delay(20);
    expect(navigationStack.current()).to.include({
      pathname: '/new',
      // index: 1,
    });
  });

  it('should allow calling `init()` without an argument, and then support `replace` navigation operation', async () => {
    navigationStack.replace('/new');
    await delay(20);
    expect(navigationStack.current()).to.include({
      pathname: '/new',
      // index: 0,
    });
  });
});

describe('NavigationStack.subscribe', () => {
  let navigationStack;

  afterEach(() => {
    // Even if a test errors, the `NavigationStack` should still be stopped
    // in order to remove the potential "popstate" listener so that it doesn't
    // interfere with other tests.
    navigationStack.stop();
  });

  it('should subscribe to location changes', () => {
    navigationStack = new NavigationStack(new InMemorySession());

    const listener = sinon.spy();

    const unsubscribe = navigationStack.subscribe(listener);

    navigationStack.init('/initial');

    // `.init()` calls subscription listeners.
    expect(listener).to.have.been.calledOnce();
    expect(listener.lastCall.args[0]).to.include({
      // operation: 'INIT',
      pathname: '/initial',
    });
    listener.resetHistory();

    navigationStack.push('/new');

    expect(listener).to.have.been.calledOnce();
    expect(listener.lastCall.args[0]).to.include({
      // operation: 'PUSH',
      pathname: '/new',
    });
    listener.resetHistory();

    navigationStack.replace('/new-2');

    expect(listener).to.have.been.calledOnce();
    expect(listener.lastCall.args[0]).to.include({
      // operation: 'REPLACE',
      pathname: '/new-2',
    });
    listener.resetHistory();

    navigationStack.shift(-1);

    expect(listener).to.have.been.calledOnce();
    expect(listener.lastCall.args[0]).to.include({
      // operation: 'SHIFT',
      // delta: -1,
      pathname: '/initial',
    });
    listener.resetHistory();

    unsubscribe();

    navigationStack.push('/new-3');

    // Unsubscribed, so the listener doesn't get called.
    expect(listener).to.not.have.been.called();
  });

  it('should subscribe to location changes (WebBrowserSession)', () => {
    window.history.replaceState(null, null, '/initial');

    navigationStack = new NavigationStack(new WebBrowserSession());

    const listener = sinon.spy();

    const unsubscribe = navigationStack.subscribe(listener);

    navigationStack.init();

    // `.init()` calls subscription listeners.
    expect(listener).to.have.been.calledOnce();
    expect(listener.lastCall.args[0]).to.include({
      // operation: 'INIT',
      pathname: '/initial',
    });
    listener.resetHistory();

    unsubscribe();
  });
});

describe('NavigationStack.stop()', () => {
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    // Even if a test errors, the spies should be removed, otherwise it'll say:
    // "Attempted to wrap addEventListener which is already wrapped".
    sandbox.restore();
  });

  it('should remove "popstate" listener on stop', () => {
    sandbox.spy(window, 'addEventListener');
    sandbox.spy(window, 'removeEventListener');

    const session = new WebBrowserSession();

    const navigationStack = new NavigationStack(session);

    // This subscription won't be "unsubscribed" by the code.
    // It is expected to be "unsubscribed" automatically on `navigationStack.stop()`
    // and not hold off the clearing of `popstate` listener.
    navigationStack.subscribe(() => {});

    navigationStack.init();

    navigationStack.push('/new');

    navigationStack.stop();

    expect(window.addEventListener)
      .to.have.been.calledOnce()
      .and.to.have.been.called.with('popstate');

    expect(window.removeEventListener)
      .to.have.been.calledOnce()
      .and.to.have.been.called.with('popstate');
  });
});

describe('NavigationStack', () => {
  let navigationStack;

  afterEach(() => {
    // Even if a test errors, the `NavigationStack` should still be stopped
    // in order to remove the potential "popstate" listener so that it doesn't
    // interfere with other tests.
    //
    // `navigationStack.stop()` method is "idempotent", i.e. it can be called multiple times.
    //
    navigationStack.stop();
  });

  it('should support `basePath`', () => {
    const session = new InMemorySession();

    navigationStack = new NavigationStack(session, {
      basePath: '/base',
    });

    navigationStack.init('/initial');

    navigationStack.push('/new');

    // eslint-disable-next-line no-underscore-dangle
    expect(session._subscription._latest.pathname).to.equal('/base/new');

    expect(navigationStack.current()).to.include({
      pathname: '/new',
      // index: 1,
    });
  });

  it('should support `maintainScrollPosition: true` option', async () => {
    navigationStack = new NavigationStack(new WebBrowserSession(), {
      maintainScrollPosition: true,
    });

    navigationStack.init();

    navigationStack.locationRendered();

    navigationStack.push('/new');

    navigationStack.locationRendered();

    const scrollableContainer = document.createElement('div');
    document.body.appendChild(scrollableContainer);

    const removeScrollableContainer = navigationStack.addScrollableContainer(
      'container',
      scrollableContainer,
    );

    // `PageScrollPositionSetter` works in an asynchronous fashion,
    // so this delay lets it finish setting page scroll position
    // before proceeding to next location.
    await delay(20);

    removeScrollableContainer();

    navigationStack.shift(-1);

    navigationStack.locationRendered();

    // `PageScrollPositionSetter` works in an asynchronous fashion,
    // so this delay lets it finish setting page scroll position
    // before proceeding to next location.
    await delay(20);
  });
});
