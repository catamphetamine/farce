/* eslint-disable no-underscore-dangle */

import scheduleNextTick from './scheduleNextTick.js';

// The original author of `scroll-behavior` package wrote:
//
// "Updating the window scroll position is really flaky.
//  Just trying to scroll it isn't enough.
//  Instead, try to scroll a few times until it works."
//
// What it does here is it scrolls two times:
// * First time at the moment of calling the `.set()` method.
// * Second time after a momentary delay.
//
export default class PageScrollPositionSetter {
  // Sets page scroll position either at an "anchor" or at given coordinates.
  _setPageScrollPositionTo(scrollPositionOrAnchor, scrollPositionHelper) {
    if (typeof scrollPositionOrAnchor === 'string') {
      // Scrolls page to an "ahcnor".
      scrollPositionHelper.setPageScrollPositionAtAnchor(
        scrollPositionOrAnchor,
      );
    } else {
      // Scrolls page to given coordinates.
      scrollPositionHelper.setPageScrollPosition(scrollPositionOrAnchor);
    }
  }

  _setPageScrollPosition(scrollPositionHelper) {
    const isDelayedCall = Boolean(this._cancelDelayedSetPageScrollPosition);

    // If this function was triggered in a delayed fashion,
    // clear the reference to the "cancel" function because it's no longer of use.
    if (isDelayedCall) {
      this._cancelDelayedSetPageScrollPosition = null;
    }

    // It's not really possible for `this._pageScrollPositionOrAnchorToSet` to be `null` or `undefined` at this point.
    // Still, this `if` condition acts as a "foolproof" redundant check.
    /* istanbul ignore if: paranoid guard */
    if (!this._pageScrollPositionOrAnchorToSet) {
      return Promise.resolve();
    }

    // if (isDelayedCall) {
    //   console.log(
    //     '(workaround) set page scroll position again after a momentary delay',
    //   );
    // }

    // The original author of `scroll-behavior` package wrote:
    //
    // "Updating the window scroll position is really flaky.
    //  Just trying to scroll it isn't enough.
    //  Instead, try to scroll a few times until it works."
    //
    this._setPageScrollPositionTo(
      this._pageScrollPositionOrAnchorToSet,
      scrollPositionHelper,
    );

    // If it was a delayed call, stop.
    if (isDelayedCall) {
      this._resetScrollPositionOrAnchorToSet();
      return Promise.resolve();
    }

    // Repeat the attempt to set scroll position after a momentary delay.
    // The authors of the original `scroll-behavior` package
    // did this to workaround buggy behavior in browsers
    // when they overwrote the first attempt to set page scroll position
    // with their own forced initial setting of page scroll position.
    // The second setting of page scroll position works around this issue
    // by over-overwriting the page scroll position to the originally intended value.
    // They weren't specific about which exact browsers in which exact circumstances
    // exhibited the described buggy behavior, so it's a bit of a "magical" workaround
    // which isn't removed in future just in case to not "break" any unknown cases.
    return new Promise((resolve) => {
      this._cancelDelayedSetPageScrollPosition = scheduleNextTick(() =>
        resolve(this._setPageScrollPosition(scrollPositionHelper)),
      );
    });
  }

  // Sets scroll position at an anchor or at given coordinates.
  set(
    scrollableContainer,
    pageScrollPositionOrAnchor,
    scrollPositionHelper,
  ) {
    // Prevents empty string anchor.
    if (!pageScrollPositionOrAnchor) {
      throw new Error('Argument is required');
    }

    // Validate that no `scrollableContainer` is passed.
    if (scrollableContainer) {
      throw new Error(
        '`scrollableContainer` argument should not be provided because `PageScrollPositionSetter` was only designed to set scroll position of a page',
      );
    }

    this.cancel();

    this._pageScrollPositionOrAnchorToSet = pageScrollPositionOrAnchor;

    return this._setPageScrollPosition(scrollPositionHelper);
  }

  // This function should be "idempotent", i.e. be able to be called multiple times.
  cancel() {
    if (this._pageScrollPositionOrAnchorToSet) {
      this._resetScrollPositionOrAnchorToSet();

      if (this._cancelDelayedSetPageScrollPosition) {
        this._cancelDelayedSetPageScrollPosition();
        this._cancelDelayedSetPageScrollPosition = undefined;
      }
    }
  }

  _resetScrollPositionOrAnchorToSet() {
    this._pageScrollPositionOrAnchorToSet = undefined;
  }
}
