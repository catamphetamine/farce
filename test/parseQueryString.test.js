import parseQueryString from '../src/parseQueryString';

describe('parseQueryString', () => {
  it('should parse query object from a query string', () => {
    expect(parseQueryString('')).to.deep.equal({});
    expect(parseQueryString('a')).to.deep.equal({ a: null });
    expect(parseQueryString('=a')).to.deep.equal({});
    expect(parseQueryString('a=b')).to.deep.equal({ a: 'b' });
    expect(parseQueryString('a=b&c=d')).to.deep.equal({ a: 'b', c: 'd' });
    expect(parseQueryString('a=b+c%20d')).to.deep.equal({ a: 'b c d' });
    expect(parseQueryString('a=b+c%20d')).to.deep.equal({ a: 'b c d' });
    // Ivalid percent-encoding is ignored.
    expect(parseQueryString('a=b%0&c=d')).to.deep.equal({
      a: 'b%0',
      c: 'd',
    });
  });
});
