import * as exports from '../../src/data-storage';

describe('index', () => {
  it('should export top level correctly', () => {
    expect(exports.DataStorage).to.exist();
    expect(exports.LocationDataStorage).to.exist();
  });
});
