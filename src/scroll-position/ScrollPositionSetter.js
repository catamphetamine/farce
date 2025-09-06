export default class ScrollPositionSetter {
  set(scrollableContainer, scrollPositionOrAnchor, environmentScrollPosition) {
    if (typeof scrollPositionOrAnchor === 'string') {
      throw new Error(
        '`ScrollPositionSetter` only allows setting numeric scroll position, not an anchor string',
      );
    }
    environmentScrollPosition.setScrollableContainerScrollPosition(
      scrollableContainer,
      scrollPositionOrAnchor,
    );
    return Promise.resolve();
  }

  cancel() {}
}
