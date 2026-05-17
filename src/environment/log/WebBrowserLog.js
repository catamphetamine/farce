export default class WebBrowserLog {
  debug(...args) {
    if (window.NAVIGATION_STACK_DEBUG_ENABLED) {
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
