import getLocationUrl from '../src/getLocationUrl';

describe('getLocationUrl', () => {
  it('should get location URL from `pathname`, `search`, and `hash`', () => {
    expect(
      getLocationUrl({
        pathname: '/foo',
        search: '?bar=baz',
        hash: '#qux',
      }),
    ).to.equal('/foo?bar=baz#qux');
  });
});
