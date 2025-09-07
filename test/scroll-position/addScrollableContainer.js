// Adds a 100x100 scrollable container on the website, with a large amount of content
// inside it (20000x20000 to be specific), making the container scrollable.
export default function addScrollableContainer(app) {
  // Create a scrollable container.
  const container = document.createElement('div');
  container.style.height = '100px';
  container.style.width = '100px';
  container.style.overflow = 'hidden';

  // Put a large amount of content in the container, making it scrollable.
  const element = document.createElement('div');
  element.style.height = '20000px';
  element.style.width = '20000px';
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
