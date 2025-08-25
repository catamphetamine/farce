import { applyMiddleware, createStore } from 'redux';

import Actions from '../../src/Actions';
import addBeforeLocationChangeListenerOriginal from '../../src/addBeforeLocationChangeListener';
import createMiddlewares from '../../src/createMiddlewares';
import locationReducer from '../../src/locationReducer';
import MemorySession from '../../src/session/MemorySession';
import { shouldWarn } from '../helpers';

describe('createBeforeLocationChangeListenerMiddleware', () => {
  const sandbox = sinon.createSandbox();

  let session;
  let store;

  function addBeforeLocationChangeListener(listener) {
    return addBeforeLocationChangeListenerOriginal(session, listener);
  }

  beforeEach(() => {
    session = new MemorySession('/foo');

    store = createStore(
      locationReducer,
      applyMiddleware(...createMiddlewares(session)),
    );
    store.dispatch(Actions.init());
  });

  afterEach(() => {
    store.dispatch(Actions.dispose());

    sandbox.restore();
  });

  describe('PUSH navigations', () => {
    it('should listen to upcoming navigation', () => {
      const listener1 = sinon.stub();
      const listener2 = sinon.stub();

      addBeforeLocationChangeListener(listener1);
      addBeforeLocationChangeListener(listener2);

      store.dispatch(Actions.push('/bar'));
      expect(store.getState().pathname).to.equal('/bar');

      expect(listener1).to.have.been.calledOnce();

      expect(listener1.firstCall.args[0]).to.include({
        action: 'PUSH',
        pathname: '/bar',
      });

      expect(listener2).to.have.been.calledOnce();

      expect(listener2.firstCall.args[0]).to.include({
        action: 'PUSH',
        pathname: '/bar',
      });
    });

    it('should warn on and ignore listeners that throw', () => {
      shouldWarn(
        'Ignoring before location change listener `syncListener` that failed with `Error: foo`.',
      );

      const syncListener = () => {
        throw new Error('foo');
      };

      addBeforeLocationChangeListener(syncListener);

      store.dispatch(Actions.push('/bar'));
      expect(store.getState().pathname).to.equal('/bar');
    });

    it('should allow removing listeners', () => {
      const listener = sinon.stub();

      const removeNavigationListener =
        addBeforeLocationChangeListener(listener);

      store.dispatch(Actions.push('/bar-1'));
      expect(store.getState().pathname).to.equal('/bar-1');

      expect(listener).to.have.been.calledOnce();

      removeNavigationListener();

      store.dispatch(Actions.push('/bar-2'));
      expect(store.getState().pathname).to.equal('/bar-2');

      expect(listener).to.have.been.calledOnce();
    });
  });

  describe('POP navigations', () => {
    beforeEach(() => {
      store.dispatch(Actions.push('/bar'));
    });

    it('should listen to upcoming navigation', () => {
      const listener = sinon.stub();
      addBeforeLocationChangeListener(listener);

      store.dispatch(Actions.shift(-1));
      expect(store.getState().pathname).to.equal('/foo');

      expect(listener).to.have.been.calledOnce();

      expect(listener.firstCall.args[0]).to.include({
        action: 'POP',
        pathname: '/foo',
        delta: -1,
      });
    });
  });

  describe('INIT', () => {
    it('should ignore to the initial load', () => {
      // Get rid of the old store. We'll replace it with a new one.
      store.dispatch(Actions.dispose());

      store = createStore(
        locationReducer,
        applyMiddleware(...createMiddlewares(new MemorySession('/foo'))),
      );

      const listener = sinon.stub();
      addBeforeLocationChangeListener(listener);

      expect(listener).to.not.have.been.called();

      expect(store.getState()).to.be.undefined();
      store.dispatch(Actions.init());
      expect(store.getState().pathname).to.equal('/foo');

      expect(listener).to.not.have.been.called();
    });
  });
});
