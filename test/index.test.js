import * as exports from '../src';

describe('index', () => {
  it('should export top level correctly', () => {
    expect(exports.addBasePath).to.exist();
    expect(exports.removeBasePath).to.exist();
    expect(exports.getLocationUrl).to.exist();
    expect(exports.parseLocationUrl).to.exist();
    expect(exports.addNavigationBlocker).to.exist();
    expect(exports.getLocationUrl).to.exist();
    expect(exports.parseLocationUrl).to.exist();
    expect(exports.parseInputLocation).to.exist();
    expect(exports.NavigationStack).to.exist();
    expect(exports.InMemoryEnvironment).to.exist();
    expect(exports.WebBrowserEnvironment).to.exist();
    expect(exports.ServerSideRenderEnvironment).to.exist();
    expect(exports.ServerSideRedirectError).to.exist();
    expect(exports.NavigationOutOfBoundsError).to.exist();
  });
});
