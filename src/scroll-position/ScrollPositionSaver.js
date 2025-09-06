/* eslint-disable no-underscore-dangle */

import ScrollPositionAutoSaver from './ScrollPositionAutoSaver';
import { PAGE_SCROLLABLE_CONTAINER_KEY } from './constants';

export default class ScrollPositionSaver {
  constructor({
    scrollPosition,
    getLocation,
    saveScrollPositionForLocation,
    getScrollableContainers,
    shouldSaveScrollPosition,
  }) {
    this._scrollPosition = scrollPosition;
    this._getLocation = getLocation;
    this._saveScrollPositionForLocation = saveScrollPositionForLocation;
    this._getScrollableContainers = getScrollableContainers;
    this._shouldSaveScrollPosition = shouldSaveScrollPosition;

    this._scrollPositionAutoSaver = new ScrollPositionAutoSaver({
      scrollPosition: this._scrollPosition,
      scrollPositionSaver: this,
      getScrollableContainers,
      shouldSaveScrollPosition,
    });
  }

  start() {
    this._scrollPositionAutoSaver.start();
  }

  stop() {
    this._scrollPositionAutoSaver.stop();
  }

  cancelPreviouslyScheduledAutoSave() {
    this._scrollPositionAutoSaver.cancelScheduledAutoSave();
  }

  saveScrollPosition() {
    // This flag is not used in real life and is only used in tests (for some reason).
    if (!this._shouldSaveScrollPosition()) {
      return;
    }

    // Get scrollable containers.
    const scrollableContainers = this._getScrollableContainers();

    // Save scroll position of each scrollable container.
    for (const scrollableContainerKey of Object.keys(scrollableContainers)) {
      if (scrollableContainerKey === PAGE_SCROLLABLE_CONTAINER_KEY) {
        this.savePageScrollPosition();
      } else {
        this.saveScrollableContainerScrollPosition(
          scrollableContainerKey,
          scrollableContainers[scrollableContainerKey].scrollableContainer,
        );
      }
    }
  }

  savePageScrollPosition() {
    // * If this is not a scheduled "auto-save" of scroll position
    //   and there already exists any scheduled "auto-save" of scroll position,
    //   cancel it and save scroll position right now instead.
    // * If this is a scheduled "auto-save" of scroll position,
    //   clear the "cancel" function because it's no longer of use.
    this._scrollPositionAutoSaver.cancelSavePageScrollPosition();

    // Save scroll position.
    this._saveScrollPositionForLocation(
      this._getLocation(),
      undefined,
      this._scrollPosition.getPageScrollPosition(),
    );
  }

  saveScrollableContainerScrollPosition(
    scrollableContainerKey,
    scrollableContainer,
  ) {
    // * If this is not a scheduled "auto-save" of scroll position
    //   and there already exists any scheduled "auto-save" of scroll position,
    //   cancel it and save scroll position right now instead.
    // * If this is a scheduled "auto-save" of scroll position,
    //   clear the "cancel" function because it's no longer of use.
    this._scrollPositionAutoSaver.cancelSaveScrollableContainerScrollPosition(
      scrollableContainerKey,
    );

    // Save scroll position.
    this._saveScrollPositionForLocation(
      this._getLocation(),
      scrollableContainerKey,
      this._scrollPosition.getScrollableContainerScrollPosition(
        scrollableContainer,
      ),
    );
  }
}
