import MemorySession from '../../src/session/MemorySession';

describe('MemorySession', () => {
  it('should parse the initial location', () => {
    const session = new MemorySession('/foo?bar=baz#qux');

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
    });
  });

  it('should support basic navigation', () => {
    const session = new MemorySession('/foo');

    const listener = sinon.spy();
    session.navigation.subscribe(listener);

    const barLocation = session.navigation.navigate({
      action: 'PUSH',
      pathname: '/bar',
      state: { the: 'state' },
    });

    expect(barLocation).to.deep.include({
      action: 'PUSH',
      pathname: '/bar',
      index: 1,
      delta: 1,
      state: { the: 'state' },
    });
    expect(barLocation.key).not.to.be.empty();

    expect(
      session.navigation.navigate({ action: 'PUSH', pathname: '/baz' }),
    ).to.include({
      action: 'PUSH',
      pathname: '/baz',
      index: 2,
      delta: 1,
    });

    expect(
      session.navigation.navigate({ action: 'REPLACE', pathname: '/qux' }),
    ).to.include({
      action: 'REPLACE',
      pathname: '/qux',
      index: 2,
      delta: 0,
    });

    expect(listener).not.to.have.been.called();

    session.navigation.shift(-1);

    expect(listener).to.have.been.calledOnce();
    expect(listener.firstCall.args[0]).to.deep.include({
      action: 'POP',
      pathname: '/bar',
      key: barLocation.key,
      index: 1,
      delta: -1,
      state: { the: 'state' },
    });
  });

  it('should support subscribing and unsubscribing', () => {
    const session = new MemorySession('/foo');
    session.navigation.navigate({ action: 'PUSH', pathname: '/bar' });
    session.navigation.navigate({ action: 'PUSH', pathname: '/baz' });

    const listener = sinon.spy();
    const unsubscribe = session.navigation.subscribe(listener);

    session.navigation.shift(-1);

    expect(listener).to.have.been.calledOnce();
    expect(listener.firstCall.args[0]).to.include({
      action: 'POP',
      pathname: '/bar',
    });
    listener.resetHistory();

    unsubscribe();

    session.navigation.shift(-1);

    expect(listener).not.to.have.been.called();
  });

  it('should respect stack bounds', () => {
    const session = new MemorySession('/foo');
    session.navigation.navigate({ action: 'PUSH', pathname: '/bar' });
    session.navigation.navigate({ action: 'PUSH', pathname: '/baz' });

    const listener = sinon.spy();
    session.navigation.subscribe(listener);

    session.navigation.shift(-390);

    expect(listener).to.have.been.calledOnce();
    expect(listener.firstCall.args[0]).to.include({
      action: 'POP',
      pathname: '/foo',
      delta: -2,
    });
    listener.resetHistory();

    session.navigation.shift(-1);

    expect(listener).not.to.have.been.called();

    session.navigation.shift(+22);

    expect(listener).to.have.been.calledOnce();
    expect(listener.firstCall.args[0]).to.include({
      action: 'POP',
      pathname: '/baz',
      delta: 2,
    });
    listener.resetHistory();

    session.navigation.shift(+1);

    expect(listener).not.to.have.been.called();
  });

  it('should reset forward entries on push', () => {
    const session = new MemorySession('/foo');
    session.navigation.navigate({ action: 'PUSH', pathname: '/bar' });
    session.navigation.navigate({ action: 'PUSH', pathname: '/baz' });
    session.navigation.shift(-2);
    session.navigation.navigate({ action: 'REPLACE', pathname: '/qux' });

    const listener = sinon.spy();
    session.navigation.subscribe(listener);

    session.navigation.shift(+1);

    expect(listener).to.have.been.calledOnce();
    expect(listener.firstCall.args[0]).to.include({
      action: 'POP',
      pathname: '/bar',
      delta: 1,
    });
  });

  it('should not reset forward entries on replace', () => {
    const session = new MemorySession('/foo');
    session.navigation.navigate({ action: 'PUSH', pathname: '/bar' });
    session.navigation.navigate({ action: 'PUSH', pathname: '/baz' });
    session.navigation.shift(-2);
    session.navigation.navigate({ action: 'PUSH', pathname: '/qux' });

    const listener = sinon.spy();
    session.navigation.subscribe(listener);

    session.navigation.shift(+1);

    expect(listener).not.to.have.been.called();
  });

  describe('persistence', () => {
    // beforeEach(() => {
    //   window.sessionStorage.clear();
    // });

    it('should support persistence', () => {
      // function save(key, data) {
      //   window.sessionStorage.setItem(key, data);
      // }
      //
      // function load(key) {
      //   return window.sessionStorage.getItem(key);
      // }

      const storage = {};

      const save = (key, data) => {
        storage[key] = data;
      };

      const load = (key) => {
        return storage[key];
      };

      const session1 = new MemorySession('/foo', { save, load });
      expect(session1.navigation.init()).to.include({
        pathname: '/foo',
      });

      session1.navigation.navigate({ action: 'PUSH', pathname: '/bar' });
      session1.navigation.navigate({ action: 'PUSH', pathname: '/baz' });
      session1.navigation.shift(-1);

      const session2 = new MemorySession('/foo', { save, load });
      expect(session2.navigation.init()).to.include({
        pathname: '/bar',
      });

      session2.navigation.shift(+1);
      expect(session2.navigation.init()).to.include({
        pathname: '/baz',
      });
    });

    it('should ignore broken session storage entry', () => {
      // function save(key, data) {
      //   window.sessionStorage.setItem(key, data);
      // }
      //
      // function load(key) {
      //   return window.sessionStorage.getItem(key);
      // }

      const storage = {};

      const save = (key, data) => {
        storage[key] = data;
      };

      const load = (key) => {
        return storage[key];
      };

      save(
        // `stack` should have sufficient items so that the `index` wouldn't be out of bounds.
        JSON.stringify({ stack: [], index: 2 }),
      );

      const session = new MemorySession('/foo', { save, load });
      expect(session.navigation.init()).to.include({
        pathname: '/foo',
      });
    });
  });
});
