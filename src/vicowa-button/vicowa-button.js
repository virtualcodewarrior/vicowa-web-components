import { webComponentBaseClass } from '../third_party/web-component-base-class/dist/webComponentBaseClass.js';

const componentName = 'vicowa-button';

/**
 * Class that represents the vicowa-button custom element
 * @extends webComponentBaseClass
 * @property {string} string The text to be displayed on the button
 * @property {array} parameters Arguments that can be used in combination with the button text to do printf type insertions
 * @property {number} pluralNumber A number to indicate the number of items a string applies to. The translator will use this to determine if a plural form should be used
 * @property {string} icon The name of an icon to use with this button. This should be in the format <iconSet>:<iconName> e.g. general:file
 */
class VicowaButton extends webComponentBaseClass {
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
			parameters: {
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
		this.$.string.parameters = this.parameters;
	}
}

window.customElements.define(componentName, VicowaButton);
