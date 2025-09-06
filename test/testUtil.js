export function shouldWarn(about) {
  console.warn.expected.push(about); // eslint-disable-line no-console
}
