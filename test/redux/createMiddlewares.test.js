import { applyMiddleware, createStore } from 'redux';

import Actions from '../../src/redux/Actions';
import createMiddlewares from '../../src/redux/createMiddlewares';
import internalLocationReducer from '../../src/redux/internalLocationReducer';
import InMemorySession from '../../src/session/InMemorySession';

describe('createMiddlewares', () => {
  let store;

  beforeEach(() => {
    store = createStore(
      internalLocationReducer,
      applyMiddleware(
        ...createMiddlewares(new InMemorySession(), {
          _internalLocationReducer: true,
        }),
      ),
    );
    store.dispatch(Actions.init('/initial'));
  });

  afterEach(() => {
    store.dispatch(Actions.stop());
  });

  it('should support `push` and `shift` navigation actions', () => {
    store.dispatch(Actions.push('/new'));
    expect(store.getState()).to.include({
      pathname: '/new',
      index: 1,
    });

    store.dispatch(Actions.shift(-1));
    expect(store.getState()).to.include({
      pathname: '/initial',
      index: 0,
    });

    store.dispatch(Actions.shift(+1));
    expect(store.getState()).to.include({
      pathname: '/new',
      index: 1,
    });
  });

  it('should support `replace` navigation action', () => {
    store.dispatch(Actions.replace('/new'));
    expect(store.getState()).to.include({
      pathname: '/new',
      index: 0,
    });
  });

  it('should ignore other actions', () => {
    expect(
      store.dispatch({
        type: 'UNKNOWN',
        payload: { unknown: {} },
      }),
    ).to.eql({
      type: 'UNKNOWN',
      payload: { unknown: {} },
    });
  });
});

describe('createMiddlewares.basePath', () => {
  it('should support `basePath`', () => {
    const session = new InMemorySession();

    const store = createStore(
      internalLocationReducer,
      applyMiddleware(
        ...createMiddlewares(session, {
          basePath: '/base',
          _internalLocationReducer: true,
        }),
      ),
    );

    store.dispatch(Actions.init('/initial'));

    store.dispatch(Actions.push('/new'));

    // eslint-disable-next-line no-underscore-dangle
    expect(session._subscription._latest.pathname).to.equal('/base/new');

    expect(store.getState()).to.include({
      pathname: '/new',
      index: 1,
    });

    store.dispatch(Actions.stop());
  });
});
