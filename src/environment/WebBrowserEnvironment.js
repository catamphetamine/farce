import WebBrowserDataStorage from './data-storage/WebBrowserDataStorage.js';
import WebBrowserSessionLifecycle from './lifecycle/WebBrowserSessionLifecycle.js';
import WebBrowserLog from './log/WebBrowserLog.js';
import WebBrowserNavigation from './navigation/WebBrowserNavigation.js';
import WebBrowserScrollPosition from './scroll-position/WebBrowserScrollPosition.js';

export default class WebBrowserEnvironment {
  constructor() {
    this.dataStorage = new WebBrowserDataStorage();
    this.scrollPosition = new WebBrowserScrollPosition();
    this.lifecycle = new WebBrowserSessionLifecycle();
    this.log = new WebBrowserLog();
    this.navigation = new WebBrowserNavigation();
  }
}
