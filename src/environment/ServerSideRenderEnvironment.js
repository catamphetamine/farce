import InMemoryEnvironment from './InMemoryEnvironment';
import ServerSideNavigation from './navigation/ServerSideNavigation';

// `ServerSideRenderSession` is just a `InMemorySession` that specifically prohibits any navigation.
export default class ServerSideRenderEnvironment extends InMemoryEnvironment {
  constructor() {
    super();
    this.navigation = new ServerSideNavigation();
  }
}
