import parseInputLocation from '../../src/parseInputLocation';
import InMemorySession from '../../src/session/InMemorySession';

describe('InMemorySession', () => {
  it('should parse the initial location', () => {
    const session = new InMemorySession();

    let location;
    session.subscribe((newLocation) => {
      location = newLocation;
    });

    session.start(parseInputLocation('/initial?bar=baz#qux'));

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

    session.stop();
  });

  it('should support basic navigation', () => {
    const session = new InMemorySession();

    let location;
    session.subscribe((newLocation) => {
      location = newLocation;
    });

    const listener = sinon.spy();
    session.subscribe(listener);

    session.start(parseInputLocation('/initial'));

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
    });

    const newLocation = location;

    expect(newLocation).to.deep.include({
      operation: 'PUSH',
      pathname: '/new',
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

    session.navigate('PUSH', { pathname: '/new-2' });

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

    session.navigate('REPLACE', { pathname: '/new-3' });

    expect(location).to.include({
      operation: 'REPLACE',
      pathname: '/new-3',
      index: 2,
      delta: 0,
    });

    expect(listener).to.have.been.calledOnce();
    expect(listener.firstCall.args[0]).to.deep.include({
      operation: 'REPLACE',
      pathname: '/new-3',
      index: 2,
      delta: 0,
    });
    listener.resetHistory();

    session.shift(-1);

    expect(listener).to.have.been.calledOnce();
    expect(listener.firstCall.args[0]).to.deep.include({
      operation: 'SHIFT',
      pathname: '/new',
      key: newLocation.key,
      index: 1,
      delta: -1,
    });
    listener.resetHistory();

    session.stop();
  });

  it('should support subscribing and unsubscribing', () => {
    const session = new InMemorySession();
    session.start(parseInputLocation('/initial'));
    session.navigate('PUSH', { pathname: '/new' });
    session.navigate('PUSH', { pathname: '/new-2' });

    const listener = sinon.spy();
    const unsubscribe = session.subscribe(listener);

    session.shift(-1);

    expect(listener).to.have.been.calledOnce();
    expect(listener.firstCall.args[0]).to.include({
      operation: 'SHIFT',
      pathname: '/new',
    });
    listener.resetHistory();

    unsubscribe();

    session.shift(-1);

    expect(listener).not.to.have.been.called();

    session.stop();
  });

  it('should respect stack bounds', () => {
    const session = new InMemorySession();
    session.start(parseInputLocation('/initial'));
    session.navigate('PUSH', { pathname: '/new' });
    session.navigate('PUSH', { pathname: '/new-2' });

    const listener = sinon.spy();
    session.subscribe(listener);

    expect(() => {
      session.shift(-390);
    }).to.throw('out of navigation history bounds');

    expect(listener).to.not.have.been.called();

    session.shift(-2);

    expect(listener).to.have.been.calledOnce();
    expect(listener.firstCall.args[0]).to.include({
      operation: 'SHIFT',
      pathname: '/initial',
      delta: -2,
    });
    listener.resetHistory();

    expect(() => {
      session.shift(-1);
    }).to.throw('out of navigation history bounds');

    expect(listener).not.to.have.been.called();

    expect(() => {
      session.shift(+22);
    }).to.throw('out of navigation history bounds');

    session.shift(+2);

    expect(listener).to.have.been.calledOnce();
    expect(listener.firstCall.args[0]).to.include({
      operation: 'SHIFT',
      pathname: '/new-2',
      delta: 2,
    });
    listener.resetHistory();

    expect(() => {
      session.shift(+1);
    }).to.throw('out of navigation history bounds');

    expect(listener).not.to.have.been.called();

    session.stop();
  });

  it('should not reset forward entries on replace', () => {
    const session = new InMemorySession();
    session.start(parseInputLocation('/initial'));
    session.navigate('PUSH', { pathname: '/new' });
    session.navigate('PUSH', { pathname: '/new-2' });
    session.shift(-2);
    session.navigate('REPLACE', { pathname: '/new-3' });

    const listener = sinon.spy();
    session.subscribe(listener);

    session.shift(+1);

    expect(listener).to.have.been.calledOnce();
    expect(listener.firstCall.args[0]).to.include({
      operation: 'SHIFT',
      pathname: '/new',
      delta: 1,
    });

    session.stop();
  });

  it('should reset forward entries on push', () => {
    const session = new InMemorySession();

    session.start(parseInputLocation('/initial'));
    session.navigate('PUSH', { pathname: '/new' });
    session.navigate('PUSH', { pathname: '/new-2' });
    session.shift(-2);
    session.navigate('PUSH', { pathname: '/new-3' });

    const listener = sinon.spy();
    session.subscribe(listener);

    expect(() => {
      session.shift(+1);
    }).to.throw('out of navigation history bounds');

    expect(listener).not.to.have.been.called();

    session.stop();
  });

  it('should remove all subscriptions on stop', () => {
    const session = new InMemorySession();

    session.start(parseInputLocation('/initial'));

    // eslint-disable-next-line no-underscore-dangle
    expect(session._subscription._listeners.length).to.equal(1);

    const listener = sinon.spy();
    session.subscribe(listener);

    // eslint-disable-next-line no-underscore-dangle
    expect(session._subscription._listeners.length).to.equal(2);

    session.stop();

    // eslint-disable-next-line no-underscore-dangle
    expect(session._subscription._listeners.length).to.equal(0);
  });

  // describe('persistence', () => {
  //   // beforeEach(() => {
  //   //   window.sessionStorage.clear();
  //   // });
  //
  //   it('should support persistence', () => {
  //     // function save(key, data) {
  //     //   window.sessionStorage.setItem(key, data);
  //     // }
  //     //
  //     // function load(key) {
  //     //   return window.sessionStorage.getItem(key);
  //     // }
  //
  //     const storage = {};
  //
  //     const save = (key, data) => {
  //       storage[key] = data;
  //     };
  //
  //     const load = (key) => {
  //       return storage[key];
  //     };
  //
  //     const session1 = new InMemorySession({ save, load });
  //     expect(session1.start(parseInputLocation('/initial))).to.include({
  //       pathname: '/initial',
  //     });
  //
  //     session1._navigation.navigate('PUSH', { pathname: '/new' });
  //     session1._navigation.navigate('PUSH', { pathname: '/new-2' });
  //     session1._navigation.shift(-1);
  //
  //     const session2 = new InMemorySession({ save, load });
  //     expect(parseInputLocation(session2.start('/initial'))).to.include({
  //       pathname: '/new',
  //     });
  //
  //     session2._navigation.shift(+1);
  //     expect(parseInputLocation(session2.start())).to.include({
  //       pathname: '/new-2',
  //     });
  //     session1.stop();
  //     session2.stop();
  //   });
  //
  //   it('should ignore broken session storage entry', () => {
  //     // function save(key, data) {
  //     //   window.sessionStorage.setItem(key, data);
  //     // }
  //     //
  //     // function load(key) {
  //     //   return window.sessionStorage.getItem(key);
  //     // }
  //
  //     const storage = {};
  //
  //     const save = (key, data) => {
  //       storage[key] = data;
  //     };
  //
  //     const load = (key) => {
  //       return storage[key];
  //     };
  //
  //     save(
  //       // `stack` should have sufficient items so that the `index` wouldn't be out of bounds.
  //       JSON.stringify({ stack: [], index: 2 }),
  //     );
  //
  //     const session = new InMemorySession({ save, load });
  //     expect(session.start(parseInputLocation('/initial'))).to.include({
  //       pathname: '/initial',
  //     });
  //     session.stop();
  //   });
  // });
});
