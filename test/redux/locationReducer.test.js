import ActionTypes from '../../src/redux/ActionTypes';
import locationReducer from '../../src/redux/locationReducer';

describe('locationReducer', () => {
  const prevState = {
    operation: 'PUSH',
    delta: 1,
    hash: '',
    index: 5,
    key: 'h0j8qq:4',
    pathname: '/new/path',
    query: {},
    search: '',
  };

  it('should handle UPDATE', () => {
    const newLocation = {
      key: 'h0j8qq:5',
      pathname: '/foo',
      query: {
        bar: 'baz',
      },
      search: '?bar=baz',
      hash: '#qux',
    };
    const action = {
      type: ActionTypes.UPDATE,
      payload: newLocation,
    };
    expect(locationReducer(prevState, action)).to.eql(newLocation);
  });

  it('should not handle unknown action', () => {
    const unknownAction = {
      type: 'UNKNOWN',
    };
    expect(locationReducer(prevState, unknownAction)).to.equal(prevState);
  });
});
