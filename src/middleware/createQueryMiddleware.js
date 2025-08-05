import createTransformLocationMiddleware from './createTransformLocationMiddleware';

// Creates a "middleware" that parses `location.search` string into `location.query` object.
export default function createQueryMiddleware({ parse, stringify }) {
  return createTransformLocationMiddleware({
    // Transforms input `Location`:
    // sets `search` string value from `query` object,
    // if the `query` object is present.
    transformInputLocation(location) {
      const { query } = location;
      if (query === undefined) {
        return location;
      }

      const queryString = stringify(query);
      const search = queryString ? `?${queryString}` : '';

      return { ...location, search };
    },

    // Transforms environment `Location` object:
    // creates a `query` object from `search` string value.
    transformEnvironmentLocation(location) {
      let query;
      try {
        query = parse(location.search.slice(1));
      } catch (error) {
        query = null;
      }

      return { ...location, query };
    },
  });
}
