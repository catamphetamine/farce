// import { describe, it } from 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';

import InMemoryEnvironment from '../../src/environment/InMemoryEnvironment.js';
import parseInputLocation from '../../src/parseInputLocation.js';
import Session from '../../src/session/Session.js';

describe('Session (InMemoryEnvironment)', () => {
  it('should parse the initial location', () => {
    const session = new Session(InMemoryEnvironment);

    let location;
    session.subscribe((newLocation) => {
      location = newLocation;
    });

    session.start(parseInputLocation('/initial?bar=baz#qux'));

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

    session.stop();
  });

  it('should support basic navigation', () => {
    const session = new Session(InMemoryEnvironment);

    let location;
    session.subscribe((newLocation) => {
      location = newLocation;
    });

    const listener = sinon.spy();
    session.subscribe(listener);

    session.start(parseInputLocation('/initial'));

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
    });

    const newLocation = location;

    expect(newLocation).to.deep.include({
      operation: 'push',
      pathname: '/new',
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

    session.navigate('push', { pathname: '/new-2' });

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

    session.navigate('replace', { pathname: '/new-3' });

    expect(location).to.include({
      operation: 'replace',
      pathname: '/new-3',
      index: 2,
      delta: 0,
    });

    expect(listener.callCount).to.equal(1);
    expect(listener.firstCall.args[0]).to.deep.include({
      operation: 'replace',
      pathname: '/new-3',
      index: 2,
      delta: 0,
    });
    listener.resetHistory();

    session.shift(-1);

    expect(listener.callCount).to.equal(1);
    expect(listener.firstCall.args[0]).to.deep.include({
      operation: 'shift',
      pathname: '/new',
      key: newLocation.key,
      index: 1,
      delta: -1,
    });
    listener.resetHistory();

    session.stop();
  });

  it('should support subscribing and unsubscribing', () => {
    const session = new Session(InMemoryEnvironment);
    session.start(parseInputLocation('/initial'));
    session.navigate('push', { pathname: '/new' });
    session.navigate('push', { pathname: '/new-2' });

    const listener = sinon.spy();
    const unsubscribe = session.subscribe(listener);

    session.shift(-1);

    expect(listener.callCount).to.equal(1);
    expect(listener.firstCall.args[0]).to.include({
      operation: 'shift',
      pathname: '/new',
    });
    listener.resetHistory();

    unsubscribe();

    session.shift(-1);

    expect(listener.callCount).to.equal(0);

    session.stop();
  });

  it('should respect stack bounds', () => {
    const session = new Session(InMemoryEnvironment);
    session.start(parseInputLocation('/initial'));
    session.navigate('push', { pathname: '/new' });
    session.navigate('push', { pathname: '/new-2' });

    const listener = sinon.spy();
    session.subscribe(listener);

    expect(() => {
      session.shift(-390);
    }).to.throw('out of navigation history bounds');

    expect(listener.callCount).to.equal(0);

    session.shift(-2);

    expect(listener.callCount).to.equal(1);
    expect(listener.firstCall.args[0]).to.include({
      operation: 'shift',
      pathname: '/initial',
      delta: -2,
    });
    listener.resetHistory();

    expect(() => {
      session.shift(-1);
    }).to.throw('out of navigation history bounds');

    expect(listener.callCount).to.equal(0);

    expect(() => {
      session.shift(+22);
    }).to.throw('out of navigation history bounds');

    session.shift(+2);

    expect(listener.callCount).to.equal(1);
    expect(listener.firstCall.args[0]).to.include({
      operation: 'shift',
      pathname: '/new-2',
      delta: 2,
    });
    listener.resetHistory();

    expect(() => {
      session.shift(+1);
    }).to.throw('out of navigation history bounds');

    expect(listener.callCount).to.equal(0);

    session.stop();
  });

  it('should not reset forward entries on replace', () => {
    const session = new Session(InMemoryEnvironment);
    session.start(parseInputLocation('/initial'));
    session.navigate('push', { pathname: '/new' });
    session.navigate('push', { pathname: '/new-2' });
    session.shift(-2);
    session.navigate('replace', { pathname: '/new-3' });

    const listener = sinon.spy();
    session.subscribe(listener);

    session.shift(+1);

    expect(listener.callCount).to.equal(1);
    expect(listener.firstCall.args[0]).to.include({
      operation: 'shift',
      pathname: '/new',
      delta: 1,
    });

    session.stop();
  });

  it('should reset forward entries on push', () => {
    const session = new Session(InMemoryEnvironment);

    session.start(parseInputLocation('/initial'));
    session.navigate('push', { pathname: '/new' });
    session.navigate('push', { pathname: '/new-2' });
    session.shift(-2);
    session.navigate('push', { pathname: '/new-3' });

    const listener = sinon.spy();
    session.subscribe(listener);

    expect(() => {
      session.shift(+1);
    }).to.throw('out of navigation history bounds');

    expect(listener.callCount).to.equal(0);

    session.stop();
  });

  it('should remove all subscriptions on stop', () => {
    const session = new Session(InMemoryEnvironment);

    session.start(parseInputLocation('/initial'));

    // Validate that 1 listener is currently attached:
    // * The "main" listener of the `Session` which updates current location index property value.
    // * There's no `NavigationStack`'s "main" listener in this list because no `NavigationStack` instance is created here.
    expect(
      // eslint-disable-next-line no-underscore-dangle
      session._synchronousLocationChangesSubscription._listeners.length,
    ).to.equal(1);
    expect(
      // eslint-disable-next-line no-underscore-dangle
      session._asynchronousLocationChangesSubscription._listeners.length,
    ).to.equal(1);

    // Add a new listener.
    const listener = sinon.spy();
    session.subscribe(listener);

    // Validate that 2 listeners are currently attached:
    // * The "main" listener of the `Session` which updates current location index property value.
    // * An additional "dummy" listener.
    // * There's no `NavigationStack`'s "main" listener in this list because no `NavigationStack` instance is created here.
    expect(
      // eslint-disable-next-line no-underscore-dangle
      session._synchronousLocationChangesSubscription._listeners.length,
    ).to.equal(2);
    expect(
      // eslint-disable-next-line no-underscore-dangle
      session._asynchronousLocationChangesSubscription._listeners.length,
    ).to.equal(2);

    // Stop the session. This will remove any listeners.
    session.stop();

    // Validate that no listeners are currently attached
    // because the session was stopped.
    expect(
      // eslint-disable-next-line no-underscore-dangle
      session._synchronousLocationChangesSubscription._listeners.length,
    ).to.equal(0);
    expect(
      // eslint-disable-next-line no-underscore-dangle
      session._asynchronousLocationChangesSubscription._listeners.length,
    ).to.equal(0);
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
  //     session1._navigation.navigate('push', { pathname: '/new' });
  //     session1._navigation.navigate('push', { pathname: '/new-2' });
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
