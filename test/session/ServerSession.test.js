import ServerSession from '../../src/session/ServerSession';

describe('ServerSession', () => {
  it('should parse the initial location', () => {
    const session = new ServerSession('/foo?bar=baz#qux');

    expect(session.navigation.init()).to.deep.include({
      action: 'INIT',
      pathname: '/foo',
      search: '?bar=baz',
      query: {
        bar: 'baz',
      },
      hash: '#qux',
    });
  });

  it('should have dummy support for subscriptions', () => {
    const session = new ServerSession('/foo?bar=baz#qux');
    const unsubscribe = session.navigation.subscribe();
    expect(unsubscribe).to.not.throw();
  });
});
