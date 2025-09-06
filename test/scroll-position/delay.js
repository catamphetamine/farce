// Runs a `callback` after a few "ticks".
export default function delay(callback) {
  // Give throttled scroll listeners time to settle down.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(callback);
    });
  });
}
