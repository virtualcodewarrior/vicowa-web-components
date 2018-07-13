import { webComponentBaseClass } from '../third_party/web-component-base-class/dist/webComponentBaseClass.js';

const componentName = 'vicowa-panel';
window.customElements.define(componentName, class extends webComponentBaseClass {
	static get is() { return componentName; }
	constructor() {
		super();
	}

	static get properties() {
		return {
			header: {
				type: String,
				value: '',
				reflectToAttribute: true,
				observer: '_headerChanged',
			},
		};
	}
});
