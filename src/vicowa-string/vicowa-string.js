import { webComponentBaseClass } from '../third_party/web-component-base-class/src/webComponentBaseClass.js';
import translator from '../utilities/translate.js';

const componentName = 'vicowa-string';

/**
 * Class to represent the vicowa-string custom element
 * @extends webComponentBaseClass
 * @property {string} string The string that will be translated and displayed
 * @property {array} parameters Arguments to be used in a sprintf manner with the current active string
 * @property {number} pluralNumber A number to indicate the number of items this string applies to, the translator will decide if plural form is required for the specified number of items
 */
class VicowaString extends webComponentBaseClass {
	static get is() { return componentName; }
	constructor() {
		super();
		this._activeTranslator = null;
	}

	static get properties() {
		return {
			string: {
				type: String,
				value: '',
				reflectToAttribute: true,
				observer: 'updateTranslation',
			},
			parameters: {
				type: Array,
				value: [],
				observer: 'updateTranslation',
			},
			pluralNumber: {
				type: Number,
				value: 1,
				observer: 'updateTranslation',
			},
		};
	}

	updateTranslation() {
		this.$.string.innerHTML = (this._activeTranslator && this.string) ? this._activeTranslator.translate(this.string).ifPlural(this.pluralNumber || 1).fetch(this.parameters) : this.string;
		if (this.onTranslationUpdated) {
			this.onTranslationUpdated(this.displayString);
		}
	}

	get displayString() { return this.$.string.innerHTML; }

	detached() {
		translator.removeTranslationUpdatedObserverOwner(this);
	}

	attached() {
		this.$.string.innerHTML = this.string;
		translator.addTranslationUpdatedObserver((p_Translator) => {
			this._activeTranslator = p_Translator;
			this.updateTranslation();
		}, this);
	}
}

window.customElements.define(componentName, VicowaString);
