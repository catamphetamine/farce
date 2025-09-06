import Session from './Session';
import WebBrowserEnvironment from '../environment/WebBrowserEnvironment';
import WebBrowserSessionLifecycle from './lifecycle/WebBrowserSessionLifecycle';
import WebBrowserNavigation from './navigation/WebBrowserNavigation';

export default class WebBrowserSession extends Session {
  constructor() {
    super({ navigation: new WebBrowserNavigation() });

    this.environment = new WebBrowserEnvironment();
    this.lifecycle = new WebBrowserSessionLifecycle();
  }
}
