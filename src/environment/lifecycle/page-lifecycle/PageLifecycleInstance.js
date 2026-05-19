import PageLifecycle from './PageLifecycle.js';

// The original design of `PageLifecycle` class by the original code authors
// assumes that there should only ever exist one instance of `PageLifecycle` class.
// In programming it's called a "singleton" pattern.
let pageLifecycleInstance
export function getPageLifecycleInstance() {
	if (!pageLifecycleInstance) {
		pageLifecycleInstance = new PageLifecycle();
	}
	return pageLifecycleInstance;
}
