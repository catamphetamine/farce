import Session from './Session';
import InMemoryEnvironment from '../environment/InMemoryEnvironment';
import InMemorySessionLifecycle from './lifecycle/InMemorySessionLifecycle';
import InMemoryNavigation from './navigation/InMemoryNavigation';

export default class InMemorySession extends Session {
  constructor({ navigation = new InMemoryNavigation() } = {}) {
    super({ navigation });

    this.environment = new InMemoryEnvironment();
    this.lifecycle = new InMemorySessionLifecycle();
  }
}
