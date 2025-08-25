/* eslint-disable no-underscore-dangle */

export function getBeforeLocationChangeListeners(session) {
  return session._beforeLocationChangeListenersList || [];
}

function addBeforeLocationChangeListenerToTheList(listener, session) {
  if (!session._beforeLocationChangeListenersList) {
    session._beforeLocationChangeListenersList = [];
  }
  session._beforeLocationChangeListenersList.push(listener);
}

function removeBeforeLocationChangeListenerFromTheList(listener, session) {
  if (session._beforeLocationChangeListenersList) {
    session._beforeLocationChangeListenersList =
      session._beforeLocationChangeListenersList.filter((_) => _ !== listener);
  }
}

export function removeAllBeforeLocationChangeListeners(session) {
  session._beforeLocationChangeListenersList = [];
}

// Runs the `listener` while ignoring any errors that might be thrown by it.
function runBeforeLocationChangeListener(listener, location) {
  try {
    listener(location);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(
      `Ignoring before location change listener \`${listener.name}\` that failed with \`${error}\`.`,
    );
    // eslint-disable-next-line no-console
    console.error(error);
  }
}

// Runs all listeners in order.
export function runBeforeLocationChangeListeners(
  navigationListeners,
  toLocation,
) {
  for (const listener of navigationListeners) {
    runBeforeLocationChangeListener(listener, toLocation);
  }
}

export function addBeforeLocationChangeListener(session, listener) {
  addBeforeLocationChangeListenerToTheList(listener, session);
  return () => {
    removeBeforeLocationChangeListenerFromTheList(listener, session);
  };
}
