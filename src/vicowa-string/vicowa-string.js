import { webComponentBaseClass } from "../third_party/web-component-base-class/src/webComponentBaseClass.js";
import translator from "../utilities/translate.js";

const privateData = Symbol("privateData");

const componentName = "vicowa-string";

function updateString(p_StringElement, p_NewValue, p_OldValue) {
	if (p_OldValue === undefined && !p_NewValue && p_StringElement.innerHTML.trim()) {
		p_StringElement.string = p_StringElement.innerHTML.trim();
	} else {
		p_StringElement.updateTranslation();
	}
}

function updateParameters(p_StringElement, p_NewValue, p_OldValue) {
	if (p_StringElement.string && (p_OldValue !== undefined || p_NewValue.length > 0)) {
		p_StringElement.updateTranslation();
	}
}

function updatePluralNumber(p_StringElement, p_NewValue, p_OldValue) {
	if (p_StringElement.string && (p_OldValue !== undefined || p_NewValue !== 1)) {
		p_StringElement.updateTranslation();
	}
}

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
		this[privateData] = {
			activeTranslator: null,
		};
	}

	static get properties() {
		return {
			string: {
				type: String,
				value: "",
				reflectToAttribute: true,
				observer: updateString,
			},
			parameters: {
				type: Array,
				value: [],
				observer: updateParameters,
			},
			pluralNumber: {
				type: Number,
				value: 1,
				observer: updatePluralNumber,
			},
		};
	}

	updateTranslation() {
		const controlData = this[privateData];
		this.$.string.innerHTML = (controlData.activeTranslator && this.string) ? controlData.activeTranslator.translate(this.string).ifPlural(this.pluralNumber || 1).fetch(this.parameters) : this.string;
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
			this[privateData].activeTranslator = p_Translator;
			this.updateTranslation();
		}, this);
	}
}

window.customElements.define(componentName, VicowaString);
