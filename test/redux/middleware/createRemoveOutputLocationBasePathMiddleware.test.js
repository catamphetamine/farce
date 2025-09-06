import createRemoveOutputLocationBasePathMiddleware from '../../../src/redux/middleware/createRemoveOutputLocationBasePathMiddleware';
import { transformOutputLocationUsingMiddleware } from '../../middlewareTestUtil';

describe('createRemoveOutputLocationBasePathMiddleware', () => {
  [
    ['/base', 'generic `basePath`'],
    ['/base/', '`basePath` with a trailing slash'],
  ].forEach(([basePath, title]) => {
    describe(title, () => {
      const removeOutputLocationBasePathMiddleware =
        createRemoveOutputLocationBasePathMiddleware(basePath);

      it('should strip `basePath` from `location.pathname` on subscription locations', () => {
        expect(
          transformOutputLocationUsingMiddleware(
            removeOutputLocationBasePathMiddleware,
            { pathname: '/base/path' },
          ),
        ).to.eql({
          pathname: '/path',
        });
      });

      it('should handle unrecognized paths on subscription locations', () => {
        expect(
          transformOutputLocationUsingMiddleware(
            removeOutputLocationBasePathMiddleware,
            { pathname: '/path' },
          ),
        ).to.eql({
          pathname: '/path',
        });
      });
    });
  });

  describe('No `basePath` specified', () => {
    const removeOutputLocationBasePathMiddleware =
      createRemoveOutputLocationBasePathMiddleware('/');

    it('should not modify `location.pathname` of subscription locations', () => {
      const location = { pathname: '/path' };
      expect(
        transformOutputLocationUsingMiddleware(
          removeOutputLocationBasePathMiddleware,
          location,
        ),
      ).to.equal(location);
    });
  });
});
