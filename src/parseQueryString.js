function splitAtFirstOccurence(string, separator) {
  const separatorIndex = string.indexOf(separator);
  if (separatorIndex === -1) {
    return [string, ''];
  }

  return [
    string.slice(0, separatorIndex),
    string.slice(separatorIndex + separator.length),
  ];
}

function decode(value) {
  // There's a convention that a space character could be encoded
  // either as "%20" or as "+". Both of them are valid.
  // The "+" character is unusally preferred because it results in a more
  // human-readable URL.
  //
  // https://dev.to/lico/understanding-how-spaces-are-encoded-20-with-encodeuri-vs-with-url-2d6c
  // https://developer.mozilla.org/en-US/docs/Glossary/Percent-encoding
  //
  // Those "+" characters don't get transformed to spaces by `decodeURIComponent()` function.
  // This means that they should be transformed to spaces manually.
  //
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/decodeURIComponent#decoding_query_parameters_from_a_url
  //
  value = value.replaceAll('+', ' ');

  // `decodeURIComponent()` could throw an error of class `URIError`.
  //
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/URIError
  //
  // Example: "URIError: malformed URI sequence".
  try {
    return decodeURIComponent(value);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return value;
  }
}

export default function parseQueryString(queryString) {
  // Create an object with no prototype
  const query = Object.create(null);

  // query parameter parsing is described in the specification:
  // https://url.spec.whatwg.org/#urlencoded-parsing
  for (const keyValuePair of queryString.split('&')) {
    if (!keyValuePair) {
      continue;
    }

    let [key, value] = splitAtFirstOccurence(keyValuePair, '=');

    // If `key` is empty, the specification considers this a valid case with `key: null`.
    // But, there seems to be no practical use for a query parameter with `key: null`.
    // So just skip it.
    if (!key) {
      continue;
    }

    key = decode(key);

    // According to the specification, missing `=` should be treated as `value: null`.
    if (value === '') {
      value = null;
    } else {
      value = decode(value);
    }

    // The handling of duplicate URL query parameters is not explicitly defined by a single,
    // universally enforced specification. Hence, we just assume such query parameters invalid
    // and only include the first occurrence of the query parameter in the query string.
    if (query[key] === undefined) {
      query[key] = value;
    }
  }

  return query;
}
