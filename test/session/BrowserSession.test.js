import delay from 'delay';

import BrowserSession from '../../src/session/BrowserSession';

describe('BrowserSession', () => {
  beforeEach(() => {
    window.history.replaceState(null, null, '/');
  });

  it('should parse the initial location', () => {
    window.history.replaceState(null, null, '/foo?bar=baz#qux');
    const session = new BrowserSession();

    expect(session.navigation.init()).to.deep.include({
      action: 'INIT',
      pathname: '/foo',
      search: '?bar=baz',
      query: {
        bar: 'baz',
      },
      hash: '#qux',
      index: 0,
      delta: 0,
      state: undefined,
    });
  });

  it('should require initialization', () => {
    const session = new BrowserSession();

    expect(() =>
      session.navigation.navigate({
        action: 'PUSH',
        pathname: '/bar',
        search: '?search',
        hash: '#hash',
        state: { the: 'state' },
      }),
    ).to.throw('Browser session must be initialized before navigation');
  });

  it('should support basic navigation', async () => {
    window.history.replaceState(null, null, '/foo');
    const session = new BrowserSession();

    const listener = sinon.spy();
    session.navigation.subscribe(listener);

    session.navigation.init();

    const barLocation = session.navigation.navigate({
      action: 'PUSH',
      pathname: '/bar',
      search: '?search',
      hash: '#hash',
      state: { the: 'state' },
    });

    expect(window.location).to.include({
      pathname: '/bar',
      search: '?search',
      hash: '#hash',
    });
    expect(barLocation).to.deep.include({
      action: 'PUSH',
      pathname: '/bar',
      search: '?search',
      hash: '#hash',
      index: 1,
      delta: 1,
      state: { the: 'state' },
    });
    expect(barLocation.key).not.to.be.empty();

    expect(
      session.navigation.navigate({
        action: 'PUSH',
        pathname: '/baz',
        search: '',
        hash: '',
      }),
    ).to.include({
      action: 'PUSH',
      pathname: '/baz',
      index: 2,
      delta: 1,
    });

    expect(window.location.pathname).to.equal('/baz');

    expect(
      session.navigation.navigate({
        action: 'REPLACE',
        pathname: '/qux',
        search: '',
        hash: '',
      }),
    ).to.include({
      action: 'REPLACE',
      pathname: '/qux',
      index: 2,
      delta: 0,
    });
    await delay(20);

    expect(window.location.pathname).to.equal('/qux');
    expect(listener).not.to.have.been.called();

    session.navigation.shift(-1);
    await delay(20);

    expect(window.location).to.include({
      pathname: '/bar',
      search: '?search',
      hash: '#hash',
    });
    expect(listener).to.have.been.calledOnce();
    expect(listener.firstCall.args[0]).to.deep.include({
      action: 'POP',
      pathname: '/bar',
      search: '?search',
      hash: '#hash',
      key: barLocation.key,
      index: 1,
      delta: -1,
      state: { the: 'state' },
    });
    listener.resetHistory();

    window.history.back();
    await delay(20);

    expect(window.location.pathname).to.equal('/foo');
    expect(listener).to.have.been.calledOnce();
    expect(listener.firstCall.args[0]).to.deep.include({
      action: 'POP',
      pathname: '/foo',
      index: 0,
      delta: -1,
      state: undefined,
    });

    listener.resetHistory();
  });

  it('should support subscribing and unsubscribing', async () => {
    const session = new BrowserSession();
    session.navigation.init();
    session.navigation.navigate({
      action: 'PUSH',
      pathname: '/bar',
      search: '',
      hash: '',
    });
    session.navigation.navigate({
      action: 'PUSH',
      pathname: '/baz',
      search: '',
      hash: '',
    });

    const listener = sinon.spy();
    const unsubscribe = session.navigation.subscribe(listener);

    session.navigation.shift(-1);
    await delay(20);

    expect(listener).to.have.been.calledOnce();
    expect(listener.firstCall.args[0]).to.include({
      action: 'POP',
      pathname: '/bar',
    });
    listener.resetHistory();

    unsubscribe();

    session.navigation.shift(-1);
    await delay(20);

    expect(listener).not.to.have.been.called();
  });
});
