// Simulates `PageLifecycle` events.

let listener;

// eslint-disable-next-line no-unused-vars
export const setPageLifecycleEventListener = (eventType, callback) => {
  listener = callback;
};

export const triggerPageLifecycleEventForStateTransition = (oldState, newState) => {
  if (listener) {
    const event = new Event('statechange');
    event.newState = newState;
    event.oldState = oldState;
    listener(event);
  }
};
