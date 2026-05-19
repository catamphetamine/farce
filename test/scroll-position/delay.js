// Runs a `callback` after a few "ticks".
// For example, scroll even listeners might get throttled
// and such delay allows them to run before proceeding with the rest of the test.
export default function delay(callback) {
  // When using Web Test Runner, there's an issue with `requestAnimationFrame()`
  // when it never runs the callback function. It's because in certain headless browser modes
  // (like Puppeteer/Playwright), the browser may throttle or pause `requestAnimationFrame()`
  // callbacks if it determines the page is "backgrounded" or not visible.
  // A suggested workaround is to pass `concurrency: 1` option when running "web test runner".
  // https://github.com/modernweb-dev/web/issues/2520#issuecomment-1783999584
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(callback);
    });
  });
}
