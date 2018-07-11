import { webComponentBaseClass } from '../third_party/web-component-base-class/dist/webComponentBaseClass.js';

const componentName = 'vicowa-button';
window.customElements.define(componentName, class extends webComponentBaseClass {
	static get is() { return componentName; }
	constructor() {
		super();
	}

	static get properties() {
		return {
			string: {
				type: String,
				value: '',
				observer: '_stringChanged',
			},
			arguments: {
				type: Array,
				value: [],
				observer: '_argumentsChanged',
			},
			pluralNumber: {
				type: Number,
				value: 1,
				observer: '_pluralNumberChanged',
			},
			icon: {
				type: String,
				value: '',
				observer: '_iconChanged',
			},
		};
	}

	_stringChanged() {
		this.$.string.string = this.string;
	}
	_iconChanged() {
		this.$.icon.icon = this.icon;
	}
	_pluralNumberChanged() {
		this.$.string.pluralNumber = this.pluralNumber;
	}
	_argumentsChanged() {
		this.$.string.arguments = this.arguments;
	}
});
