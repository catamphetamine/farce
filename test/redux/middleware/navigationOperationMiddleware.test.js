import ActionTypes from '../../../src/redux/ActionTypes';
import navigationOperationMiddleware from '../../../src/redux/middleware/navigationOperationMiddleware';

describe('navigationOperationMiddleware', () => {
  let next;
  let dispatch;
  beforeEach(() => {
    next = sinon.spy();
    dispatch = navigationOperationMiddleware()(next);
  });

  it('should change `type` of PUSH action', () => {
    dispatch({
      type: ActionTypes.PUSH,
      payload: {
        pathname: '/foo',
        search: '?bar=baz',
        hash: '#qux',
      },
    });

    expect(next).to.be.calledWith({
      type: ActionTypes.NAVIGATE,
      payload: {
        operation: 'push',
        location: {
          pathname: '/foo',
          search: '?bar=baz',
          hash: '#qux',
        },
      },
    });
  });

  it('should change `type` of REPLACE action', () => {
    dispatch({
      type: ActionTypes.REPLACE,
      payload: {
        pathname: '/foo',
        search: '?bar=baz',
        hash: '#qux',
      },
    });

    expect(next).to.be.calledWith({
      type: ActionTypes.NAVIGATE,
      payload: {
        operation: 'replace',
        location: {
          pathname: '/foo',
          search: '?bar=baz',
          hash: '#qux',
        },
      },
    });
  });

  it('should not affect other action', () => {
    const UNKNOWN = 'UNKNOWN';
    dispatch({
      type: UNKNOWN,
      payload: {
        pathname: '/foo',
        search: '?bar=baz',
        hash: '#qux',
      },
    });

    expect(next).to.be.calledWith({
      type: UNKNOWN,
      payload: {
        pathname: '/foo',
        search: '?bar=baz',
        hash: '#qux',
      },
    });
  });
});
