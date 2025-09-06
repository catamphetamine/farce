import InMemorySession from './InMemorySession';
import ServerSideNavigation from './navigation/ServerSideNavigation';

// `ServerSideRenderSession` is just a `InMemorySession` that specifically prohibits any navigation.
export default class ServerSideRenderSession extends InMemorySession {
  constructor() {
    super({ navigation: new ServerSideNavigation() });
  }
}
