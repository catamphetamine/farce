const DEBUG = false;

export default function debug(...args) {
  if (DEBUG) {
    // eslint-disable-next-line no-console
    console.log(...args);
  }
}
