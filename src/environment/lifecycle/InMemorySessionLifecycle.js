export default class InMemorySessionLifecycle {
  // Termination blockers of an "in-memory session" are currently ignored.
  // eslint-disable-next-line no-unused-vars
  addTerminationBlocker(blocker) {
    return () => {};
  }

  // An "in-memory session" execution status is always `running: true`.
  // eslint-disable-next-line no-unused-vars
  addExecutionStatusListener(listener) {
    return () => {};
  }
}
