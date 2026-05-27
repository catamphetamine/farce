import WebBrowserEnvironment from './environment/WebBrowserEnvironment.js'
import NavigationStack from './NavigationStack.js'

export default class WebNavigationStack extends NavigationStack {
	constructor(options) {
		super(WebBrowserEnvironment, options)
	}
}