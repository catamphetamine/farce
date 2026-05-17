import parseInputLocation from '../src/parseInputLocation';

describe('parseInputLocation', () => {
  it('should create `query` from `search`', () => {
    expect(
      parseInputLocation({
        pathname: '/foo',
        search: '?bar=baz',
        hash: '#qux',
      }),
    ).to.eql({
      pathname: '/foo',
      search: '?bar=baz',
      query: {
        bar: 'baz',
      },
      hash: '#qux',
    });
  });

  it('should add default `search` and `hash`', () => {
    expect(
      parseInputLocation({
        pathname: '/new/pathname',
      }),
    ).to.eql({
      pathname: '/new/pathname',
      search: '',
      query: {},
      hash: '',
    });
  });

  it('should parse location URL', () => {
    expect(parseInputLocation('/foo')).to.eql({
      pathname: '/foo',
      search: '',
      query: {},
      hash: '',
    });

    expect(parseInputLocation('/foo?bar=baz')).to.eql({
      pathname: '/foo',
      search: '?bar=baz',
      query: {
        bar: 'baz',
      },
      hash: '',
    });

    expect(parseInputLocation('/foo#qux')).to.eql({
      pathname: '/foo',
      search: '',
      query: {},
      hash: '#qux',
    });

    expect(parseInputLocation('/foo?bar=baz#qux')).to.eql({
      pathname: '/foo',
      search: '?bar=baz',
      query: {
        bar: 'baz',
      },
      hash: '#qux',
    });
  });

  it('should create `search` from `query` when `search` is not present', () => {
    expect(
      parseInputLocation({
        pathname: '/foo',
        query: { bar: 'baz' },
        hash: '#qux',
      }),
    ).to.eql({
      pathname: '/foo',
      search: '?bar=baz',
      query: {
        bar: 'baz',
      },
      hash: '#qux',
    });
  });
});
