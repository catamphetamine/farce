import { offset, scrollLeft, scrollTop } from 'dom-helpers';
import sinon from 'sinon';

import addScrollableContainer from './addScrollableContainer';
import addScrollableContainerWithHyperlink from './addScrollableContainerWithHyperlink';
import createApp from './createApp';
import delay from './delay';
import { setEventListener, triggerEvent } from './mockPageLifecycle';
import runApp from './runApp';
import withScrollableContainerAtIndexPage from './withScrollableContainerAtIndexPage';
import PageLifecycle from '../../src/session/lifecycle/page-lifecycle/PageLifecycleInstance';

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
      const app = addScrollableContainerWithHyperlink(createApp());
      const child1 = document.getElementById('child1');
      const child2 = document.getElementById('child2-id');

      unlisten = runApp(app, [
        () => {
          // This will be ignored, but will exercise the throttle logic.
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

      const app = addScrollableContainerWithHyperlink(createApp());

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
    it('should allow scroll suppression', (done) => {
      const app = addScrollableContainerWithHyperlink(
        createApp({
          shouldUpdatePageScrollPositionForLocation: (
            location,
            prevLocation,
          ) => {
            return (
              !prevLocation || prevLocation.pathname !== location.pathname
            );
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
            app.goTo('/detail?key=value');
          });
        },
        () => {
          // Here, it said "expected 4999.7998046875 to equal 5000".
          // Using `.to.be.closeTo()` here instead of `.to.equal()` to work around this browser issue.
          expect(scrollTop(window)).to.be.closeTo(5000, 0.5);
          app.goTo('/');
        },
        () => {
          expect(scrollTop(window)).to.equal(0);
          done();
        },
      ]);
    });

    it('should ignore scroll events when `disableSavingScrollPosition()` is used', (done) => {
      const app = addScrollableContainerWithHyperlink(createApp());

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

    it('should allow custom position', (done) => {
      const app = addScrollableContainerWithHyperlink(
        createApp({
          getPageScrollPositionForLocation: () => [10, 20],
        }),
      );

      unlisten = runApp(app, [
        () => {
          app.goTo('/detail');
        },
        () => {
          app.goTo('/');
        },
        () => {
          // Here, it said "expected 9.966666221618652 to equal 10".
          // Using `.to.be.closeTo()` here instead of `.to.equal()` to work around this browser issue.
          expect(scrollLeft(window)).to.be.closeTo(10, 0.5);
          // Here, it said "19.933332443237305 to equal 20".
          // Using `.to.be.closeTo()` here instead of `.to.equal()` to work around this browser issue.
          expect(scrollTop(window)).to.be.closeTo(20, 0.5);
          done();
        },
      ]);
    });

    it('should save scroll position even if no scroll events are dispatched', (done) => {
      let customInitialPageScrollPosition;

      const app = addScrollableContainerWithHyperlink(
        createApp({
          // eslint-disable-next-line no-unused-vars
          getPageScrollPositionForLocation(location, prevLocation) {
            if (customInitialPageScrollPosition) {
              return [10, 20];
            }
            return undefined;
          },
        }),
      );

      unlisten = runApp(app, [
        () => {
          app.goTo('/detail');
        },
        () => {
          customInitialPageScrollPosition = [10, 20];
          app.goTo('/');
        },
        () => {
          customInitialPageScrollPosition = undefined;
          app.goTo('/detail');
        },
        () => {
          app.goBack();
        },
        () => {
          // Here, it said "expected 9.966666221618652 to equal 10".
          // Using `.to.be.closeTo()` here instead of `.to.equal()` to work around this browser issue.
          expect(scrollLeft(window)).to.be.closeTo(10, 0.5);
          // Here, it said "expected 19.933332443237305 to equal 20".
          // Using `.to.be.closeTo()` here instead of `.to.equal()` to work around this browser issue.
          expect(scrollTop(window)).to.be.closeTo(20, 0.5);
          done();
        },
      ]);
    });
  });

  describe('scrollable container', () => {
    it('should follow browser scroll behavior', (done) => {
      const { container, ...app } = addScrollableContainer(
        createApp({
          shouldUpdatePageScrollPositionForLocation: () => false,
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

    it('should restore scroll on remount', (done) => {
      const { container, ...app } = withScrollableContainerAtIndexPage(
        createApp({
          shouldUpdatePageScrollPositionForLocation: () => false,
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
          shouldUpdatePageScrollPositionForLocation: () => false,
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
                sessionKey: app1.getSessionKey(),
                shouldUpdatePageScrollPositionForLocation: () => false,
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
        addScrollableContainerWithHyperlink(createApp()),
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
