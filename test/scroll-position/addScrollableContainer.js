// Adds a 100x100 scrollable container on the website, with a large amount of content
// inside it (20000x20000 to be specific), making the container scrollable.
export default function addScrollableContainer(app) {
  const containerWidth = 100;
  const containerHeight = 100;

  const contentWidth = 20000;
  const contentHeight = 20000;

  // Create a scrollable container.
  const container = document.createElement('div');
  container.style.width = containerWidth + 'px';
  container.style.height = containerHeight + 'px';
  container.style.overflow = 'hidden';

  // Put a large amount of content in the container, making it scrollable.
  const element = document.createElement('div');
  element.style.width = contentWidth + 'px';
  element.style.height = contentHeight + 'px';
  container.appendChild(element);

  // Add the scrollable container to the website.
  document.body.appendChild(container);

  function listen(listener) {
    const unlisten = app.listen(listener);

    const unregisterScrollableContainer = app.registerScrollableContainer(
      'container',
      container,
    );

    return () => {
      unlisten();
      unregisterScrollableContainer();
      document.body.removeChild(container);
    };
  }

  return {
    ...app,
    container,
    listen,
  };
}
