// Adds a 100x100 scrollable container on the website.
//
// * When the current location is "/", it renders a large amount of content
//   (20000x20000 to be specific) inside the container, making it scrollable.
//
// * At any other location, it doesn't render anything in the container.
//
export default function withScrollableContainerAtIndexPage(app) {
  const container = document.createElement('div');
  container.style.height = '100px';
  container.style.width = '100px';
  container.style.overflow = 'hidden';
  document.body.appendChild(container);

  let element;
  let unregister;

  // This will only be called once, so no need to guard.
  function listen(listener) {
    function shouldUpdatePageScrollPositionForLocation(
      location,
      prevLocation,
    ) {
      // Disable the automatic scroll restoration after a SHIFT, to check the
      // scroll-on-register behavior.
      if (prevLocation && location.operation === 'SHIFT') {
        return false;
      }

      return true;
    }

    const unlisten = app.listen((location) => {
      listener(location);

      if (location.pathname === '/') {
        element = document.createElement('div');
        element.style.height = '20000px';
        element.style.width = '20000px';
        container.appendChild(element);

        unregister = app.registerScrollableContainer('container', container, {
          shouldUpdatePageScrollPositionForLocation,
        });
      } else {
        container.removeChild(element);
        unregister();
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
