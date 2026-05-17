import NavigationStack from '../src/NavigationStack';
import InMemoryEnvironment from '../src/environment/InMemoryEnvironment';

describe('NavigationStack (addBasePath)', () => {
  it('should add `basePath` to `location.pathname`', () => {
    const navigationStack = new NavigationStack(InMemoryEnvironment, {
      basePath: '/base',
    });
    navigationStack.init('/path');
    // eslint-disable-next-line no-underscore-dangle
    expect(navigationStack._session._subscription._latest.pathname).to.equal(
      '/base/path',
    );
    navigationStack.stop();
  });

  it('should add `basePath` (with a trailing slash) to `location.pathname`', () => {
    const navigationStack = new NavigationStack(InMemoryEnvironment, {
      basePath: '/base/',
    });
    navigationStack.init('/path');
    // eslint-disable-next-line no-underscore-dangle
    expect(navigationStack._session._subscription._latest.pathname).to.equal(
      '/base/path',
    );
    navigationStack.stop();
  });

  it('should not modify `location.pathname` when no `basePath` was specified', () => {
    const navigationStack = new NavigationStack(InMemoryEnvironment);
    navigationStack.init('/path');
    // eslint-disable-next-line no-underscore-dangle
    expect(navigationStack._session._subscription._latest.pathname).to.equal(
      '/path',
    );
    navigationStack.stop();
  });

  it('should not modify `location.pathname` when `basePath: "/"` was specified', () => {
    const navigationStack = new NavigationStack(InMemoryEnvironment, {
      basePath: '/',
    });
    navigationStack.init('/path');
    // eslint-disable-next-line no-underscore-dangle
    expect(navigationStack._session._subscription._latest.pathname).to.equal(
      '/path',
    );
    navigationStack.stop();
  });
});
