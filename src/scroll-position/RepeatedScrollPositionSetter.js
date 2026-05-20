/* eslint-disable no-underscore-dangle */

import scheduleNextTick from './scheduleNextTick.js';

// The original author of `scroll-behavior` package wrote (in 2016):
//
// "Updating the window scroll position is really flaky.
//  Just trying to scroll it isn't enough.
//  Instead, try to scroll a few times until it works."
//
// https://github.com/taion/scroll-behavior/commit/ad5f7b9909fd71d330443d27569208ff20b76672
//
// So what this class does is it scrolls two times:
// * First time at the moment of calling the `.set()` method.
// * Second time after a momentary delay.
//
// It's not clear if the original issue is still present or not
// because the original workaround author didn't specify the exact
// steps to reproduce the issue, i.e. what exact browsers did exhibit
// the buggy behavior and in what exact conditions.
//
export default class RepeatedScrollPositionSetter {
  constructor(scrollPositionSetter) {
    this._scrollPositionSetter = scrollPositionSetter;
  }

  _setScrollPositionWithRepeat() {
    // Whether this is a first setting of scroll position
    // or a second (repeated) one.
    const isRepeated = Boolean(this._cancelRepeatOfSetScrollPosition);

    // If this is a "repeated" call,
    // clear the reference to the "cancel repeated call" function
    // because the repeated call has just been made.
    if (isRepeated) {
      this._cancelRepeatOfSetScrollPosition = null;
    }

    // It's not really possible for `this._scrollPositionOrAnchorToSet`
    // to be `null` or `undefined` at this point.
    // Still, this `if` condition acts as a "foolproof" redundant check.
    /* istanbul ignore if: paranoid guard */
    if (!this._scrollPositionOrAnchorToSet) {
      return Promise.resolve();
    }

    // Schedule a "repeated" setting of the same scroll position after a momentry delay.
    return this._scrollPositionSetter.set(this._scrollPositionOrAnchorToSet).then(() => {
      // If this already was a "repeated" call, it ends here.
      if (isRepeated) {
        this._reset();
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
        this._cancelRepeatOfSetScrollPosition = scheduleNextTick(() =>
          resolve(this._setScrollPositionWithRepeat()),
        );
      });
    })
  }

  // Sets scroll position at an anchor or at given coordinates.
  set(
    scrollPositionOrAnchor,
    scrollableContainer,
  ) {
    // If there's a scheduled "repeat" call for setting some previous scroll position
    // then cancel such scheduled "repeat" call because a different scroll position should be set now.
    this.stop();

    this._scrollPositionOrAnchorToSet = scrollPositionOrAnchor;

    return this._setScrollPositionWithRepeat();
  }

  // If there's a scheduled "repeat" call for setting some previous scroll position
  // then this function will cancel such scheduled "repeat" call.
  stop() {
    if (this._cancelRepeatOfSetScrollPosition) {
      this._cancelRepeatOfSetScrollPosition();
      this._cancelRepeatOfSetScrollPosition = undefined;
    }

    this._reset();
  }

  _reset() {
    this._scrollPositionOrAnchorToSet = undefined;
  }
}
