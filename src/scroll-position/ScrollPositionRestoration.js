/* eslint-disable no-underscore-dangle */

import PageScrollPositionSetter from './PageScrollPositionSetter.js';
import ScrollPositionSaver from './ScrollPositionSaver.js';
import ScrollPositionSetter from './ScrollPositionSetter.js';
import { PAGE_SCROLLABLE_CONTAINER_KEY } from './constants.js';
import getLocationUrl from '../getLocationUrl.js';
import LocationDataStorage from '../data-storage/LocationDataStorage.js';

function areEqualScrollPositions(scrollPosition1, scrollPosition2) {
  let i = 0;
  while (i < scrollPosition1.length) {
    if (scrollPosition1[i] !== scrollPosition2[i]) {
      return false;
    }
    i++;
  }
  return true;
}

export default class ScrollPositionRestoration {
  constructor(session, options) {
    this._log = session.environment.log;

    this._scrollPosition = session.environment.scrollPosition;

    // Custom `ScrollPositionSetter`.
    this._scrollPositionSetter = options.scrollPositionSetter;

    this._sessionLifecycle = session.environment.lifecycle;

    this._locationDataStorage = new LocationDataStorage(session, {
      namespace: 'navigation-stack-scroll-position',
    });

    this._scrollPositionSaver = new ScrollPositionSaver({
      log: this._log,
      scrollPosition: this._scrollPosition,
      saveScrollPositionForLocation: this._saveScrollPositionForLocation,
      getScrollableContainers: () => this._scrollableContainers,
      getLocation: () => this._location,
      shouldSaveScrollPosition: () => !this._doNotSaveScrollPosition,
    });

    // Originally, `scrollableContainerKey` was auto-generated,
    // but then it didn't work with the concept of dynamically adding or removing
    // scrollable containers after `ScrollPositionRestoration` has already started.
    //
    // this._scrollableContainerKeyCounter = 0;

    this._scrollableContainers = {};

    // Add page scrollable container.
    this._scrollableContainers[PAGE_SCROLLABLE_CONTAINER_KEY] = {
      scrollableContainer: undefined,

      // Using this option, a developer could theoretically provide their own implementation
      // of setting a scroll position. For example, it could use "smooth" (animated) scrolling, etc.
      // This could be part of the public API if anyone provided a sensible real-world use case for it.
      scrollPositionSetter:
        (options && options._pageScrollPositionSetter) ||
        // eslint-disable-next-line new-cap
        (this._scrollPositionSetter && new this._scrollPositionSetter()) ||
        // A default `ScrollPositionSetter` for a page (sets page scroll position twice with a momentary delay).
        new PageScrollPositionSetter(),

      // This function is only used in tests.
      // There seems to be no use of it in real life, hence it's not public API.
      // It's only used in tests.
      _getSavedScrollPositionOnLocationChange:
        options && options._getSavedPageScrollPositionOnLocationChange,

      // This function is only used in tests.
      // There seems to be no use of it in real life, hence it's not public API.
      // It's only used in tests.
      shouldChangeScrollPositionOnLocationChange:
        options && options.shouldChangePageScrollPositionOnLocationChange,
    };
  }

  addScrollableContainer(
    scrollableContainerKey,
    scrollableContainer,
    options,
  ) {
    // Originally, `scrollableContainerKey` was auto-generated,
    // but then it didn't work with the concept of dynamically adding or removing
    // scrollable containers after `ScrollPositionRestoration` has already started.
    //
    // this._scrollableContainerKeyCounter++;
    // const scrollableContainerKey = String(this._scrollableContainerKeyCounter);

    // Validate `scrollableContainerKey`.
    if (scrollableContainerKey === PAGE_SCROLLABLE_CONTAINER_KEY) {
      throw new Error(
        `Scrollable container key "${scrollableContainerKey}" is not allowed`,
      );
    }

    // Check that it hasn't already been added.
    if (this._scrollableContainers[scrollableContainerKey]) {
      throw new Error(
        `Scrollable container key "${scrollableContainerKey}" is already added`,
      );
    }

    this._log.debug('add scrollable container', '<' + scrollableContainerKey + '>');

    // Add scrollable container entry.
    this._scrollableContainers[scrollableContainerKey] = {
      // Scrollable container element.
      scrollableContainer,

      // Using this option, a developer could theoretically provide their own implementation
      // of setting a scroll position. For example, it could use "smooth" (animated) scrolling, etc.
      // This could be part of the public API if anyone provided a sensible real-world use case for it.
      scrollPositionSetter:
        (options && options._scrollPositionSetter) ||
        (this._scrollPositionSetter && new this._scrollPositionSetter()) ||
        // The default basic "immediate" scroll position setter.
        new ScrollPositionSetter(),

      // This function is only used in tests.
      // There seems to be no use of it in real life, hence it's not public API.
      // It's only used in tests.
      shouldChangeScrollPositionOnLocationChange:
        options && options.shouldChangeScrollPositionOnLocationChange,

      // This function is only used in tests.
      // There seems to be no use of it in real life, hence it's not public API.
      // It's only used in tests.
      _getSavedScrollPositionOnLocationChange:
        options && options._getSavedScrollPositionOnLocationChange,
    };

    // Scrollable containers could be added at any time, including page mount.
    // For example, a user navigates "Back" to a previous page where there's
    // a "unique" scrollable container that's only present on that page.
    // In that case, the previously-saved scroll position inside the scrollable container
    // should be restored, if it pre-exists. Otherwise, if it doesn't pre-exist,
    // the initial scroll position should be saved for the scrollable container.
    if (this._location) {
      const previouslySavedScrollPosition =
        this._getSavedScrollPositionForLocation(
          this._location,
          scrollableContainerKey,
        );
      if (previouslySavedScrollPosition) {
        this._log.debug(
          'set initial scroll position on add scrollable container',
          'at',
          '"' + getLocationUrl(this._location) + '"',
          '<' + scrollableContainerKey + '>',
          previouslySavedScrollPosition,
        );
        this._scrollPosition.setScrollableContainerScrollPosition(
          scrollableContainer,
          previouslySavedScrollPosition,
        );
      } else {
        this._log.debug(
          'save scroll position on add scrollable container',
          'at',
          this._location.pathname,
          '<' + scrollableContainerKey + '>',
        );
        this._scrollPositionSaver.saveScrollableContainerScrollPosition(
          scrollableContainerKey,
          scrollableContainer,
        );
      }
    }

    if (this._started) {
      this._scrollPositionSaver._scrollPositionAutoSaver.addScrollableContainerScrollListener(
        scrollableContainerKey,
      );
    }

    // Removes the scrollable container.
    return () => {
      this._log.debug('remove scrollable container', '<' + scrollableContainerKey + '>');

      this._scrollPositionSaver._scrollPositionAutoSaver.cancelSaveScrollableContainerScrollPosition(
        scrollableContainerKey,
        'SCROLLABLE_CONTAINER_REMOVED',
      );

      this._scrollPositionSaver._scrollPositionAutoSaver.removeScrollableContainerScrollListener(
        scrollableContainerKey,
      );

      delete this._scrollableContainers[scrollableContainerKey];
    };
  }

  start() {
    // "Foolproof" check.
    if (this._started) {
      throw new Error('Already started');
    }

    this._started = true;

    this._disableAutomaticScrollRestoration();

    this._scrollPositionSaver.start();

    this._removePageStatusListener =
      this._sessionLifecycle.addExecutionStatusListener(
        this._sessionExecutionStatusListener,
      );
  }

  // This method is "idempotent", i.e. it can be called multiple times.
  stop() {
    // "Foolproof" check.
    if (!this._started) {
      return;
      // throw new Error('Not started');
    }

    this._started = false;

    this._enableAutomaticScrollRestoration();

    // If there's any scroll position still scheduled to be set, cancel it.
    this._cancelAnyPendingSettingOfScrollPosition();

    this._scrollPositionSaver.stop();

    this._removePageStatusListener();
  }

  _cancelAnyPendingSettingOfScrollPosition() {
    for (const scrollableContainerEntry of Object.values(
      this._scrollableContainers,
    )) {
      scrollableContainerEntry.scrollPositionSetter.cancel();
    }
  }

  // Once configured, scroll restoration mode persists across page reloads.
  // I.e. even if a user refreshes the page in a web browser, the custom
  // `window.history.scrollRestoration` value will still remain.
  //
  // And since it's set to a custom value of "manual", the web browser
  // won't attempt to restore the scroll position on page load
  // which it would otherwise normally do.
  //
  // So what happens if the website is fully server-side rendered?
  // It will wait for the javascript code to be downloaded an executed first
  // and only then that javascript code will programmatically restore the
  // previously-saved scroll position.
  //
  // That would work but it also wouldn't be the most efficient way to do that.
  // Instead, `window.history.scrollRestoration` value could be reset to default beforehand
  // so that when the page finishes refreshing, the web browser could automatically
  // restore the scroll position without waiting for the javascript code to download and run.
  //
  // To reset `window.history.scrollRestoration` value to default beforehand,
  // the code should be notified when the browser tab is about to be terminated or suspended.
  // Terminating could happen for various reasons such as not enough memory, code crash, etc.
  // Suspending is treated equally to terminating because once suspended, it could potentially be
  // terminated afterwards without the code being able to do its stuff while it's suspended.
  //
  // One could consider this feature a minor user experience optimization that relies on the web browser
  // to correctly restore the page scroll every time on page refresh, which it normally does.
  //
  _sessionExecutionStatusListener = ({ running }) => {
    if (running) {
      this._log.debug('▶ running');
      this._disableAutomaticScrollRestoration();
    } else {
      this._log.debug('⏹ not running');
      this._enableAutomaticScrollRestoration();

      // There might be previous scroll position already saved in the data storage.
      // Overwrite that previously-saved scroll position with the most up-to-date one
      // just so that there's no stale scroll position left over in the data storage.
      // Alternatively, it could just clear any saved scroll position for this page,
      // since the web browser's automatic scroll restoration is now enabled
      // and this currently-being-saved scroll position won't be used later anyway.
      this._scrollPositionSaver.saveScrollPosition('STOPPED');
    }
  };

  // willRenderLocation = (location) => {
  //   // "Foolproof" check.
  //   if (!this._started) {
  //     throw new Error('`ScrollPositionRestoration` not started');
  //   }
  //
  //   // For the initial location, it doesn't do anything.
  //   if (location.operation === Operations.INIT) {
  //     return;
  //   }
  //
  //   // Since the current page will no longer be rendered,
  //   // cancel any scheduled setting of scroll position on it.
  //   this._cancelAnyPendingSettingOfScrollPosition();
  //
  //   // The previous page may have scheduled an auto-save of scroll position.
  //   // Since the previous page is no longer rendered, its scroll position can no longer be obtained,
  //   // so any scheduled scroll position auto-save produres are irrelevant now.
  //   this._scrollPositionSaver.cancelPreviouslyScheduledAutoSave('PAGE_NO_LONGER_RENDERED');
  //
  //   // Save the current scroll position on the current page while it's still rendered.
  //   // This saved scroll position could later be restored in case of returing to this page.
  //   // Even if the current scroll position is a default one (scrolled to top), it should still
  //   // be saved in order to overwrite any potential previously-saved non-default scroll position.
  //   this._scrollPositionSaver.saveScrollPosition();
  // };

  // Should be called whenever a different location has been rendered (i.e. immediately after).
  // Returns a Promise that resolves when finished restoring scroll position.
  // There's no need to await for that Promise. It's just there because it exists.
  locationRendered(location) {
    // Validate that `location` has a `key`.
    if (!location.key) {
      throw new Error('`location` must have a `key`');
    }

    this._log.debug(
      'rendered location',
      '"' + getLocationUrl(location) + '"',
    );

    this._prevLocation = this._location;
    this._location = location;

    this._scrollPosition.init();

    if (!this._started) {
      // `this.start()` requires `this._location` to be set.
      this.start();

      // The initial page might've been server-side rendered which means that
      // by the time this javascript code is downloaded and executed by the web browser,
      // the user might've already scrolled the page to some position,
      // and all those pre-javascript scroll events won't be registered by `ScrollPositionSaver`.
      // If the user doesn't scroll after javascript is loaded and just navigates to a new page,
      // the initial page won't have any saved scroll position to restore on "Back" navigation.
      // Hence, it should explicitly save the current scroll position at the start of operation.
      if (!this._isDefaultScrollPosition()) {
        // `this._scrollPositionSaver.saveScrollPosition()` requires `this._location` to be set.
        this._scrollPositionSaver.saveScrollPosition('STARTED_WITH_NON_ZERO_SCROLL_POSITION');
      }
    }

    // The previous page may have scheduled an auto-save of scroll position.
    // Since the previous page is no longer rendered, its scroll position can no longer be obtained,
    // so any scheduled scroll position auto-save produres are irrelevant now.
    this._scrollPositionSaver.cancelPreviouslyScheduledAutoSave('PAGE_NO_LONGER_RENDERED');

    // If it was in the middle of setting scroll position for a previous location, cancel it.
    this._cancelAnyPendingSettingOfScrollPosition();

    // Set the scroll position for the new page:
    // either restore a previously-saved one or set it to a default scroll position.
    return this._setScrollPosition();
  }

  // Tells if the current scroll position is the default one.
  _isDefaultScrollPosition() {
    for (const scrollableContainerKey of Object.keys(
      this._scrollableContainers,
    )) {
      if (scrollableContainerKey === PAGE_SCROLLABLE_CONTAINER_KEY) {
        if (
          !areEqualScrollPositions(
            this._scrollPosition.getPageScrollPosition(),
            this._getDefaultScrollPosition(),
          )
        ) {
          return false;
        }
      } else {
        const scrollableContainerEntry =
          this._scrollableContainers[scrollableContainerKey];
        if (
          !areEqualScrollPositions(
            this._scrollPosition.getScrollableContainerScrollPosition(
              scrollableContainerEntry.scrollableContainer,
            ),
            this._getDefaultScrollPosition(),
          )
        ) {
          return false;
        }
      }
    }

    return true;
  }

  // Restores scroll position.
  // Returns a Promise that resolves when finished setting scroll position.
  // There's no need to await for this Promise. It just exists.
  _setScrollPosition() {
    return Promise.all(
      Object.keys(this._scrollableContainers).map((scrollableContainerKey) => {
        const scrollableContainerEntry =
          this._scrollableContainers[scrollableContainerKey];

        // This function is only used in tests.
        // There seems to be no use of it in real life, hence it's not public API.
        // It's only used in tests.
        if (
          scrollableContainerEntry.shouldChangeScrollPositionOnLocationChange
        ) {
          if (
            !scrollableContainerEntry.shouldChangeScrollPositionOnLocationChange(
              this._prevLocation,
              this._location,
            )
          ) {
            return Promise.resolve();
          }
        }

        // Scroll position (or anchor) to set.
        let scrollPositionOrAnchorToSet;

        // This function is only used in tests.
        // There seems to be no use of it in real life, hence it's not public API.
        // It's only used in tests.
        if (scrollableContainerEntry._getSavedScrollPositionOnLocationChange) {
          scrollPositionOrAnchorToSet =
            scrollableContainerEntry._getSavedScrollPositionOnLocationChange(
              this._prevLocation,
              this._location,
            );
        }

        // Get scroll position (or anchor) to set.
        if (!scrollPositionOrAnchorToSet) {
          scrollPositionOrAnchorToSet =
            scrollableContainerKey === PAGE_SCROLLABLE_CONTAINER_KEY
              ? this._getPageScrollPositionOrAnchorToSet(this._location)
              : this._getScrollableContainerScrollPositionToSet(
                  this._location,
                  scrollableContainerKey,
                );
        }

        this._log.debug(
          'set initial scroll position',
          'at',
          '"' + getLocationUrl(this._location) + '"',
          'in',
          '<' + scrollableContainerKey + '>',
          typeof scrollPositionOrAnchorToSet === 'string'
            ? 'at anchor #' + scrollPositionOrAnchorToSet
            : scrollPositionOrAnchorToSet,
        );

        // Set scroll position of scrollable container.
        return scrollableContainerEntry.scrollPositionSetter.set(
          scrollableContainerEntry.scrollableContainer,
          scrollPositionOrAnchorToSet,
          this._scrollPosition,
        );
      }),
    );
  }

  // Overrides the default `window.history.scrollRestoration` value.
  // This prevents the web browser from interfering by disabling its
  // automatic scroll position restoration on "Back"/"Forward" navigation.
  // Instead, the application will have to do it manually.
  // The reason is that when the web browser performs "Back" or "Forward" navigation,
  // it updates the URL in the address bar immediately, and it also attempts to
  // automatically restore scroll position immediately, but the thing is that
  // the application might have delayed rendering of the page due to various reasons
  // such as performance considerations or the architecture of the rendering framework.
  // For example, React framework by design renders pages in "asynchronous" fashion.
  // Hence, by the time the web browser attempts to restore the scroll position,
  // the page might not yet be rendered which would result in incorrect scroll position restoration.
  // That's why the application has to take over this functionality from the web browser.
  _disableAutomaticScrollRestoration = () => {
    try {
      this._scrollPosition.disableAutomaticScrollRestoration();
    } catch (error) {
      this._log.error(error);
      this._log.error(
        '[navigation-stack] could not disable default scroll restoration mode',
      );
    }
  };

  _enableAutomaticScrollRestoration = () => {
    try {
      this._scrollPosition.enableAutomaticScrollRestoration();
    } catch (error) {
      this._log.error(error);
      this._log.error(
        '[navigation-stack] could not enable default scroll restoration mode',
      );
    }
  };

  _getSavedScrollPositionForLocation(
    location,
    scrollableContainerKey = PAGE_SCROLLABLE_CONTAINER_KEY,
  ) {
    return this._locationDataStorage.get(location, scrollableContainerKey);
  }

  _saveScrollPositionForLocation = (
    location,
    scrollableContainerKey,
    scrollPosition,
  ) => {
    this._locationDataStorage.set(
      location,
      scrollableContainerKey || PAGE_SCROLLABLE_CONTAINER_KEY,
      scrollPosition,
    );
  };

  // Returns scroll position coordinates or an anchor name.
  _getPageScrollPositionOrAnchorToSet(location) {
    // If it's a return to a previously-visited location,
    // read the saved scroll position from session data store.
    return (
      this._getSavedScrollPositionForLocation(location) ||
      this._getAnchor(location) ||
      this._getDefaultScrollPosition()
    );
  }

  // Returns scroll position coordinates.
  _getScrollableContainerScrollPositionToSet(
    location,
    scrollableContainerKey,
  ) {
    // If it's a return to a previously-visited location,
    // read the saved scroll position from session data store.
    return (
      this._getSavedScrollPositionForLocation(
        location,
        scrollableContainerKey,
      ) || this._getDefaultScrollPosition()
    );
  }

  _getAnchor(location) {
    const { hash } = location;
    if (hash && hash !== '#') {
      return hash.slice('#'.length);
    }
    return undefined;
  }

  _getDefaultScrollPosition() {
    return [0, 0];
  }

  // `_enableSavingScrollPosition()` and `_disableSavingScrollPosition()`
  // aren't used in real life and are not part of the public API.
  // They're only used in tests.
  _enableSavingScrollPosition() {
    this._doNotSaveScrollPosition = undefined;
  }

  // `_enableSavingScrollPosition()` and `_disableSavingScrollPosition()`
  // aren't used in real life and are not part of the public API.
  // They're only used in tests.
  _disableSavingScrollPosition() {
    this._doNotSaveScrollPosition = true;
  }
}
