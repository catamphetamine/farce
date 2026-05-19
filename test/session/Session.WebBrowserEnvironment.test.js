// import { describe, it } from 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';

import delay from 'delay';

import WebBrowserEnvironment from '../../src/environment/WebBrowserEnvironment.js';
import parseInputLocation from '../../src/parseInputLocation.js';
import Session from '../../src/session/Session.js';

describe('Session.stop() (WebBrowserEnvironment)', () => {
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    // Even if a test errors, the spies should be removed, otherwise it'll say:
    // "Attempted to wrap addEventListener which is already wrapped".
    sandbox.restore();
  });

  it('should add and remove "popstate" event listener', () => {
    sandbox.spy(window, 'addEventListener');
    sandbox.spy(window, 'removeEventListener');

    const session = new Session(WebBrowserEnvironment);

    session.subscribe(() => {});

    const listener = sinon.spy();

    // This subscription won't be "unsubscribed" by the code.
    // It is expected to be "unsubscribed" automatically on `session.stop()`
    // and not hold off the clearing of `popstate` listener.
    session.subscribe(listener);

    session.start(window.location);
    session.stop();

    expect(window.addEventListener.callCount).to.equal(1)
    expect(window.addEventListener.calledWith('popstate')).to.equal(true)

    expect(window.removeEventListener.callCount).to.equal(1)
    expect(window.removeEventListener.calledWith('popstate')).to.equal(true)
  });
});

describe('Session (WebBrowserEnvironment)', () => {
  let session;

  afterEach(() => {
    // Even if a test errors, the session should still be stopped
    // in order to remove the "popstate" listener so that it doesn't
    // interfere with other tests.
    session.stop();
  });

  it('should parse the initial location', () => {
    window.history.replaceState(null, null, '/initial?bar=baz#qux');
    session = new Session(WebBrowserEnvironment);

    let location;
    session.subscribe((newLocation) => {
      location = newLocation;
    });

    session.start(parseInputLocation(window.location));

    expect(location).to.deep.include({
      operation: 'init',
      pathname: '/initial',
      search: '?bar=baz',
      query: {
        bar: 'baz',
      },
      hash: '#qux',
      index: 0,
      delta: 0,
    });
  });

  it('should require initialization', () => {
    session = new Session(WebBrowserEnvironment);

    expect(() =>
      session.navigate('push', {
        pathname: '/new',
        search: '?search',
        hash: '#hash',
      }),
    ).to.throw('Not started');
  });

  it('should support basic navigation', async () => {
    window.history.replaceState(null, null, '/initial');

    session = new Session(WebBrowserEnvironment);

    let location;
    session.subscribe((newLocation) => {
      location = newLocation;
    });

    const listener = sinon.spy();
    session.subscribe(listener);

    session.start(parseInputLocation(window.location));

    expect(listener.callCount).to.equal(1);
    expect(listener.firstCall.args[0]).to.deep.include({
      operation: 'init',
      pathname: '/initial',
      index: 0,
      delta: 0,
    });
    listener.resetHistory();

    session.navigate('push', {
      pathname: '/new',
      search: '?search',
      hash: '#hash',
    });

    const newLocation = location;

    expect(window.location).to.include({
      pathname: '/new',
      search: '?search',
      hash: '#hash',
    });
    expect(newLocation).to.deep.include({
      operation: 'push',
      pathname: '/new',
      search: '?search',
      hash: '#hash',
      index: 1,
      delta: 1,
    });
    expect(newLocation.key).not.to.be.empty;

    expect(listener.callCount).to.equal(1);
    expect(listener.firstCall.args[0]).to.deep.include({
      operation: 'push',
      pathname: '/new',
      index: 1,
      delta: 1,
    });
    listener.resetHistory();

    session.navigate('push', {
      pathname: '/new-2',
      search: '',
      hash: '',
    });

    expect(location).to.include({
      operation: 'push',
      pathname: '/new-2',
      index: 2,
      delta: 1,
    });

    expect(listener.callCount).to.equal(1);
    expect(listener.firstCall.args[0]).to.deep.include({
      operation: 'push',
      pathname: '/new-2',
      index: 2,
      delta: 1,
    });
    listener.resetHistory();

    expect(window.location.pathname).to.equal('/new-2');

    session.navigate('replace', {
      pathname: '/new-3',
      search: '',
      hash: '',
    });

    expect(location).to.include({
      operation: 'replace',
      pathname: '/new-3',
      index: 2,
      delta: 0,
    });
    await delay(100);

    expect(window.location.pathname).to.equal('/new-3');

    expect(listener.callCount).to.equal(1);
    expect(listener.firstCall.args[0]).to.deep.include({
      operation: 'replace',
      pathname: '/new-3',
      index: 2,
      delta: 0,
    });
    listener.resetHistory();

    session.shift(-1);
    await delay(100);

    expect(window.location).to.include({
      pathname: '/new',
      search: '?search',
      hash: '#hash',
    });

    expect(listener.callCount).to.equal(1);
    expect(listener.firstCall.args[0]).to.deep.include({
      operation: 'shift',
      pathname: '/new',
      search: '?search',
      hash: '#hash',
      key: newLocation.key,
      index: 1,
      delta: -1,
    });
    listener.resetHistory();

    window.history.back();
    await delay(100);

    expect(window.location.pathname).to.equal('/initial');

    expect(listener.callCount).to.equal(1);
    expect(listener.firstCall.args[0]).to.deep.include({
      operation: 'shift',
      pathname: '/initial',
      index: 0,
      delta: -1,
    });
    listener.resetHistory();
  });

  it('should support subscribing and unsubscribing', async () => {
    window.history.replaceState(null, null, '/');
    session = new Session(WebBrowserEnvironment);
    session.start(parseInputLocation(window.location));
    session.navigate('push', {
      pathname: '/new',
      search: '',
      hash: '',
    });
    session.navigate('push', {
      pathname: '/new-2',
      search: '',
      hash: '',
    });

    const listener = sinon.spy();
    const unsubscribe = session.subscribe(listener);

    session.shift(-1);
    await delay(100);

    expect(listener.callCount).to.equal(1);
    expect(listener.firstCall.args[0]).to.include({
      operation: 'shift',
      pathname: '/new',
    });
    listener.resetHistory();

    unsubscribe();

    session.shift(-1);
    await delay(100);

    expect(listener.callCount).to.equal(0);
  });
});

describe('Session (WebBrowserEnvironment) (restart)', () => {
  it('should restart a previously-started session', async () => {
    window.history.replaceState(null, null, '/initial');

    let currentLocation;
    const locationListener = (location) => {
      currentLocation = location;
    };

    const session = new Session(WebBrowserEnvironment);
    session.subscribe(locationListener);
    session.start();
    session.navigate('push', parseInputLocation('/new'));
    session.stop();

    const latestLocationIndex = currentLocation.index;
    expect(latestLocationIndex > 0).to.equal(true);

    // Simulate the user refreshing the page in a web browser.
    // In such case, `window.history` will be retained
    // but every javascript variable will be recreated from scratch.
    const newSession = new Session(WebBrowserEnvironment);
    newSession.subscribe(locationListener);
    newSession.start();

    // eslint-disable-next-line no-underscore-dangle
    expect(newSession._latestLocation.operation).to.equal('init');

    expect(currentLocation.pathname).to.equal('/new');
    expect(currentLocation.index).to.equal(latestLocationIndex);

    newSession.shift(-1);

    await delay(100);

    expect(currentLocation.pathname).to.equal('/initial');
    expect(currentLocation.index).to.equal(latestLocationIndex - 1);

    newSession.shift(1);

    await delay(100);

    expect(currentLocation.pathname).to.equal('/new');
    expect(currentLocation.index).to.equal(latestLocationIndex);

    newSession.stop();
  });
});
