import delay from './delay.js';

// Runs the website.
// Executes the `steps` in order.
// Every step, except for the last one, must end with navigation: `goTo()` or `goBack()`,
// otherwise the application wouldn't reach the last step and would just freeze after the incorrect step.
export default function runApp(app, steps) {
  window.history.replaceState(null, null, '/');
  return runAppAtCurrentLocation(app, steps);
}

export function runAppAtCurrentLocation(app, steps) {
  let i = 0;

  return app.listen((location) => {
    if (i === steps.length) {
      return;
    }

    // Wait a extra tick for all the scroll callbacks to fire before checking
    // position.
    delay(() => {
      steps[i](location);
      i++;
    });
  });
}
