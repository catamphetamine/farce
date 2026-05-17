/* eslint-disable no-underscore-dangle */

import { PAGE_SCROLLABLE_CONTAINER_KEY } from './constants';
import scheduleNextTick from './scheduleNextTick';

export default class ScrollPositionAutoSaver {
  constructor({
    log,
    scrollPosition,
    scrollPositionSaver,
    getScrollableContainers,
    shouldSaveScrollPosition,
  }) {
    this._log = log;
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
        this.cancelSavePageScrollPosition();
        // Remove scroll listener on the page.
        this.removePageScrollListener();
      } else {
        this.cancelSaveScrollableContainerScrollPosition(
          scrollableContainerKey,
        );
        this.removeScrollableContainerScrollListener(scrollableContainerKey);
      }
    }
  }

  cancelScheduledAutoSave() {
    for (const scrollableContainerKey of Object.keys(
      this._getScrollableContainers(),
    )) {
      if (scrollableContainerKey === PAGE_SCROLLABLE_CONTAINER_KEY) {
        this.cancelSavePageScrollPosition();
      } else {
        this.cancelSaveScrollableContainerScrollPosition(
          scrollableContainerKey,
        );
      }
    }
  }

  cancelSavePageScrollPosition(hasRun) {
    if (this._cancelSavePageScrollPosition) {
      if (!hasRun) {
        this._log.debug(
          'cancel delayed save scroll position',
          PAGE_SCROLLABLE_CONTAINER_KEY,
        );
      }
      this._cancelSavePageScrollPosition();
      this._cancelSavePageScrollPosition = null;
    }
  }

  cancelSaveScrollableContainerScrollPosition(scrollableContainerKey, hasRun) {
    const scrollableContainerEntry =
      this._getScrollableContainers()[scrollableContainerKey];
    if (scrollableContainerEntry.cancelSaveScrollPosition) {
      if (!hasRun) {
        this._log.debug(
          'cancel delayed save scroll position',
          scrollableContainerKey,
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
    const scrollableContainerEntry =
      this._getScrollableContainers()[scrollableContainerKey];
    if (scrollableContainerEntry.removeScrollListener) {
      scrollableContainerEntry.removeScrollListener();
      scrollableContainerEntry.removeScrollListener = null;
    }
  }

  addScrollableContainerScrollListener(scrollableContainerKey) {
    const scrollableContainerEntry =
      this._getScrollableContainers()[scrollableContainerKey];

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
            this._log.debug('scroll detected', scrollableContainerKey);
            scrollableContainerEntry.cancelSaveScrollPosition =
              scheduleNextTick(() => {
                this._log.debug(
                  'auto-save scroll position after scroll',
                  scrollableContainerKey,
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
    this._removePageScrollListener =
      this._scrollPosition.addPageScrollListener(() => {
        this._log.debug('scroll detected', PAGE_SCROLLABLE_CONTAINER_KEY);

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
