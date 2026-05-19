// import { describe, it } from 'mocha';
import { expect } from 'chai';

import NavigationStack from '../src/NavigationStack.js';
import InMemoryEnvironment from '../src/environment/InMemoryEnvironment.js';

describe('NavigationStack (general)', () => {
  let navigationStack;

  beforeEach(() => {
    navigationStack = new NavigationStack(InMemoryEnvironment);
    navigationStack.init('/initial');
  });

  afterEach(() => {
    navigationStack.stop();
  });

  it('should support `push` and `shift` navigation actions', () => {
    navigationStack.push('/new');
    expect(navigationStack.current()).to.include({
      pathname: '/new',
      index: 1,
    });

    navigationStack.shift(-1);
    expect(navigationStack.current()).to.include({
      pathname: '/initial',
      index: 0,
    });

    navigationStack.shift(+1);
    expect(navigationStack.current()).to.include({
      pathname: '/new',
      index: 1,
    });
  });

  it('should support `replace` navigation action', () => {
    navigationStack.replace('/new');
    expect(navigationStack.current()).to.include({
      pathname: '/new',
      index: 0,
    });
  });
});

describe('NavigationStack (basePath)', () => {
  it('should support `basePath` option', () => {
    const navigationStack = new NavigationStack(InMemoryEnvironment, {
      basePath: '/base',
    });

    // eslint-disable-next-line no-underscore-dangle
    const session = navigationStack._session;

    navigationStack.init('/initial');

    navigationStack.push('/new');

    // eslint-disable-next-line no-underscore-dangle
    expect(session._latestLocation.pathname).to.equal('/base/new');

    expect(navigationStack.current()).to.include({
      pathname: '/new',
      index: 1,
    });

    navigationStack.stop();
  });
});
