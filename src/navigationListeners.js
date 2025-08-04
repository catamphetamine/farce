let listenerEntriesList = [];

function addBeforeUnloadListener(onBeforeUnloadListener) {
  window.addEventListener('beforeunload', onBeforeUnloadListener);
}

export function removeBeforeUnloadListener(onBeforeUnloadListener) {
  window.removeEventListener('beforeunload', onBeforeUnloadListener);
}

export function getNavigationListenerEntries() {
  return listenerEntriesList;
}

function addNavigationListenerEntry(listenerEntry) {
  listenerEntriesList.push(listenerEntry);
}

function removeNavigationListenerEntry(listenerEntry) {
  listenerEntriesList = listenerEntriesList.filter(
    (item) => item !== listenerEntry,
  );
}

export function removeAllNavigationListenerEntries() {
  listenerEntriesList = [];
}

export function runListenerEntry({ listener }, location, callback) {
  let result;
  try {
    result = listener(location);
  } catch (e) {
    if (__DEV__)
      // eslint-disable-next-line no-console
      console.warn(
        `Ignoring navigation listener \`${listener.name}\` that failed with \`${e}\`.`,
      );

    result = null;
  }

  if (typeof result === 'object' && result && result.then) {
    result
      .catch((e) => {
        if (__DEV__)
          // eslint-disable-next-line no-console
          console.warn(
            `Ignoring navigation listener \`${listener.name}\` that failed with \`${e}\`.`,
          );

        return null;
      })
      .then(callback);

    return undefined;
  }

  return callback(result);
}

export function runListenerEntries(listenerEntries, location, callback) {
  if (!listenerEntries.length) {
    return callback(true);
  }

  return runListenerEntry(listenerEntries[0], location, (result) =>
    result != null
      ? callback(result)
      : runListenerEntries(listenerEntries.slice(1), location, callback),
  );
}

/* istanbul ignore next: not testable with Karma */
export function onBeforeUnload(event) {
  const syncResult = runListenerEntries(
    getNavigationListenerEntries(),
    null,
    (result) => result,
  );

  if (syncResult === true || syncResult === undefined) {
    // An asynchronous navigation listener usually means there will be a
    //  custom confirm dialog. However, we'll already be showing the before
    //  unload dialog, and there's no way to prevent the custom dialog from
    //  showing. This is really an error condition in the navigation
    //  listener, but this is the most reasonable thing we can do.
    return undefined;
  }

  const resultSafe = syncResult || '';

  event.preventDefault();
  event.returnValue = resultSafe; // eslint-disable-line no-param-reassign
  return resultSafe;
}

export function addNavigationListener(
  listener,
  { beforeUnload = false } = {},
) {
  // Add the beforeunload event listener only as needed, as its presence
  //  prevents the page from being added to the page navigation cache.
  if (
    beforeUnload &&
    getNavigationListenerEntries().every((item) => !item.beforeUnload)
  ) {
    addBeforeUnloadListener(onBeforeUnload);
  }

  const listenerEntry = { listener, beforeUnload };
  addNavigationListenerEntry(listenerEntry);

  return () => {
    removeNavigationListenerEntry(listenerEntry);

    if (
      beforeUnload &&
      getNavigationListenerEntries().every((item) => !item.beforeUnload)
    ) {
      removeBeforeUnloadListener(onBeforeUnload);
    }
  };
}
