import InMemoryDataStorage from './data-storage/InMemoryDataStorage.js';
import InMemorySessionLifecycle from './lifecycle/InMemorySessionLifecycle.js';
import InMemoryLog from './log/InMemoryLog.js';
import InMemoryNavigation from './navigation/InMemoryNavigation.js';
import InMemoryScrollPosition from './scroll-position/InMemoryScrollPosition.js';

export default class InMemoryEnvironment {
  constructor() {
    this.dataStorage = new InMemoryDataStorage();
    this.log = new InMemoryLog();
    this.lifecycle = new InMemorySessionLifecycle();
    this.navigation = new InMemoryNavigation();
    this.scrollPosition = new InMemoryScrollPosition();
  }
}
