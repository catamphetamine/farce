// import { describe, it } from 'mocha';
import { expect } from 'chai';

import ServerSideRenderEnvironment from '../../src/environment/ServerSideRenderEnvironment.js';
import parseInputLocation from '../../src/parseInputLocation.js';
import Session from '../../src/session/Session.js';

describe('Session (ServerSideRenderEnvironment)', () => {
  it('should parse the initial location', () => {
    const session = new Session(ServerSideRenderEnvironment);

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
    const session = new Session(ServerSideRenderEnvironment);
    // eslint-disable-next-line no-unused-vars
    expect(() => session.subscribe((location) => {})).to.not.throw();
  });
});
