import NavigationStack from '../src/NavigationStack';
import InMemoryEnvironment from '../src/environment/InMemoryEnvironment';
import parseInputLocation from '../src/parseInputLocation';

describe('NavigationStack (removeBasePath)', () => {
  it('should strip `basePath` from `location.pathname`', () => {
    const navigationStack = new NavigationStack(InMemoryEnvironment, {
      basePath: '/base',
    });
    // eslint-disable-next-line no-underscore-dangle
    const session = navigationStack._session;
    session.start(parseInputLocation('/base/path'));
    expect(navigationStack.current().pathname).to.equal('/path');
    navigationStack.stop();
  });

  it('should strip `basePath` (with a trailing slash) from `location.pathname`', () => {
    const navigationStack = new NavigationStack(InMemoryEnvironment, {
      basePath: '/base/',
    });
    // eslint-disable-next-line no-underscore-dangle
    const session = navigationStack._session;
    session.start(parseInputLocation('/base/path'));
    expect(navigationStack.current().pathname).to.equal('/path');
    navigationStack.stop();
  });

  it('should not strip `basePath` from `location.pathname` when it does not contain the `basePath`', () => {
    const navigationStack = new NavigationStack(InMemoryEnvironment, {
      basePath: '/base',
    });
    // eslint-disable-next-line no-underscore-dangle
    const session = navigationStack._session;
    session.start(parseInputLocation('/path'));
    expect(navigationStack.current().pathname).to.equal('/path');
    navigationStack.stop();
  });

  it('should not strip `basePath` (with a trailing slash) from `location.pathname` when it does not contain the `basePath`', () => {
    const navigationStack = new NavigationStack(InMemoryEnvironment, {
      basePath: '/base/',
    });
    // eslint-disable-next-line no-underscore-dangle
    const session = navigationStack._session;
    session.start(parseInputLocation('/path'));
    expect(navigationStack.current().pathname).to.equal('/path');
    navigationStack.stop();
  });

  it('should not modify `location.pathname` when no `basePath` was specified', () => {
    const navigationStack = new NavigationStack(InMemoryEnvironment);
    // eslint-disable-next-line no-underscore-dangle
    const session = navigationStack._session;
    session.start(parseInputLocation('/path'));
    expect(navigationStack.current().pathname).to.equal('/path');
    navigationStack.stop();
  });

  it('should not modify `location.pathname` when `basePath: "/"` was specified', () => {
    const navigationStack = new NavigationStack(InMemoryEnvironment, {
      basePath: '/',
    });
    // eslint-disable-next-line no-underscore-dangle
    const session = navigationStack._session;
    session.start(parseInputLocation('/path'));
    expect(navigationStack.current().pathname).to.equal('/path');
    navigationStack.stop();
  });
});
