import { applyMiddleware, createStore } from 'redux';

import Actions from '../src/Actions';
import MemoryProtocol from '../src/MemoryProtocol';
import createReduxMiddlewares from '../src/createReduxMiddlewares';
import locationReducer from '../src/locationReducer';

describe('createHistoryMiddleware', () => {
  let store;

  beforeEach(() => {
    store = createStore(
      locationReducer,
      applyMiddleware(
        ...createReduxMiddlewares({ protocol: new MemoryProtocol('/foo') }),
      ),
    );
    store.dispatch(Actions.init());
  });

  afterEach(() => {
    store.dispatch(Actions.dispose());
  });

  it('should support push and go', () => {
    store.dispatch(Actions.push('/bar'));
    expect(store.getState()).to.include({
      pathname: '/bar',
      index: 1,
    });

    store.dispatch(Actions.go(-1));
    expect(store.getState()).to.include({
      pathname: '/foo',
      index: 0,
    });

    store.dispatch(Actions.go(+1));
    expect(store.getState()).to.include({
      pathname: '/bar',
      index: 1,
    });
  });

  it('should support replace', () => {
    store.dispatch(Actions.replace('/bar'));
    expect(store.getState()).to.include({
      pathname: '/bar',
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
