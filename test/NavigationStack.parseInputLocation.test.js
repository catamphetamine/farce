// import { describe, it } from 'mocha';
import { expect } from 'chai';

import NavigationStack from '../src/NavigationStack.js';
import InMemoryEnvironment from '../src/environment/InMemoryEnvironment.js';

describe('NavigationStack (parseInputLocation)', () => {
  let navigationStack;

  beforeEach(() => {
    navigationStack = new NavigationStack(InMemoryEnvironment);

    // should transform input location of `.init()` method (`string` to `object`)
    navigationStack.init('/foo?bar=baz#qux');

    expect(navigationStack.current()).to.deep.include({
      pathname: '/foo',
      search: '?bar=baz',
      query: {
        bar: 'baz',
      },
      hash: '#qux',
    });
  });

  afterEach(() => {
    navigationStack.stop();
  });

  it('should transform input location of `.push()` method (`string` to `object`)', () => {
    navigationStack.push('/foo?bar=baz#qux');

    expect(navigationStack.current()).to.deep.include({
      pathname: '/foo',
      search: '?bar=baz',
      query: {
        bar: 'baz',
      },
      hash: '#qux',
    });
  });

  it('should transform input location of `.replace()` method (`string` to `object`)', () => {
    navigationStack.replace('/foo?bar=baz#qux');

    expect(navigationStack.current()).to.deep.include({
      pathname: '/foo',
      search: '?bar=baz',
      query: {
        bar: 'baz',
      },
      hash: '#qux',
    });
  });
});
