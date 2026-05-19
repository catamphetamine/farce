// import { describe, it } from 'mocha';
import { expect } from 'chai';

import parseQueryFromSearch from '../src/parseQueryFromSearch.js';

describe('parseQueryFromSearch', () => {
  it('should parse query object from `location.search', () => {
    expect(parseQueryFromSearch('')).to.deep.equal({});
    expect(parseQueryFromSearch('?')).to.deep.equal({});
    expect(parseQueryFromSearch('?a')).to.deep.equal({ a: null });
    expect(parseQueryFromSearch('?=a')).to.deep.equal({});
    expect(parseQueryFromSearch('?a=b')).to.deep.equal({ a: 'b' });
    expect(parseQueryFromSearch('?a=b&c=d')).to.deep.equal({ a: 'b', c: 'd' });
    expect(parseQueryFromSearch('?a=b+c%20d')).to.deep.equal({ a: 'b c d' });
    expect(parseQueryFromSearch('?a=b+c%20d')).to.deep.equal({ a: 'b c d' });
    // Ivalid percent-encoding is ignored.
    expect(parseQueryFromSearch('?a=b%0&c=d')).to.deep.equal({
      a: 'b%0',
      c: 'd',
    });
  });
});
