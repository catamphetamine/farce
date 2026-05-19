// Adds a 100x100 scrollable container on the website.
//
// * When the current location is "/", it renders a large amount of content
//   (20000x20000 to be specific) inside the container, making it scrollable.
//
// * At any other location, it doesn't render anything in the container.
//
export default function withScrollableContainerAtIndexPageWithDisabledAutomaticScrollPositionRestoration(
  app,
) {
  const containerWidth = 100;
  const containerHeight = 100;

  const contentWidth = 20000;
  const contentHeight = 20000;

  const container = document.createElement('div');
  container.style.width = containerWidth + 'px';
  container.style.height = containerHeight + 'px';
  container.style.overflow = 'hidden';
  document.body.appendChild(container);

  let scrollableContainerContentElement;
  let unregisterScrollableContainer;

  function listen(listener) {
    function shouldChangeScrollableContainerScrollPositionOnLocationChange(
      prevLocation,
      location,
    ) {
      // Disable the automatic scroll position restoration on "back" navigation
      // to check that it automatically restores scroll position when calling
      // `ScrollPositionRestoration.addScrollableContainer()` method.
      if (prevLocation && location.index < prevLocation.index) {
        return false;
      }
      return true;
    }

    app.whenRenderedLocation((location) => {
      if (location.pathname === '/') {
        unregisterScrollableContainer = app.registerScrollableContainer(
          'container',
          container,
          {
            shouldChangeScrollPositionOnLocationChange:
              shouldChangeScrollableContainerScrollPositionOnLocationChange,
          },
        );
      }
    });

    const unlisten = app.listen((location) => {
      listener(location);

      if (location.pathname === '/') {
        scrollableContainerContentElement = document.createElement('div');
        scrollableContainerContentElement.style.width = contentWidth + 'px';
        scrollableContainerContentElement.style.height = contentHeight + 'px';
        container.appendChild(scrollableContainerContentElement);
      } else {
        unregisterScrollableContainer();
        container.removeChild(scrollableContainerContentElement);
      }
    });

    return () => {
      unlisten();
      document.body.removeChild(container);
    };
  }

  return {
    ...app,
    container,
    listen,
  };
}
