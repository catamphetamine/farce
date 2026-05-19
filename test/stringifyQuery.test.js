// import { describe, it } from 'mocha';
import { expect } from 'chai';

import stringifyQuery from '../src/stringifyQuery.js';

describe('stringifyQuery', () => {
  it('stringify', () => {
    expect(stringifyQuery({ foo: 'bar' })).to.equal('foo=bar');
    expect(
      stringifyQuery({
        foo: 'bar',
        bar: 'baz',
      }),
    ).to.equal('foo=bar&bar=baz');
  });

  it('different types', () => {
    expect(stringifyQuery({})).to.equal('');
  });

  it('primitive types', () => {
    expect(stringifyQuery({ a: 'string' })).to.equal('a=string');
    expect(stringifyQuery({ a: true, b: false })).to.equal('a=true&b=false');
    expect(stringifyQuery({ a: 0, b: 1n })).to.equal('a=0&b=1');
    expect(stringifyQuery({ a: null, b: undefined })).to.equal('a');
  });

  it('URI encode', () => {
    expect(stringifyQuery({ 'foo bar': 'baz faz' })).to.equal(
      'foo%20bar=baz%20faz',
    );
    expect(stringifyQuery({ 'foo bar': "baz'faz" })).to.equal(
      'foo%20bar=baz%27faz',
    );
  });

  it('handle array value', () => {
    expect(() => {
      stringifyQuery({
        abc: 'abc',
        foo: ['bar', 'baz'],
      });
    }).to.throw('Array values are not supported');
  });

  it('should not encode undefined values', () => {
    expect(
      stringifyQuery({
        abc: undefined,
        foo: 'baz',
      }),
    ).to.equal('foo=baz');
  });

  it('should encode null values as just a key', () => {
    expect(
      stringifyQuery({
        'x y z': null,
        'abc': null,
        'foo': 'baz',
      }),
    ).to.equal('x%20y%20z&abc&foo=baz');
  });

  it('encoding', () => {
    expect(stringifyQuery({ foo: "'bar'" })).to.equal('foo=%27bar%27');
  });
});
