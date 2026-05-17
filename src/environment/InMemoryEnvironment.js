import InMemoryDataStorage from './data-storage/InMemoryDataStorage';
import InMemorySessionLifecycle from './lifecycle/InMemorySessionLifecycle';
import InMemoryLog from './log/InMemoryLog';
import InMemoryNavigation from './navigation/InMemoryNavigation';
import InMemoryScrollPosition from './scroll-position/InMemoryScrollPosition';

export default class InMemoryEnvironment {
  constructor() {
    this.dataStorage = new InMemoryDataStorage();
    this.log = new InMemoryLog();
    this.lifecycle = new InMemorySessionLifecycle();
    this.navigation = new InMemoryNavigation();
    this.scrollPosition = new InMemoryScrollPosition();
  }
}
