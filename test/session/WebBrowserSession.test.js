import delay from 'delay';

import parseInputLocation from '../../src/parseInputLocation';
import WebBrowserSession from '../../src/session/WebBrowserSession';

describe('WebBrowserSession.stop()', () => {
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    // Even if a test errors, the spies should be removed, otherwise it'll say:
    // "Attempted to wrap addEventListener which is already wrapped".
    sandbox.restore();
  });

  it('should add and remove "popstate" event listener', () => {
    sandbox.spy(window, 'addEventListener');
    sandbox.spy(window, 'removeEventListener');

    const session = new WebBrowserSession();

    session.subscribe(() => {});

    const listener = sinon.spy();

    // This subscription won't be "unsubscribed" by the code.
    // It is expected to be "unsubscribed" automatically on `session.stop()`
    // and not hold off the clearing of `popstate` listener.
    session.subscribe(listener);

    session.start(window.location);
    session.stop();

    expect(window.addEventListener)
      .to.have.been.calledOnce()
      .and.to.have.been.called.with('popstate');

    expect(window.removeEventListener)
      .to.have.been.calledOnce()
      .and.to.have.been.called.with('popstate');
  });
});

describe('WebBrowserSession', () => {
  let session;

  afterEach(() => {
    // Even if a test errors, the session should still be stopped
    // in order to remove the "popstate" listener so that it doesn't
    // interfere with other tests.
    session.stop();
  });

  it('should parse the initial location', () => {
    window.history.replaceState(null, null, '/initial?bar=baz#qux');
    session = new WebBrowserSession();

    let location;
    session.subscribe((newLocation) => {
      location = newLocation;
    });

    session.start(parseInputLocation(window.location));

    expect(location).to.deep.include({
      operation: 'INIT',
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
    session = new WebBrowserSession();

    expect(() =>
      session.navigate('PUSH', {
        pathname: '/new',
        search: '?search',
        hash: '#hash',
      }),
    ).to.throw('Not started');
  });

  it('should support basic navigation', async () => {
    window.history.replaceState(null, null, '/initial');

    session = new WebBrowserSession();

    let location;
    session.subscribe((newLocation) => {
      location = newLocation;
    });

    const listener = sinon.spy();
    session.subscribe(listener);

    session.start(parseInputLocation(window.location));

    expect(listener).to.have.been.calledOnce();
    expect(listener.firstCall.args[0]).to.deep.include({
      operation: 'INIT',
      pathname: '/initial',
      index: 0,
      delta: 0,
    });
    listener.resetHistory();

    session.navigate('PUSH', {
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
      operation: 'PUSH',
      pathname: '/new',
      search: '?search',
      hash: '#hash',
      index: 1,
      delta: 1,
    });
    expect(newLocation.key).not.to.be.empty();

    expect(listener).to.have.been.calledOnce();
    expect(listener.firstCall.args[0]).to.deep.include({
      operation: 'PUSH',
      pathname: '/new',
      index: 1,
      delta: 1,
    });
    listener.resetHistory();

    session.navigate('PUSH', {
      pathname: '/new-2',
      search: '',
      hash: '',
    });

    expect(location).to.include({
      operation: 'PUSH',
      pathname: '/new-2',
      index: 2,
      delta: 1,
    });

    expect(listener).to.have.been.calledOnce();
    expect(listener.firstCall.args[0]).to.deep.include({
      operation: 'PUSH',
      pathname: '/new-2',
      index: 2,
      delta: 1,
    });
    listener.resetHistory();

    expect(window.location.pathname).to.equal('/new-2');

    session.navigate('REPLACE', {
      pathname: '/new-3',
      search: '',
      hash: '',
    });

    expect(location).to.include({
      operation: 'REPLACE',
      pathname: '/new-3',
      index: 2,
      delta: 0,
    });
    await delay(20);

    expect(window.location.pathname).to.equal('/new-3');

    expect(listener).to.have.been.calledOnce();
    expect(listener.firstCall.args[0]).to.deep.include({
      operation: 'REPLACE',
      pathname: '/new-3',
      index: 2,
      delta: 0,
    });
    listener.resetHistory();

    session.shift(-1);
    await delay(20);

    expect(window.location).to.include({
      pathname: '/new',
      search: '?search',
      hash: '#hash',
    });

    expect(listener).to.have.been.calledOnce();
    expect(listener.firstCall.args[0]).to.deep.include({
      operation: 'SHIFT',
      pathname: '/new',
      search: '?search',
      hash: '#hash',
      key: newLocation.key,
      index: 1,
      delta: -1,
    });
    listener.resetHistory();

    window.history.back();
    await delay(20);

    expect(window.location.pathname).to.equal('/initial');

    expect(listener).to.have.been.calledOnce();
    expect(listener.firstCall.args[0]).to.deep.include({
      operation: 'SHIFT',
      pathname: '/initial',
      index: 0,
      delta: -1,
    });
    listener.resetHistory();
  });

  it('should support subscribing and unsubscribing', async () => {
    window.history.replaceState(null, null, '/');
    session = new WebBrowserSession();
    session.start(parseInputLocation(window.location));
    session.navigate('PUSH', {
      pathname: '/new',
      search: '',
      hash: '',
    });
    session.navigate('PUSH', {
      pathname: '/new-2',
      search: '',
      hash: '',
    });

    const listener = sinon.spy();
    const unsubscribe = session.subscribe(listener);

    session.shift(-1);
    await delay(20);

    expect(listener).to.have.been.calledOnce();
    expect(listener.firstCall.args[0]).to.include({
      operation: 'SHIFT',
      pathname: '/new',
    });
    listener.resetHistory();

    unsubscribe();

    session.shift(-1);
    await delay(20);

    expect(listener).not.to.have.been.called();
  });
});
