// Simulates `PageLifecycle` events.

let listener;

// eslint-disable-next-line no-unused-vars
export const setEventListener = (eventType, callback) => {
  listener = callback;
};

export const triggerEvent = (oldState, newState) => {
  if (listener) {
    const event = new Event('statechange');
    event.newState = newState;
    event.oldState = oldState;
    listener(event);
  }
};
