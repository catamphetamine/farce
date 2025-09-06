/* eslint-disable no-underscore-dangle */

import { PAGE_SCROLLABLE_CONTAINER_KEY } from './constants';
import scheduleNextTick from './scheduleNextTick';

export default class ScrollPositionAutoSaver {
  constructor({
    scrollPosition,
    scrollPositionSaver,
    getScrollableContainers,
    shouldSaveScrollPosition,
  }) {
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

  cancelSavePageScrollPosition() {
    if (this._cancelSavePageScrollPosition) {
      this._cancelSavePageScrollPosition();
      this._cancelSavePageScrollPosition = null;
    }
  }

  cancelSaveScrollableContainerScrollPosition(scrollableContainerKey) {
    const scrollableContainerEntry =
      this._getScrollableContainers()[scrollableContainerKey];
    if (scrollableContainerEntry.cancelSaveScrollPosition) {
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
            scrollableContainerEntry.cancelSaveScrollPosition =
              scheduleNextTick(() => {
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
