const DEBUG_ENABLED = false;

export default class InMemoryLog {
  debug(...args) {
    if (DEBUG_ENABLED) {
      // eslint-disable-next-line no-console
      console.log(...args);
    }
  }

  warn(...args) {
    // eslint-disable-next-line no-console
    console.warn(...args);
  }

  error(...args) {
    // eslint-disable-next-line no-console
    console.error(...args);
  }
}
