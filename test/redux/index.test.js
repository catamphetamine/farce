import * as exports from '../../src/redux';

describe('redux', () => {
  it('should export top level correctly', () => {
    expect(exports.Actions).to.exist();
    expect(exports.ActionTypes).to.exist();
    expect(exports.createMiddlewares).to.exist();
    expect(exports.locationReducer).to.exist();
  });
});
