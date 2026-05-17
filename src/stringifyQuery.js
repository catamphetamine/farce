// "The more recent RFC3986 reserves !, ', (, ), and *,
// even though these characters have no formalized URI delimiting uses.
//
// https://datatracker.ietf.org/doc/html/rfc3986
//
// The following function encodes a string for RFC3986-compliant URL component format.
// It also encodes [ and ], which are part of the IPv6 URI syntax.
//
// An RFC3986-compliant encodeURI implementation should not escape them,
// which is demonstrated in the encodeURI() example.
//
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent#encoding_for_rfc3986
//
// Can throw a `URIError` if the `string` contains a "lone surrogate".
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String#utf-16_characters_unicode_code_points_and_grapheme_clusters
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/URIError
// Example: "URIError: malformed URI sequence"
//
function encode(string) {
  return encodeURIComponent(string).replace(
    /[!'()*]/g,
    (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

export default function stringifyQuery(query) {
  let queryString = '';

  if (!query) {
    return queryString;
  }

  for (const key of Object.keys(query)) {
    let value = query[key];

    if (Array.isArray(value)) {
      throw new Error('Array values are not supported');
    }

    // Ignore `value: undefined`.
    if (value === undefined) {
      continue;
    }

    // Stringify `value`.
    if (value === null) {
      value = '';
    } else {
      value = String(value);
    }

    // Can throw a `URIError` if the `string` contains a "lone surrogate".
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String#utf-16_characters_unicode_code_points_and_grapheme_clusters
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/URIError
    // Example: "URIError: malformed URI sequence"
    try {
      const keyValuePair = `${encode(key)}${value ? '=' : ''}${encode(value)}`;

      if (queryString.length > 1) {
        queryString += '&';
      }

      queryString += keyValuePair;
    } catch (error) {
      // Simply ignore an invalid query parameter.
      continue;
    }
  }

  return queryString;
}
