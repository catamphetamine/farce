const ORIGIN_REG_EXP = /^(?:([^:/]+):)?\/\/([^:/]+)(?::([0-9]+))?/;

export default function ensureLocation(location, { origin } = {}) {
  if (!origin) {
    if (typeof window !== 'undefined') {
      origin = window.location.origin;
    }
  }

  let originProps;
  if (origin) {
    // In modern browsers and in Node.js:
    // const url = new URL('/a/b', 'https://www.example.com')
    const [_, protocol, hostname, port] = origin.match(ORIGIN_REG_EXP);
    const host = port !== undefined ? `${hostname}:${port}` : hostname;
    originProps = {
      origin,
      protocol: protocol || '',
      host,
      hostname,
      port: port || '',
    };
  }

  if (typeof location === 'object') {
    // Set default values for fields other than pathname.
    return {
      ...originProps,
      search: '',
      hash: '',
      ...location,
    };
  }

  let remainingPath = location;

  const hashIndex = remainingPath.indexOf('#');
  let hash;
  if (hashIndex !== -1) {
    hash = remainingPath.slice(hashIndex);
    remainingPath = remainingPath.slice(0, hashIndex);
  } else {
    hash = '';
  }

  const searchIndex = remainingPath.indexOf('?');
  let search;
  if (searchIndex !== -1) {
    search = remainingPath.slice(searchIndex);
    remainingPath = remainingPath.slice(0, searchIndex);
  } else {
    search = '';
  }

  return {
    ...originProps,
    pathname: remainingPath,
    search,
    hash,
  };
}
