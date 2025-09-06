export default function scheduleNextTick(func) {
  const timerId = window.requestAnimationFrame(func);
  return () => {
    cancelAnimationFrame(timerId);
  };
}
