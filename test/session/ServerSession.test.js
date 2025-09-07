import parseInputLocation from '../../src/parseInputLocation';
import ServerSideRenderSession from '../../src/session/ServerSideRenderSession';

describe('ServerSideRenderSession', () => {
  it('should parse the initial location', () => {
    const session = new ServerSideRenderSession();

    let location;
    session.subscribe((newLocation) => {
      location = newLocation;
    });

    session.start(parseInputLocation('/foo?bar=baz#qux'));

    expect(location).to.deep.include({
      operation: 'init',
      pathname: '/foo',
      search: '?bar=baz',
      query: {
        bar: 'baz',
      },
      hash: '#qux',
    });
  });

  it('should support subscriptions', () => {
    const session = new ServerSideRenderSession();
    // eslint-disable-next-line no-unused-vars
    expect(() => session.subscribe((location) => {})).to.not.throw();
  });
});
