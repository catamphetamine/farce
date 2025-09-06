import WebBrowserDataStorage from './data-storage/WebBrowserDataStorage';
import WebBrowserScrollPosition from './scroll-position/WebBrowserScrollPosition';

export default class WebBrowserEnvironment {
  constructor() {
    this.dataStorage = new WebBrowserDataStorage();
    this.scrollPosition = new WebBrowserScrollPosition();
  }
}
