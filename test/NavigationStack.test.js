// import { describe, it } from 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';

import delay from 'delay';

import NavigationStack from '../src/NavigationStack.js';
import InMemoryEnvironment from '../src/environment/InMemoryEnvironment.js';
import WebBrowserEnvironment from '../src/environment/WebBrowserEnvironment.js';

describe('NavigationStack', () => {
  let navigationStack;

  beforeEach(() => {
    navigationStack = new NavigationStack(InMemoryEnvironment);

    // Test `.size()` and `.entries()` methods.
    // expect(navigationStack.size()).to.equal(0)
    // expect(navigationStack.entries().length).to.equal(0)

    navigationStack.init('/initial');
  });

  afterEach(() => {
    // Even if a test errors, the `NavigationStack` should still be stopped
    // in order to remove the potential "popstate" listener so that it doesn't
    // interfere with other tests.
    navigationStack.stop();
  });

  // it('should support `push` and `shift` navigation operations, and return correct `entries()` and `size()`', () => {
  it('should support `push` and `shift` navigation operations', () => {
    // expect(navigationStack.size()).to.equal(1)

    // expect(navigationStack.entries().length).to.equal(1)
    // expect(navigationStack.entries()[0].pathname).to.equal('/initial')

    navigationStack.push('/new');
    expect(navigationStack.current()).to.include({
      pathname: '/new',
      index: 1,
    });

    // expect(navigationStack.size()).to.equal(2)

    // expect(navigationStack.entries().length).to.equal(2)
    // expect(navigationStack.entries()[0].pathname).to.equal('/initial')
    // expect(navigationStack.entries()[1].pathname).to.equal('/new')

    navigationStack.shift(-1);
    expect(navigationStack.current()).to.include({
      pathname: '/initial',
      index: 0,
    });

    // expect(navigationStack.size()).to.equal(2)

    // expect(navigationStack.entries().length).to.equal(2)
    // expect(navigationStack.entries()[0].pathname).to.equal('/initial')
    // expect(navigationStack.entries()[1].pathname).to.equal('/new')

    navigationStack.shift(+1);
    expect(navigationStack.current()).to.include({
      pathname: '/new',
      index: 1,
    });

    // expect(navigationStack.size()).to.equal(2)

    // expect(navigationStack.entries().length).to.equal(2)
    // expect(navigationStack.entries()[0].pathname).to.equal('/initial')
    // expect(navigationStack.entries()[1].pathname).to.equal('/new')

    navigationStack.push('/new-2');
    expect(navigationStack.current()).to.include({
      pathname: '/new-2',
      index: 2,
    });

    // expect(navigationStack.size()).to.equal(3)

    // expect(navigationStack.entries().length).to.equal(3)
    // expect(navigationStack.entries()[0].pathname).to.equal('/initial')
    // expect(navigationStack.entries()[1].pathname).to.equal('/new')
    // expect(navigationStack.entries()[2].pathname).to.equal('/new-2')

    navigationStack.shift(-2);

    // expect(navigationStack.size()).to.equal(3)

    // expect(navigationStack.entries().length).to.equal(3)
    // expect(navigationStack.entries()[0].pathname).to.equal('/initial')
    // expect(navigationStack.entries()[1].pathname).to.equal('/new')
    // expect(navigationStack.entries()[2].pathname).to.equal('/new-2')

    navigationStack.push('/new-3');
    expect(navigationStack.current()).to.include({
      pathname: '/new-3',
      index: 1,
    });

    // expect(navigationStack.size()).to.equal(2)

    // expect(navigationStack.entries().length).to.equal(2)
    // expect(navigationStack.entries()[0].pathname).to.equal('/initial')
    // expect(navigationStack.entries()[1].pathname).to.equal('/new-3')
  });

  it('should support `replace` navigation operation', () => {
    navigationStack.replace('/new');
    expect(navigationStack.current()).to.include({
      pathname: '/new',
      index: 0,
    });
  });
});

describe('NavigationStack (WebBrowserSession)', () => {
  let navigationStack;

  beforeEach(() => {
    window.history.replaceState(null, null, '/initial');

    navigationStack = new NavigationStack(WebBrowserEnvironment);

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
    await delay(100);
    expect(navigationStack.current()).to.include({
      pathname: '/new',
      index: 1,
    });

    navigationStack.shift(-1);
    await delay(100);
    expect(navigationStack.current()).to.include({
      pathname: '/initial',
      index: 0,
    });

    navigationStack.shift(+1);
    await delay(100);
    expect(navigationStack.current()).to.include({
      pathname: '/new',
      index: 1,
    });
  });

  it('should allow calling `init()` without an argument, and then support `replace` navigation operation', async () => {
    navigationStack.replace('/new');
    await delay(100);
    expect(navigationStack.current()).to.include({
      pathname: '/new',
      index: 0,
    });
  });

  it('should not allow calling `init()` multiple times', () => {
    expect(() => {
      navigationStack.init('/new');
    }).to.throw('Already initialized');
  });

  it('should restart a previously-started session', async () => {
    navigationStack.push('/new');
    navigationStack.stop();

    // Simulate the user refreshing the page in a web browser.
    // In such case, `window.history` will be retained
    // but every javascript variable will be recreated from scratch.
    navigationStack = new NavigationStack(WebBrowserEnvironment);

    navigationStack.init();

    // A publicly-exposed `location` object doesn't have an `operation` property.
    // expect(navigationStack.current().operation).to.equal('init');

    expect(navigationStack.current().pathname).to.equal('/new');
    expect(navigationStack.current().index).to.equal(1);

    navigationStack.shift(-1);

    await delay(100);

    expect(navigationStack.current().pathname).to.equal('/initial');
    expect(navigationStack.current().index).to.equal(0);

    navigationStack.shift(1);

    await delay(100);

    expect(navigationStack.current().pathname).to.equal('/new');
    expect(navigationStack.current().index).to.equal(1);
  });
});

describe('NavigationStack.addNavigationBlocker', () => {
  let navigationStack;

  afterEach(() => {
    // Even if a test errors, the `NavigationStack` should still be stopped
    // in order to remove the potential "popstate" listener so that it doesn't
    // interfere with other tests.
    navigationStack.stop();
  });

  it('should add/remove navigation blocker', () => {
    navigationStack = new NavigationStack(InMemoryEnvironment);

    navigationStack.init('/initial');

    expect(navigationStack.current().pathname).to.equal('/initial');

    const removeNavigationBlocker = navigationStack.addNavigationBlocker(
      () => true,
    );

    navigationStack.push('/new');
    expect(navigationStack.current().pathname).to.equal('/initial');

    removeNavigationBlocker();

    navigationStack.push('/new');
    expect(navigationStack.current().pathname).to.equal('/new');
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
    navigationStack = new NavigationStack(InMemoryEnvironment);

    const listener = sinon.spy();

    const unsubscribe = navigationStack.subscribe(listener);

    navigationStack.init('/initial');

    // `.init()` calls subscription listeners.
    expect(listener.callCount).to.equal(1);
    expect(listener.lastCall.args[0]).to.include({
      // operation: 'init',
      pathname: '/initial',
    });
    listener.resetHistory();

    navigationStack.push('/new');

    expect(listener.callCount).to.equal(1);
    expect(listener.lastCall.args[0]).to.include({
      // operation: 'push',
      pathname: '/new',
    });
    listener.resetHistory();

    navigationStack.replace('/new-2');

    expect(listener.callCount).to.equal(1);
    expect(listener.lastCall.args[0]).to.include({
      // operation: 'replace',
      pathname: '/new-2',
    });
    listener.resetHistory();

    navigationStack.shift(-1);

    expect(listener.callCount).to.equal(1);
    expect(listener.lastCall.args[0]).to.include({
      // operation: 'shift',
      // delta: -1,
      pathname: '/initial',
    });
    listener.resetHistory();

    unsubscribe();

    navigationStack.push('/new-3');

    // Unsubscribed, so the listener doesn't get called.
    expect(listener.callCount).to.equal(0);
  });

  it('should subscribe to location changes (WebBrowserSession)', () => {
    window.history.replaceState(null, null, '/initial');

    navigationStack = new NavigationStack(WebBrowserEnvironment);

    const listener = sinon.spy();

    const unsubscribe = navigationStack.subscribe(listener);

    navigationStack.init();

    // `.init()` calls subscription listeners.
    expect(listener.callCount).to.equal(1);
    expect(listener.lastCall.args[0]).to.include({
      // operation: 'init',
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

    const navigationStack = new NavigationStack(WebBrowserEnvironment);

    // This subscription won't be "unsubscribed" by the code.
    // It is expected to be "unsubscribed" automatically on `navigationStack.stop()`
    // and not hold off the clearing of `popstate` listener.
    navigationStack.subscribe(() => {});

    navigationStack.init();

    navigationStack.push('/new');

    navigationStack.stop();

    expect(window.addEventListener.callCount).to.equal(1);
    expect(window.addEventListener.calledWith('popstate')).to.equal(true);

    expect(window.removeEventListener.callCount).to.equal(1);
    expect(window.removeEventListener.calledWith('popstate')).to.equal(true);
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
    navigationStack = new NavigationStack(InMemoryEnvironment, {
      basePath: '/base',
    });

    // eslint-disable-next-line no-underscore-dangle
    const session = navigationStack._session;

    navigationStack.init('/initial');

    navigationStack.push('/new');

    // eslint-disable-next-line no-underscore-dangle
    expect(session._currentLocation.pathname).to.equal('/base/new');

    expect(navigationStack.current()).to.include({
      pathname: '/new',
      index: 1,
    });
  });
});

describe('NavigationStack (manageScrollPosition: true)', () => {
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

  it('should support `manageScrollPosition: true` option', async () => {
    navigationStack = new NavigationStack(WebBrowserEnvironment, {
      manageScrollPosition: true,
    });

    // Start with the "/initial" page.
    window.history.replaceState(null, null, '/initial');

    // Initialize `NavigationStack`.
    navigationStack.init();

    // "/initial" page rendered.
    // Restore scroll position (no saved scroll position to restore).
    await navigationStack.locationRendered(navigationStack.current());

    // Create a content <div/> that "overflows" the window so that it becomes scrollable.
    const content = document.createElement('div');
    content.style.height = '10000px';
    content.style.width = '10000px';
    document.body.appendChild(content);

    // Scroll the page to some position.
    // The scroll position will be saved.
    window.scrollTo(0, 1000);

    // Check that it has scrolled to that position.
    expect(window.pageYOffset).to.be.closeTo(1000, 0.5);

    // Wait a bit for `ScrollPositionRestoration` to save the scroll position
    // because it does that "asynchronously", i.e. in an "immediate" timeout
    // as a way of "throttling" scroll events.
    await delay(100);

    // Go to "/new" page.
    navigationStack.push('/new');

    // Create a scrollable container to test its scroll position restoration later.
    const scrollableContainer = document.createElement('div');
    scrollableContainer.style.height = '100px';
    scrollableContainer.style.width = '100px';
    // With default `overflow` value, the scrollable container won't become scrollable
    // and will simply stretch vertically according to the child content.
    scrollableContainer.style.overflow = 'auto';
    // "Overflow" the scrollable container with nested content so that it becomes scrollable.
    scrollableContainer.innerHTML = '<div style="height: 10000px"></div>';
    document.body.appendChild(scrollableContainer);

    // "/new" page rendered.
    // Restore scroll position (no saved scroll position to restore).
    await navigationStack.locationRendered(navigationStack.current());

    // It should've reset page scroll position.
    expect(window.pageYOffset).to.equal(0);

    // Scroll the page to some position.
    // The scroll position will be saved.
    window.scrollTo(0, 500);

    // Check that it has scrolled to that position.
    expect(window.pageYOffset).to.be.closeTo(500, 0.5);

    // Scroll inside the scrollable container to see if the scroll position
    // is restored later when revisiting this page.
    scrollableContainer.scrollTo(0, 1000);

    // Check that it has scrolled to that position.
    expect(scrollableContainer.scrollTop).to.be.closeTo(1000, 0.5);

    // Wait a bit for `ScrollPositionRestoration` to save the scroll position
    // because it does that "asynchronously", i.e. in an "immediate" timeout
    // as a way of "throttling" scroll events.
    await delay(100);

    // Register the scrollable container on the "/new" page.
    const untrackScrollableContainer = navigationStack.addScrollableContainer(
      'container',
      scrollableContainer,
    );

    // Go to "/new-2" page to check that it resets the scroll position inside the scrollable container.
    navigationStack.push('/new-2');

    // "/new-2" page rendered.
    // Restore scroll position (no saved scroll position to restore).
    await navigationStack.locationRendered(navigationStack.current());

    // Check that it has reset the scroll position inside the scrollable container.
    expect(scrollableContainer.scrollTop).to.equal(0);

    // It should also reset page scroll position on any "push" navigation.
    expect(window.pageYOffset).to.equal(0);

    // Return to the "/new" page to check if it restores scroll position inside the scrollable container.
    navigationStack.shift(-1);

    // Wait for the web browser to emit a "popstate" event from `window.history.go(-1)` navigation.
    await delay(100);

    // "/new" page rendered.
    // Restore scroll position.
    await navigationStack.locationRendered(navigationStack.current());

    // Check that it has restored the scroll position inside the scrollable container.
    expect(scrollableContainer.scrollTop).to.be.closeTo(1000, 0.5);

    // Check that it has restored page scroll position.
    expect(window.pageYOffset).to.be.closeTo(500, 0.5);

    // Return to the "/initial" page to check if it restores scroll position.
    navigationStack.shift(-1);

    // Wait for the web browser to emit a "popstate" event from `window.history.go(-1)` navigation.
    await delay(100);

    // The scrollable container is only present at the "/new" or "/new-2" pages so remove it now.
    document.body.removeChild(scrollableContainer);
    // The scrollable container is only present at the "/new" or "/new-2" pages so untrack it now.
    untrackScrollableContainer();

    // "/initial" page rendered.
    // Restore scroll position.
    await navigationStack.locationRendered(navigationStack.current());

    // Check that it has restored page scroll position.
    expect(window.pageYOffset).to.be.closeTo(1000, 0.5);
  });
});
