import createBasePathMiddleware from '../../src/middleware/createBasePathMiddleware';
import {
  transformEnvironmentLocationUsingMiddleware,
  transformInputLocationUsingMiddleware,
} from '../helpers';

describe('createBasePathMiddleware', () => {
  [
    ['/foo', 'basic usage'],
    ['/foo/', 'trailing slash in basePath'],
  ].forEach(([basePath, title]) => {
    describe(title, () => {
      const basePathMiddleware = createBasePathMiddleware(basePath);

      it('should prepend basePath to location descriptors', () => {
        expect(
          transformInputLocationUsingMiddleware(basePathMiddleware, {
            pathname: '/path',
          }),
        ).to.eql({
          pathname: '/foo/path',
        });
      });

      it('should strip basePath from locations', () => {
        expect(
          transformEnvironmentLocationUsingMiddleware(basePathMiddleware, {
            pathname: '/foo/path',
          }),
        ).to.eql({
          pathname: '/path',
        });
      });

      it('should set unrecognized paths to null', () => {
        expect(
          transformEnvironmentLocationUsingMiddleware(basePathMiddleware, {
            pathname: '/bar/path',
          }),
        ).to.eql({
          pathname: null,
        });
      });
    });
  });

  describe('trivial basePath', () => {
    const basePathMiddleware = createBasePathMiddleware('/');

    it('should not modify location descriptors', () => {
      const location = { pathname: '/path' };
      expect(
        transformInputLocationUsingMiddleware(basePathMiddleware, location),
      ).to.equal(location);
    });

    it('should not modify locations', () => {
      const location = { pathname: '/path' };
      expect(
        transformEnvironmentLocationUsingMiddleware(
          basePathMiddleware,
          location,
        ),
      ).to.equal(location);
    });
  });
});
