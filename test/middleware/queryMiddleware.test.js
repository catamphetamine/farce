import queryMiddleware from '../../src/middleware/queryMiddleware';
import {
  transformEnvironmentLocationUsingMiddleware,
  transformInputLocationUsingMiddleware,
} from '../helpers';

describe('queryMiddleware', () => {
  describe('transformInputLocation', () => {
    it('should create a search string', () => {
      expect(
        transformInputLocationUsingMiddleware(queryMiddleware, {
          pathname: '/path',
          query: {
            foo: 'bar',
          },
        }),
      ).to.include({
        pathname: '/path',
        search: '?foo=bar',
      });
    });

    it('should not modify the search string without a query', () => {
      expect(
        transformInputLocationUsingMiddleware(queryMiddleware, {
          pathname: '/path',
          search: '?foo',
        }),
      ).to.include({
        pathname: '/path',
        search: '?foo',
      });
    });

    it('should replace the existing search string', () => {
      expect(
        transformInputLocationUsingMiddleware(queryMiddleware, {
          pathname: '/path',
          query: {
            foo: 'bar',
          },
          search: '?baz',
        }),
      ).to.include({
        pathname: '/path',
        search: '?foo=bar',
      });
    });

    it('should create empty search for empty query', () => {
      expect(
        transformInputLocationUsingMiddleware(queryMiddleware, {
          pathname: '/path',
          query: {},
        }),
      ).to.include({
        pathname: '/path',
        search: '',
      });
    });
  });

  describe('transformEnvironmentLocation', () => {
    it('should create a search string', () => {
      expect(
        transformEnvironmentLocationUsingMiddleware(queryMiddleware, {
          pathname: '/path',
          search: '?foo=bar',
        }),
      ).to.deep.include({
        pathname: '/path',
        query: {
          foo: 'bar',
        },
      });
    });

    it('should overwrite any pre-supplied query', () => {
      expect(
        transformEnvironmentLocationUsingMiddleware(queryMiddleware, {
          pathname: '/path',
          query: {
            foo: 'bar',
            baz: undefined,
          },
          search: '?foo=bar',
        }),
      ).to.deep.include({
        pathname: '/path',
        query: {
          foo: 'bar',
          // baz: undefined,
        },
      });
    });

    it('should handle malformed search strings', () => {
      expect(
        transformEnvironmentLocationUsingMiddleware(queryMiddleware, {
          pathname: '/path',
          search: '?%%7C',
        }),
      ).to.deep.include({
        pathname: '/path',
        query: {
          '%|': null,
        },
      });
    });

    it('should handle broken search strings', () => {
      expect(
        transformEnvironmentLocationUsingMiddleware(queryMiddleware, {
          pathname: '/path',
          search: null,
        }),
      ).to.include({
        pathname: '/path',
        query: null,
      });
    });
  });
});
