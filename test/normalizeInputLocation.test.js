import normalizeInputLocation from '../src/normalizeInputLocation';

describe('normalizeInputLocation', () => {
  it('should preserve fully-defined location descriptor objects', () => {
    expect(
      normalizeInputLocation({
        pathname: '/foo',
        search: '?bar=baz',
        hash: '#qux',
      }),
    ).to.eql({
      pathname: '/foo',
      search: '?bar=baz',
      hash: '#qux',
    });
  });

  it('should add default search and hash', () => {
    expect(
      normalizeInputLocation({
        pathname: '/new/pathname',
      }),
    ).to.eql({
      pathname: '/new/pathname',
      search: '',
      hash: '',
    });
  });

  it('should parse full path strings', () => {
    expect(normalizeInputLocation('/foo')).to.eql({
      pathname: '/foo',
      search: '',
      hash: '',
    });

    expect(normalizeInputLocation('/foo?bar=baz')).to.eql({
      pathname: '/foo',
      search: '?bar=baz',
      hash: '',
    });

    expect(normalizeInputLocation('/foo#qux')).to.eql({
      pathname: '/foo',
      search: '',
      hash: '#qux',
    });

    expect(normalizeInputLocation('/foo?bar=baz#qux')).to.eql({
      pathname: '/foo',
      search: '?bar=baz',
      hash: '#qux',
    });
  });

  it('should transform `query` object into a `search` string', () => {
    expect(
      normalizeInputLocation({
        pathname: '/foo',
        query: { bar: 'baz' },
        hash: '#qux',
      }),
    ).to.eql({
      pathname: '/foo',
      search: '?bar=baz',
      hash: '#qux',
    });
  });
});
