import createAddInputLocationBasePathMiddleware from '../../../src/redux/middleware/createAddInputLocationBasePathMiddleware';
import { transformInputLocationUsingMiddleware } from '../../middlewareTestUtil';

describe('createAddInputLocationBasePathMiddleware', () => {
  [
    ['/base', 'generic `basePath`'],
    ['/base/', '`basePath` with a trailing slash'],
  ].forEach(([basePath, title]) => {
    describe(title, () => {
      const addInputLocationBasePathMiddleware =
        createAddInputLocationBasePathMiddleware(basePath);

      it('should prepend `basePath` to `location.pathname` on input locations', () => {
        expect(
          transformInputLocationUsingMiddleware(
            addInputLocationBasePathMiddleware,
            { pathname: '/path' },
          ),
        ).to.eql({
          pathname: '/base/path',
        });
      });
    });
  });

  describe('No `basePath` specified', () => {
    const addInputLocationBasePathMiddleware =
      createAddInputLocationBasePathMiddleware('/');

    it('should not modify `location.pathname` of input locations', () => {
      const location = { pathname: '/path' };
      expect(
        transformInputLocationUsingMiddleware(
          addInputLocationBasePathMiddleware,
          location,
        ),
      ).to.equal(location);
    });
  });
});
