/* eslint-disable no-underscore-dangle */

import { PAGE_SCROLLABLE_CONTAINER_KEY } from './constants.js';
import scheduleNextTick from './scheduleNextTick.js';
import getLocationUrl from '../getLocationUrl.js';

const LOCATION_RENDERED_NOT_CALLED_ERROR_MESSAGE = 'Scroll detected on a rendered page before `.locationRendered()` has ever been called. You\'re using `manageScrollPosition: true` feature, so make sure you call `navigationStack.locationRendered(location)` every time immediately after a different location has been rendered (including the initial location).';

export default class ScrollPositionAutoSaver {
  constructor({
    log,
    getLocation,
    scrollPosition,
    scrollPositionSaver,
    getScrollableContainers,
    shouldSaveScrollPosition,
  }) {
    this._log = log;
    this._getLocation = getLocation;
    this._scrollPosition = scrollPosition;
    this._scrollPositionSaver = scrollPositionSaver;
    this._shouldSaveScrollPosition = shouldSaveScrollPosition;

    this._getScrollableContainers = getScrollableContainers;
  }

  // Starts auto-saving of scroll positions.
  start() {
    // Get scrollable containers.
    const scrollableContainers = this._getScrollableContainers();

    // Set up scroll listeners on scrollable containers.
    for (const scrollableContainerKey of Object.keys(scrollableContainers)) {
      if (scrollableContainerKey === PAGE_SCROLLABLE_CONTAINER_KEY) {
        this.addPageScrollListener();
      } else {
        this.addScrollableContainerScrollListener(scrollableContainerKey);
      }
    }
  }

  // Stops auto-saving of scroll positions.
  stop() {
    // Get scrollable containers.
    const scrollableContainers = this._getScrollableContainers();

    // Remove scroll listeners on scrollable containers.
    for (const scrollableContainerKey of Object.keys(scrollableContainers)) {
      if (scrollableContainerKey === PAGE_SCROLLABLE_CONTAINER_KEY) {
        // If there's any scheduled saving of page scroll position, cancel it.
        this.cancelSavePageScrollPosition('STOPPED');
        // Remove scroll listener on the page.
        this.removePageScrollListener();
      } else {
        this.cancelSaveScrollableContainerScrollPosition(
          scrollableContainerKey,
          'STOPPED',
        );
        this.removeScrollableContainerScrollListener(scrollableContainerKey);
      }
    }
  }

  cancelScheduledAutoSave(reason) {
    for (const scrollableContainerKey of Object.keys(this._getScrollableContainers())) {
      if (scrollableContainerKey === PAGE_SCROLLABLE_CONTAINER_KEY) {
        this.cancelSavePageScrollPosition(reason);
      } else {
        this.cancelSaveScrollableContainerScrollPosition(
          scrollableContainerKey,
          reason,
        );
      }
    }
  }

  cancelSavePageScrollPosition(reason) {
    if (this._cancelSavePageScrollPosition) {
      if (reason !== 'SCROLL_POSITION_SAVED') {
        this._log.debug(
          'cancel delayed save scroll position',
          'at',
          '"' + getLocationUrl(this._getLocation()) + '"',
          'in',
          '<' + PAGE_SCROLLABLE_CONTAINER_KEY + '>',
        );
      }
      this._cancelSavePageScrollPosition();
      this._cancelSavePageScrollPosition = null;
    }
  }

  cancelSaveScrollableContainerScrollPosition(scrollableContainerKey, reason) {
    const scrollableContainerEntry = this._getScrollableContainers()[scrollableContainerKey];
    if (scrollableContainerEntry.cancelSaveScrollPosition) {
      if (reason !== 'SCROLL_POSITION_SAVED') {
        this._log.debug(
          'cancel delayed save scroll position',
          'at',
          '"' + getLocationUrl(this._getLocation()) + '"',
          'in',
          '<' + scrollableContainerKey + '>',
        );
      }
      scrollableContainerEntry.cancelSaveScrollPosition();
      scrollableContainerEntry.cancelSaveScrollPosition = null;
    }
  }

  removePageScrollListener() {
    // Remove scroll listener on the page.
    if (this._removePageScrollListener) {
      this._removePageScrollListener();
      this._removePageScrollListener = null;
    }
  }

  removeScrollableContainerScrollListener(scrollableContainerKey) {
    const scrollableContainerEntry = this._getScrollableContainers()[scrollableContainerKey];
    if (scrollableContainerEntry.removeScrollListener) {
      scrollableContainerEntry.removeScrollListener();
      scrollableContainerEntry.removeScrollListener = null;
    }
  }

  addScrollableContainerScrollListener(scrollableContainerKey) {
    const scrollableContainerEntry = this._getScrollableContainers()[scrollableContainerKey];

    scrollableContainerEntry.removeScrollListener =
      this._scrollPosition.addScrollableContainerScrollListener(
        scrollableContainerEntry.scrollableContainer,
        () => {
          // This flag is not used in real life and is only used in tests (for some reason).
          if (!this._shouldSaveScrollPosition()) {
            return;
          }

          // Use `scheduleNextTick()` function to "throttle" incoming scroll events.
          // There would be no use in reacting to every incoming scroll event
          // because there might be too many in a given short period of time
          // which could affect the performance of the application.
          if (!scrollableContainerEntry.cancelSaveScrollPosition) {
            if (!this._getLocation()) {
              // Apparently, the page is already rendered but `.locationRendered()` hasn't been called yet.
              // This signals that the developer either forgot to call `.locationRendered()` at all
              // or that they call it not immediately after the page has been actually rendered (which is not really correct).
              this._log.error(LOCATION_RENDERED_NOT_CALLED_ERROR_MESSAGE);
              return;
            }

            this._log.debug(
              'scroll detected',
              'at',
              '"' + getLocationUrl(this._getLocation()) + '"',
              'in',
              '<' + scrollableContainerKey + '>',
            );

            scrollableContainerEntry.cancelSaveScrollPosition = scheduleNextTick(() => {
              this._log.debug(
                'auto-save scroll position after scroll',
                'at',
                '"' + getLocationUrl(this._getLocation()) + '"',
                'in',
                '<' + scrollableContainerKey + '>',
              );
              this._scrollPositionSaver.saveScrollableContainerScrollPosition(
                scrollableContainerKey,
                scrollableContainerEntry.scrollableContainer,
              );
            });
          }
        },
      );
  }

  addPageScrollListener() {
    // Set up scroll listener on the page.
    this._removePageScrollListener = this._scrollPosition.addPageScrollListener(() => {
      if (!this._getLocation()) {
        // Apparently, the page is already rendered but `.locationRendered()` hasn't been called yet.
        // This signals that the developer either forgot to call `.locationRendered()` at all
        // or that they call it not immediately after the page has been actually rendered (which is not really correct).
        this._log.error(LOCATION_RENDERED_NOT_CALLED_ERROR_MESSAGE);
        return;
      }

      this._log.debug(
        'scroll detected',
        'at',
        '"' + getLocationUrl(this._getLocation()) + '"',
        'in',
        '<' + PAGE_SCROLLABLE_CONTAINER_KEY + '>',
      );

      // This flag is not used in real life and is only used in tests (for some reason).
      if (!this._shouldSaveScrollPosition()) {
        return;
      }

      // Use `scheduleNextTick()` function to "throttle" incoming scroll events.
      // There would be no use in reacting to every incoming scroll event
      // because there might be too many in a given short period of time
      // which could affect the performance of the application.
      if (!this._cancelSavePageScrollPosition) {
        this._cancelSavePageScrollPosition = scheduleNextTick(() => {
          this._scrollPositionSaver.savePageScrollPosition();
        });
      }
    });
  }
}
