import { offset, scrollLeft, scrollTop } from 'dom-helpers';
import sinon from 'sinon';

import addScrollableContainer from './addScrollableContainer';
import addScrollableContainerWithAnchors from './addScrollableContainerWithAnchors';
import createApp from './createApp';
import delay from './delay';
import { setEventListener, triggerEvent } from './mockPageLifecycle';
import runApp from './runApp';
import withScrollableContainerAtIndexPageWithDisabledAutomaticScrollPositionRestoration from './withScrollableContainerAtIndexPageWithDisabledAutomaticScrollPositionRestoration';
import PageLifecycle from '../../src/environment/lifecycle/page-lifecycle/PageLifecycleInstance';

describe('ScrollPositionRestoration', () => {
  let unlisten;

  beforeEach(() => {
    window.history.scrollRestoration = 'auto';
  });

  afterEach(() => {
    if (unlisten) {
      unlisten();
    }
    sinon.restore();
    setEventListener();
  });

  it('sets/restores/resets `window.history.scrollRestoration` on freeze/resume', (done) => {
    sinon.replace(PageLifecycle, 'addEventListener', setEventListener);
    const app = createApp();
    expect(window.history.scrollRestoration).to.equal('auto');
    unlisten = runApp(app, [
      () => {
        expect(window.history.scrollRestoration).to.equal('manual');
        triggerEvent('frozen', 'hidden');
        expect(window.history.scrollRestoration).to.equal('manual');
        triggerEvent('hidden', 'frozen');
        expect(window.history.scrollRestoration).to.equal('auto');
        triggerEvent('frozen', 'hidden');
        expect(window.history.scrollRestoration).to.equal('manual');
        done();
      },
    ]);
  });

  it('sets/restores `window.history.scrollRestoration` on termination', (done) => {
    sinon.replace(PageLifecycle, 'addEventListener', setEventListener);
    expect(window.history.scrollRestoration).to.equal('auto');
    const app = createApp();
    unlisten = runApp(app, [
      () => {
        expect(window.history.scrollRestoration).to.equal('manual');
        triggerEvent('hidden', 'terminated');
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
          // This scroll will be ignored (overwritten by a subsequent scroll),
          // but it will test the "throttle scroll events" code.
          scrollTop(window, 10000);

          setTimeout(() => {
            scrollTop(window, 15000);
            delay(() => {
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
          expect(location.state).to.not.exist();
          // Here, it said "expected 14999.8330078125 to equal 15000".
          // Using `.to.be.closeTo()` here instead of `.to.equal()` to work around this browser issue.
          expect(scrollTop(window)).to.be.closeTo(15000, 0.5);
          app.goTo('/detail#child2');
        },
        () => {
          expect(scrollTop(window)).to.be.closeTo(offset(child2).top, 2);
          app.goTo('/detail#child1');
        },
        () => {
          // Here, it said "expected 7.800000190734863 to equal 7.999997138977051".
          // Using `.to.be.closeTo()` here instead of `.to.equal()` to work around this browser issue.
          expect(scrollTop(window)).to.be.closeTo(offset(child1).top, 0.5);
          app.goTo('/detail#unknown-fragment');
        },
        () => {
          expect(scrollTop(window)).to.equal(0);
          done();
        },
      ]);
    });

    it('should not crash when `window.history` is not available', (done) => {
      Object.defineProperty(window.history, 'scrollRestoration', {
        value: 'auto',
        // See https://github.com/taion/scroll-behavior/issues/126
        writable: false,
        enumerable: true,
        configurable: true,
      });

      const app = addScrollableContainerWithAnchors(createApp());

      unlisten = runApp(app, [
        () => {
          expect(scrollTop(window)).to.equal(0);

          delete window.history.scrollRestoration;
          window.history.scrollRestoration = 'auto';

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
          expect(container.scrollHeight).to.equal(20000);
          // Here, it said "expected 10000.033203125 to equal 10000".
          // Using `.to.be.closeTo()` here instead of `.to.equal()` to work around this browser issue.
          expect(scrollTop(container)).to.be.closeTo(10000, 0.5);
          done();
        },
      ]);
    });

    it('should save element scroll position on scroll event, i.e. before navigation is even attempted', (done) => {
      const app1 = addScrollableContainer(
        createApp({
          shouldChangePageScrollPositionOnLocationChange: () => false,
        }),
      );

      const unlisten1 = runApp(app1, [
        () => {
          expect(scrollTop(app1.container)).to.equal(0);
          scrollTop(app1.container, 5000);

          delay(() => {
            unlisten1();

            const app2 = addScrollableContainer(
              createApp({
                // Restore the data of the session of `app1`.
                // That data includes the scroll position.
                sessionKey: app1.getSessionKey(),
                shouldChangePageScrollPositionOnLocationChange: () => false,
              }),
            );

            unlisten = app2.listen(() => {
              delay(() => {
                // Here, it said "expected 4999.7998046875 to equal 5000".
                // Using `.to.be.closeTo()` here instead of `.to.equal()` to work around this browser issue.
                expect(scrollTop(app2.container)).to.be.closeTo(5000, 0.5);
                done();
              });
            });
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
