// import { describe, it } from 'mocha';
import { expect } from 'chai';

import * as exports from '../../src/index.js';

describe('index', () => {
	it('should export top level correctly', () => {
		expect(exports.addBasePath).to.be.a('function');
		expect(exports.removeBasePath).to.be.a('function');
		expect(exports.getLocationUrl).to.be.a('function');
		expect(exports.parseLocationUrl).to.be.a('function');
		expect(exports.addNavigationBlocker).to.be.a('function');
		expect(exports.getLocationUrl).to.be.a('function');
		expect(exports.parseLocationUrl).to.be.a('function');
		expect(exports.parseInputLocation).to.be.a('function');
		expect(new exports.NavigationStack(exports.InMemoryEnvironment)).to.exist;
		expect(exports.default).to.be.a('function');
		expect(exports.InMemoryEnvironment).to.be.a('function');
		expect(exports.WebBrowserEnvironment).to.be.a('function');
		expect(exports.ServerSideRenderEnvironment).to.be.a('function');
		expect(exports.ServerSideRedirectError).to.be.a('function');
		expect(exports.NavigationOutOfBoundsError).to.be.a('function');
	});
});
