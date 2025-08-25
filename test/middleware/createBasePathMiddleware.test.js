import createBasePathMiddleware from '../../src/middleware/createBasePathMiddleware';
import {
  transformInputLocationUsingMiddleware,
  transformSubscriptionLocationUsingMiddleware,
} from '../helpers';

describe('createBasePathMiddleware', () => {
  [
    ['/foo', 'generic `basePath`'],
    ['/foo/', '`basePath` with a trailing slash'],
  ].forEach(([basePath, title]) => {
    describe(title, () => {
      const basePathMiddleware = createBasePathMiddleware(basePath);

      it('should prepend `basePath` to `location.pathname` on input locations', () => {
        expect(
          transformInputLocationUsingMiddleware(basePathMiddleware, {
            pathname: '/path',
          }),
        ).to.eql({
          pathname: '/foo/path',
        });
      });

      it('should strip `basePath` from `location.pathname` on subscription locations', () => {
        expect(
          transformSubscriptionLocationUsingMiddleware(basePathMiddleware, {
            pathname: '/foo/path',
          }),
        ).to.eql({
          pathname: '/path',
        });
      });

      it('should handle unrecognized paths on subscription locations', () => {
        expect(
          transformSubscriptionLocationUsingMiddleware(basePathMiddleware, {
            pathname: '/bar/path',
          }),
        ).to.eql({
          pathname: '/bar/path',
        });
      });
    });
  });

  describe('No `basePath` specified', () => {
    const basePathMiddleware = createBasePathMiddleware('/');

    it('should not modify `location.pathname` of input locations', () => {
      const location = { pathname: '/path' };
      expect(
        transformInputLocationUsingMiddleware(basePathMiddleware, location),
      ).to.equal(location);
    });

    it('should not modify `location.pathname` of subscription locations', () => {
      const location = { pathname: '/path' };
      expect(
        transformSubscriptionLocationUsingMiddleware(
          basePathMiddleware,
          location,
        ),
      ).to.equal(location);
    });
  });
});
