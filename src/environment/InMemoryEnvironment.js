import InMemoryDataStorage from './data-storage/InMemoryDataStorage';
import InMemoryScrollPosition from './scroll-position/InMemoryScrollPosition';

export default class InMemoryEnvironment {
  constructor() {
    this.dataStorage = new InMemoryDataStorage();
    this.scrollPosition = new InMemoryScrollPosition();
  }
}
