export default class ScrollPositionSetter {
  set(scrollableContainer, scrollPositionOrAnchor, scrollPositionHelper) {
    if (typeof scrollPositionOrAnchor === 'string') {
      throw new Error(
        '`ScrollPositionSetter` only allows setting numeric scroll position, not an anchor string',
      );
    }
    scrollPositionHelper.setScrollableContainerScrollPosition(
      scrollableContainer,
      scrollPositionOrAnchor,
    );
    return Promise.resolve();
  }

  cancel() {}
}
