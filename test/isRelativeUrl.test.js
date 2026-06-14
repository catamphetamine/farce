// import { describe, it } from 'mocha';
import { expect } from 'chai';

import isRelativeUrl from '../src/isRelativeUrl.js';

describe('isRelativeUrl', () => {
  it('should detect relative URLs', function() {
    expect(isRelativeUrl('/abc/def')).to.equal(true);
    expect(isRelativeUrl('//abc/def')).to.equal(false);
    expect(isRelativeUrl('https://abc/def')).to.equal(false);
  })
})