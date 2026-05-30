// https://developers.google.com/web/updates/2018/07/page-lifecycle-api
// https://github.com/GoogleChromeLabs/page-lifecycle
import { getPageLifecycleInstance } from './page-lifecycle/PageLifecycleInstance.js';

export default class WebBrowserSessionLifecycle {
  constructor() {
    this.running = true;
  }

  addTerminationBlocker(terminationBlocker) {
    const onBeforeUnload = (event) => {
      if (terminationBlocker()) {
        // Calling `event.preventDefault()` will cause a web browser
        // to show a generic "Ok"/"Cancel" modal with some generic text:
        // "Are you sure to leave the current page?".
        event.preventDefault();
      }
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }

  addExecutionStatusListener(listener) {
    const pageLifecycleListener = (stateChange) => {
      // (stateChange: PageLifecycleStateChange)
      const { newState } = stateChange;

      const running = !['terminated', 'frozen', 'discarded'].includes(
        newState,
      );

      if (this.running !== running) {
        this.running = running;
        listener({ running });
      }
    };

    getPageLifecycleInstance().addEventListener('statechange', pageLifecycleListener);

    return () => {
      getPageLifecycleInstance().removeEventListener('statechange', pageLifecycleListener);
    };
  }
}

// interface PageLifecycleStateChange {
//   newState: PageLifecycleState;
//   oldState: PageLifecycleState;
//   originalEvent: Event;
// }

// // Page Lifecycle API event types.
// // https://developer.chrome.com/docs/web-platform/page-lifecycle-api#states
// // https://wicg.github.io/page-lifecycle/spec.html
// //
// type PageLifecycleState =
//   // The page is visible and is focused.
//   | 'active'
//   // The page is visible but is not focused.
//   | 'passive'
//   // The page is not visible (and has not been frozen, discarded, or terminated).
//   | 'hidden'
//   // If a page is hidden, a browser may choose to freeze it to reduce energy consumption.
//   | 'frozen'
//   // The process of terminating (destroying, closing) the page has started.
//   | 'terminated'
//   // The page is discarded by the web browser due to insufficient resources.
//   // The page snapshot could still be visible to the user even though it's no longer running.
//   | 'discarded';

// // Page Lifecycle API event types.
// // https://developer.chrome.com/docs/web-platform/page-lifecycle-api
// // https://wicg.github.io/page-lifecycle/spec.html
// //
// type PageLifecycleEvent =
//   // When the web browser window with an opened page gets focus, a `focus` event is emitted.
//   | 'focus'
//
//   // When the web browser window with an opened page is no longer focused, a `blur` event is emitted.
//   | 'blur'
//
//   // `visibilitychange` event fires with `document.visibilityState` being "hidden"
//   // when a user navigates to a new page, switches tabs, closes the tab, minimizes or closes the browser,
//   // or, on mobile, switches from the browser to a different app.
//   //
//   // Transitioning to "hidden" is the last event that's reliably observable by the page,
//   // so developers should treat it as the likely end of the user's session
//   // (for example, for sending analytics data).
//   //
//   // The transition to "hidden" is also a good point at which pages can stop making UI updates
//   // and stop any tasks that the user doesn't want to have running in the background.
//   //
//   | 'visibilitychange'
//
//   // Sometimes browsers "freeze" hidden pages in order to reduce energy consumption on mobile devices.
//   // In case of freezing an already-hidden page, a `freeze` event will be emitted, if supported by the browser.
//   | 'freeze'
//
//   // Sometimes browsers "freeze" hidden pages in order to reduce energy consumption on mobile devices.
//   // In case of unfreezing an already-frozen page, a `resume` event will be emitted, if supported by the browser.
//   | 'resume'
//
//   // `pageshow` event is emitted when a new page gets shown.
//   //
//   // For example, `pageshow` event is emitted when visiting a web page
//   // or after being navigated to a new page by clicking a hyperlink.
//   //
//   // `pageshow` event is also emitted when the user performs "Back" or "Forward" transition.
//   //
//   | 'pageshow'
//
//   // `pagehide` event is emitted when the current page gets "destroyed".
//   //
//   // For example, `pagehide` event is emitted when the user performs "Back" or "Forward" transition.
//   // In that case, `pagehide` event will be emitted for the current page before the transition.
//   //
//   // In any other cases of "destroying" The current page, `pagehide` event is not guaranteed to be emitted.
//   // For example, it won't be emitted when closing the web browser app via a task manager.
//   //
//   // Hence, `pagehide` event is unreliable and it's adivised to use `visibilitychange` event instead.
//   // Only if `visibilitychange` even is not supported by a web browser should one consider resorting to using `pagehide` event.
//   //
//   | 'pagehide';
