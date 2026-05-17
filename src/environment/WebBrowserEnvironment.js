import WebBrowserDataStorage from './data-storage/WebBrowserDataStorage';
import WebBrowserSessionLifecycle from './lifecycle/WebBrowserSessionLifecycle';
import WebBrowserLog from './log/WebBrowserLog';
import WebBrowserNavigation from './navigation/WebBrowserNavigation';
import WebBrowserScrollPosition from './scroll-position/WebBrowserScrollPosition';

export default class WebBrowserEnvironment {
  constructor() {
    this.dataStorage = new WebBrowserDataStorage();
    this.scrollPosition = new WebBrowserScrollPosition();
    this.lifecycle = new WebBrowserSessionLifecycle();
    this.log = new WebBrowserLog();
    this.navigation = new WebBrowserNavigation();
  }
}
