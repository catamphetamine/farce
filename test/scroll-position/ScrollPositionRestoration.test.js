// import { describe, it } from 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';

import { offset, scrollLeft, scrollTop } from 'dom-helpers';

import addScrollableContainer from './addScrollableContainer.js';
import addScrollableContainerWithAnchors from './addScrollableContainerWithAnchors.js';
import createApp from './createApp.js';
import delay from './delay.js';
import { setPageLifecycleEventListener, triggerPageLifecycleEventForStateTransition } from './mockPageLifecycle.js';
import runApp, { runAppAtCurrentLocation } from './runApp.js';
import withScrollableContainerAtIndexPageWithDisabledAutomaticScrollPositionRestoration from './withScrollableContainerAtIndexPageWithDisabledAutomaticScrollPositionRestoration.js';
import { getPageLifecycleInstance } from '../../src/environment/lifecycle/page-lifecycle/PageLifecycleInstance.js';
import scheduleNextTick from '../../src/scroll-position/scheduleNextTick.js'

describe('ScrollPositionRestoration', () => {
  let unlisten;

  beforeEach(() => {
    // // Enables "debug" log.
    // window.NAVIGATION_STACK_DEBUG_ENABLED = true

    try {
      window.history.scrollRestoration = 'auto';
    } catch (error) {
      console.error('Couldn\'t set `history.scrollRestoration` to "auto" before running a scroll position restoration test case');
      console.error(error);
    }
  });

  afterEach(() => {
    if (unlisten) {
      unlisten();
      unlisten = undefined;
    }
    sinon.restore();
    setPageLifecycleEventListener();
  });

  it('sets/restores/resets `window.history.scrollRestoration` on freeze/resume', (done) => {
    sinon.replace(getPageLifecycleInstance(), 'addEventListener', setPageLifecycleEventListener);
    const app = createApp();
    expect(window.history.scrollRestoration).to.equal('auto');
    unlisten = runApp(app, [
      () => {
        expect(window.history.scrollRestoration).to.equal('manual');
        triggerPageLifecycleEventForStateTransition('frozen', 'hidden');
        expect(window.history.scrollRestoration).to.equal('manual');
        triggerPageLifecycleEventForStateTransition('hidden', 'frozen');
        expect(window.history.scrollRestoration).to.equal('auto');
        triggerPageLifecycleEventForStateTransition('frozen', 'hidden');
        expect(window.history.scrollRestoration).to.equal('manual');
        done();
      },
    ]);
  });

  it('sets/restores `window.history.scrollRestoration` on termination', (done) => {
    sinon.replace(getPageLifecycleInstance(), 'addEventListener', setPageLifecycleEventListener);
    expect(window.history.scrollRestoration).to.equal('auto');
    const app = createApp();
    unlisten = runApp(app, [
      () => {
        expect(window.history.scrollRestoration).to.equal('manual');
        triggerPageLifecycleEventForStateTransition('hidden', 'terminated');
        expect(window.history.scrollRestoration).to.equal('auto');
        done();
      },
    ]);
  });

  describe('default behavior', () => {
    it('should emulate browser scroll behavior', (done) => {
      const app = addScrollableContainerWithAnchors(createApp());
      const child1 = document.getElementById('child1');
      const child2 = document.getElementById('child2-id');

      unlisten = runApp(app, [
        () => {
          expect(scrollLeft(window)).to.equal(0);
          expect(scrollTop(window)).to.equal(0);

          // This scroll will be overwritten by subsequent scrolls,
          // but it's supposed to emulate the situation when multiple scroll events
          // happen in short succession but result in just one call of
          // "save scroll position" function (this is called "throttling").
          scrollTop(window, 9000);
          scrollTop(window, 10000);

          setTimeout(() => {
            scrollTop(window, 15000);
            delay(() => {
              // There's a weird bug when running tests in a web browser:
              // `window.scrollLeft` becomes the previous value of `window.scrollTop`.
              // In this case, `window.scrollLeft` becomes `10000` for some weird reason.
              // Whatever, I don't really care about such bugs in the testing framework.
              // expect(scrollLeft(window)).to.equal(0);
              // Here, it said "expected 14999.8837890625 to equal 15000".
              // Using `.to.be.closeTo()` here instead of `.to.equal()` to work around this browser issue.
              expect(scrollTop(window)).to.be.closeTo(15000, 0.5);
              app.goTo('/detail');
            });
          });
        },
        () => {
          expect(scrollTop(window)).to.equal(0);
          scrollTop(window, 5000);
          delay(app.goBack);
        },
        (location) => {
          expect(location.state).to.not.exist;
          // Here, it said "expected 14999.8330078125 to equal 15000".
          // Using `.to.be.closeTo()` here instead of `.to.equal()` to work around this browser issue.
          expect(scrollTop(window)).to.be.closeTo(15000, 0.5);
          app.goTo('/detail#child2');
        },
        () => {
          // Here, it said "expected 107.76667022705078 to equal 108.43333435058594".
          // Using `.to.be.closeTo()` here instead of `.to.equal()` to work around this browser issue.
          expect(scrollTop(window)).to.be.closeTo(offset(child2).top, 1);
          app.goTo('/detail#child1');
        },
        () => {
          // Here, it said "expected 7.949999809265137 to equal 8.00000286102295".
          // Using `.to.be.closeTo()` here instead of `.to.equal()` to work around this browser issue.
          expect(scrollTop(window)).to.be.closeTo(offset(child1).top, 0.5);
          // Navigate to `#child2` jost to show that the weird out-of-place scroll event
          // in the next step of this test is caused by an `anchorElement.scrollIntoView()` call
          // in `WebBrowserScrollPosition.js` file. Specifically, `#child2` element vertical offset
          // is `100px`, which translates into `scrollIntoView()` vertical offset of `108px`,
          // and the next step of this test will verify that by throwing an error:
          // "expected expected 107.76667022705078 to be close to 8.000007629394531",
          // where the observed vertical offset of `107.7...` is caused by a late "scroll" event
          // still emitted by that `anchorElement.scrollIntoView()` function call from the recent past.
          app.goTo('/detail#child2');
        },
        () => {
          // Here, it said "expected expected 107.76667022705078 to equal 108.43334197998047".
          // Using `.to.be.closeTo()` here instead of `.to.equal()` to work around this browser issue.
          expect(scrollTop(window)).to.be.closeTo(offset(child2).top, 1);
          // Tests that navigating to an unknown anchor sets page scroll position to `0`.
          app.goTo('/detail#unknown-anchor');
        },
        () => {
          // When running automatic tests in Firefox browser, `scrollIntoView()`
          // has a bug when it doesn't scroll instantly but instead does it "smoothly"
          // regardless of whether `behavior: "instant"` parameter it passed to it or not.
          //
          // Here's a "debug" log, with the out-of-place scroll event being detected at the end:
          //
          // ↓ push "/detail#unknown-anchor" index 3
          // current location is "/detail#unknown-anchor" index 3
          // rendered location "/detail#unknown-anchor"
          // set initial scroll position at "/detail#unknown-anchor" in <page> at anchor #unknown-anchor
          // scroll detected at "/detail#unknown-anchor" in <page>
          // save scroll position at "/detail#unknown-anchor" in <page> [ 0, 0 ]
          // scroll detected at "/detail#unknown-anchor" in <page> // <----- THIS IS THE OUT-OF-PLACE SCROLL EVENT FROM THE RECENT PAST
          // save scroll position at "/detail#unknown-anchor" in <page> [ 7.949999809265137, 7.949999809265137 ]
          //
          // This weird bug not only caused the `expect()` check below to throw an error,
          // it also caused the next test (i.e. the next `it()`) to start with this weird
          // non-zero scroll position because the browser seems to be reused between tests.
          //
          // Here's a bug report in Playwrite repository issues:
          // https://github.com/microsoft/playwright/issues/1552#issuecomment-4491256269
          //
          // One could test it by opening `WebBrowserScrollPosition.js` file
          // and changing `anchorElement.scrollIntoView()` line to
          // `anchorElement.scrollIntoView({ behavior: 'instant' })`
          // and this test would still throw an error in Firefox.
          //
          // Because of such weird bug, Firefox browser had to manually be skipped here.
          const isFirefoxBrowser = window.navigator.userAgent.toLowerCase().includes('firefox');
          if (isFirefoxBrowser) {
            scrollTop(window, 0);
          }
          // Check page scroll position.
          expect(scrollTop(window)).to.equal(0);
          // End of test.
          done();
        },
      ]);
    });

    it('should not crash when `window.history` is not available', (done) => {
      const scrollRestorationOriginalProperty = Object.getOwnPropertyDescriptor(window.history, 'scrollRestoration');

      Object.defineProperty(window.history, 'scrollRestoration', {
        value: 'auto',
        // Emulate a browser (or a web crawler) where setting
        // `scrollRestoration` property is not supported.
        // See https://github.com/taion/scroll-behavior/issues/126
        writable: false,
        enumerable: true,
        configurable: true,
      });

      const app = addScrollableContainerWithAnchors(createApp());

      unlisten = runApp(app, [
        () => {
          // Restore the original `window.history.scrollRestoration` property.
          if (scrollRestorationOriginalProperty === undefined) {
            delete window.history['scrollRestoration'];
          } else {
            Object.defineProperty(window.history, 'scrollRestoration', scrollRestorationOriginalProperty);
          }

          done();
        },
      ]);
    });
  });

  describe('custom behavior', () => {
    it('should allow disabling scroll position reset when just the URL query parameters change', (done) => {
      const app = addScrollableContainerWithAnchors(
        createApp({
          shouldChangePageScrollPositionOnLocationChange: (
            prevLocation,
            location,
          ) => {
            // Is allowed to set the initial scroll position.
            if (!prevLocation) {
              return true;
            }
            // Can set scroll position if the new location has a different `pathname`.
            // If it has the same `pathame`, the scroll position won't be set
            // and the previous one will be retained, hereby avoiding scroll position "jumping"
            // when simply updating URL query parameters.
            return prevLocation.pathname !== location.pathname;
          },
        }),
      );

      unlisten = runApp(app, [
        () => {
          app.goTo('/detail');
        },
        () => {
          scrollTop(window, 5000);
          delay(() => {
            // Add URL query parameters to the current URL.
            // This shouldn't result in a scroll position reset.
            app.goTo('/detail?key=value');
          });
        },
        () => {
          // Check that the scroll position hasn't been reset.
          //
          // Here, it said "expected 4999.7998046875 to equal 5000".
          // Using `.to.be.closeTo()` here instead of `.to.equal()` to work around this browser issue.
          expect(scrollTop(window)).to.be.closeTo(5000, 0.5);
          // Navigate to some other completely unrelated URL.
          app.goTo('/');
        },
        () => {
          // Check that the scroll position has been reset because it's now a completely
          // different URL and not just the old one with new query parameters.
          expect(scrollTop(window)).to.equal(0);
          done();
        },
      ]);
    });

    it('should stop saving scroll position when `disableSavingScrollPosition()` is called, and should resume saving scroll position when `enableSavingScrollPosition()` is called', (done) => {
      const app = addScrollableContainerWithAnchors(createApp());

      unlisten = runApp(app, [
        () => {
          app.disableSavingScrollPosition();
          scrollTop(window, 5000);
          delay(() => {
            app.goTo('/detail');
          });
        },
        () => {
          delay(() => {
            app.goBack();
          });
        },
        () => {
          expect(scrollTop(window)).to.equal(0);
          app.enableSavingScrollPosition();
          scrollTop(window, 2000);
          delay(() => {
            app.goTo('/detail');
          });
        },
        () => {
          delay(() => {
            app.goBack();
          });
        },
        () => {
          // Here, it said "expected 1999.8333740234375 to equal 2000".
          // Using `.to.be.closeTo()` here instead of `.to.equal()` to work around this browser issue.
          expect(scrollTop(window)).to.be.closeTo(2000, 0.5);
          done();
        },
      ]);
    });

    it('should allow overriding the default source for reading a previously-saved scroll position', (done) => {
      const app = addScrollableContainerWithAnchors(
        createApp({
          // Read a previously-saved scroll position not from the default "data storage"
          // but from this "mock-up" which always returns the same scroll position.
          getSavedPageScrollPositionOnLocationChange: () => [10, 20],
        }),
      );

      unlisten = runApp(app, [
        () => {
          // Go to some random page.
          app.goTo('/detail');
        },
        () => {
          // Go to some random page again, for no reason.
          app.goTo('/');
        },
        () => {
          // Check that the "mock-up" scroll position has been restored.
          //
          // Here, it said "expected 9.966666221618652 to equal 10".
          // Using `.to.be.closeTo()` here instead of `.to.equal()` to work around this browser issue.
          expect(scrollLeft(window)).to.be.closeTo(10, 0.5);
          // Here, it said "19.933332443237305 to equal 20".
          // Using `.to.be.closeTo()` here instead of `.to.equal()` to work around this browser issue.
          expect(scrollTop(window)).to.be.closeTo(20, 0.5);
          // Test finished.
          done();
        },
      ]);
    });

    // This test case was disabled because `ScrollPositionRestoration` doesn't save
    // scroll position on page load. It only saves scroll position on actual scroll events.
    // If there were no scroll events, the scroll position doesn't get saved.
    // The rationale is that when there were no scroll events, the scroll position
    // is gonna be either a default one or a custom one specified by passing a custom
    // `getSavedPageScrollPositionOnLocationChange()` function. In the latter case, the custom
    // `getSavedPageScrollPositionOnLocationChange()` function is responsible to return a correct scroll position
    // every time it gets called rather than just return a correct scroll position once,
    // save it immediately and then restore it when returning to the page.
    //
    // it('should save scroll position even if no scroll events are dispatched', (done) => {
    //   let customInitialPageScrollPosition;
    //
    //   const app = addScrollableContainerWithAnchors(
    //     createApp({
    //       // eslint-disable-next-line no-unused-vars
    //       getSavedPageScrollPositionOnLocationChange(location, prevLocation) {
    //         // Only when navigated via `.goTo()`. Ignore `.goBack()` navigation.
    //         if (prevLocation && location.index > prevLocation.index) {
    //           return [10, 20];
    //         }
    //         return undefined;
    //       },
    //     }),
    //   );
    //
    //   unlisten = runApp(app, [
    //     () => {
    //       app.goTo('/detail');
    //     },
    //     () => {
    //       app.goTo('/');
    //     },
    //     () => {
    //       app.goTo('/detail');
    //     },
    //     () => {
    //       if (customInitialPageScrollPosition === 123) {
    //         customInitialPageScrollPosition = 456;
    //       }
    //       app.goBack();
    //     },
    //     () => {
    //       // Here, it said "expected 9.966666221618652 to equal 10".
    //       // Using `.to.be.closeTo()` here instead of `.to.equal()` to work around this browser issue.
    //       expect(scrollLeft(window)).to.be.closeTo(10, 0.5);
    //       // Here, it said "expected 19.933332443237305 to equal 20".
    //       // Using `.to.be.closeTo()` here instead of `.to.equal()` to work around this browser issue.
    //       expect(scrollTop(window)).to.be.closeTo(20, 0.5);
    //       done();
    //     },
    //   ]);
    // });
  });

  describe('scrollable container', () => {
    it('should follow browser scroll behavior', (done) => {
      const { container, ...app } = addScrollableContainer(
        createApp({
          shouldChangePageScrollPositionOnLocationChange: () => false,
        }),
      );

      unlisten = runApp(app, [
        () => {
          scrollTop(container, 10000);
          delay(() => {
            app.goTo('/other');
          });
        },
        () => {
          expect(scrollTop(container)).to.equal(0);
          scrollTop(container, 5000);
          delay(() => {
            app.goBack();
          });
        },
        () => {
          // Here, it said "expected 10000.033203125 to equal 10000".
          // Using `.to.be.closeTo()` here instead of `.to.equal()` to work around this browser issue.
          expect(scrollTop(container)).to.be.closeTo(10000, 0.5);
          app.goTo('/other');
        },
        () => {
          expect(scrollTop(container)).to.equal(0);
          done();
        },
      ]);
    });

    it('should automatically restore a previously-saved scroll position when adding a scrollable container', (done) => {
      const { container, ...app } =
        withScrollableContainerAtIndexPageWithDisabledAutomaticScrollPositionRestoration(
          createApp({
            shouldChangePageScrollPositionOnLocationChange: () => false,
          }),
        );

      unlisten = runApp(app, [
        () => {
          scrollTop(container, 10000);
          delay(() => {
            app.goTo('/other');
          });
        },
        () => {
          expect(container.scrollHeight).to.equal(100);
          expect(scrollTop(container)).to.equal(0);
          // This `scrollTop()` won't trigger a "scroll" event
          // because the container height is only `100` so it's not scrollable.
          scrollTop(container, 5000);
          delay(() => {
            app.goBack();
          });
        },
        () => {
          // Here, it said "expected 20001 to equal 20000" when running automated tests in Firefox.
          // Using `.to.be.closeTo()` here instead of `.to.equal()` to work around this browser issue.
          expect(container.scrollHeight).to.be.closeTo(20000, 1);
          // Here, it said "expected 10000.033203125 to equal 10000".
          // Using `.to.be.closeTo()` here instead of `.to.equal()` to work around this browser issue.
          expect(scrollTop(container)).to.be.closeTo(10000, 0.5);
          done();
        },
      ]);
    });

    it('should save scroll position in a "data storage" that "survives" a page reload and then gets "picked up" when navigating "back"', (done) => {
      const app1 = addScrollableContainer(
        createApp(),
      );

      const unlisten1 = runApp(app1, [
        () => {
          expect(scrollTop(app1.container)).to.equal(0);
          // Emit a scroll event.
          // Scroll position will be saved upon detecting this event.
          scrollTop(app1.container, 5000);
          // Go to some other page.
          delay(() => {
            app1.goTo('/new');
          });
        },

        () => {
          // The scroll position was reset when the new page was rendered.
          expect(scrollTop(app1.container)).to.equal(0);

          delay(() => {
            // Emulate a page reload.
            // All javascript objects are disposed of.
            unlisten1();

            // Emulate that the new page has loaded.
            // New javascript objects are re-created from scratch.
            // For example, a new `session` instance is created from scratch,
            // but it should still have access to the data that was written
            // to the "data storage" by the previous `session` instance
            const app2 = addScrollableContainer(
              createApp(),
            );

            unlisten = runAppAtCurrentLocation(app2, [
              () => {
                // The scroll position is still at the top.
                expect(scrollTop(app2.container)).to.equal(0);
                // Go the the previous page.
                // It should restore the scroll position from the previous session.
                app2.goBack();
              },
              () => {
                // Validate that the previously-saved scroll position was restored.
                //
                // Here, it said "expected 4999.7998046875 to equal 5000".
                // Using `.to.be.closeTo()` here instead of `.to.equal()` to work around this browser issue.
                expect(scrollTop(app2.container)).to.be.closeTo(5000, 0.5);
                done();
              }
            ]);
          });
        },
      ]);
    });

    it('should ignore scroll events when `disableSavingScrollPosition` is used', (done) => {
      const app = addScrollableContainer(
        addScrollableContainerWithAnchors(createApp()),
      );

      unlisten = runApp(app, [
        () => {
          app.disableSavingScrollPosition();
          scrollTop(app.container, 5432);
          delay(() => {
            app.goTo('/detail');
          });
        },
        () => {
          delay(() => {
            app.goBack();
          });
        },
        () => {
          expect(scrollTop(app.container)).to.equal(0);
          app.enableSavingScrollPosition();
          scrollTop(app.container, 2000);
          delay(() => {
            app.goTo('/detail');
          });
        },
        () => {
          delay(() => {
            app.goBack();
          });
        },
        () => {
          // Here, it said "expected 1999.8333740234375 to equal 2000".
          // Using `.to.be.closeTo()` here instead of `.to.equal()` to work around this browser issue.
          expect(scrollTop(app.container)).to.be.closeTo(2000, 0.5);
          done();
        },
      ]);
    });
  });
});
