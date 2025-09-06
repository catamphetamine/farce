// Creates a scrollable container on the website.
//
// Puts a couple of child elements inside it:
// * One is just a simple child element, 100px in height.
// * Another is a clickable hyperlink to an unspecified location, 100px in height.
//
// * When the current location is "/", the scrollable container size is 20000x20000.
// * At any other location, the scrollable container size is 10000x10000.
//
export default function withRoutes(app) {
  const container = document.createElement('div');
  document.body.appendChild(container);

  const child1 = document.createElement('div');
  child1.id = 'child1';
  child1.style.height = '100px';
  container.appendChild(child1);

  const child2 = document.createElement('a');
  child2.id = 'child2-id';
  child2.name = 'child2';
  child2.style.height = '100px';
  child2.appendChild(document.createTextNode('link'));
  container.appendChild(child2);

  // This function will only be called once, so no need to guard.
  function listen(listener) {
    const unlisten = app.listen((location) => {
      listener(location);

      if (location.pathname === '/') {
        container.style.height = '20000px';
        container.style.width = '20000px';
      } else {
        container.style.height = '10000px';
        container.style.width = '10000px';
      }
    });

    return () => {
      unlisten();
      document.body.removeChild(container);
    };
  }

  return {
    ...app,
    listen,
  };
}
