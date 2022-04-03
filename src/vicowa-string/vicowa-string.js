import { WebComponentBaseClass } from "/third_party/web-component-base-class/src/web-component-base-class.js";
import "../vicowa-translate/vicowa-translate.js";
import translator from "../utilities/translate.js";

/**
 * Class to represent the vicowa-string custom element
 * @extends WebComponentBaseClass
 * @property {string} string The string that will be translated and displayed
 * @property {array} parameters Arguments to be used in a sprintf manner with the current active string
 * @property {number} pluralNumber A number to indicate the number of items this string applies to, the translator will decide if plural form is required for the specified number of items
 */
class VicowaString extends WebComponentBaseClass {
	#privateData;
	constructor() {
		super();
		this.#privateData = {
			activeTranslator: null,
		};
	}

	static get properties() {
		return {
			string: { type: String, value: "", reflectToAttribute: true, observer: (control, oldValue, newValue) => control.#updateString(oldValue, newValue) },
			parameters: { type: Array, value: [], observer: (control, oldValue, newValue) => control.#updateParameters(oldValue, newValue) },
			pluralNumber: { type: Number, value: 1, observer: (control, oldValue, newValue) => control.#updatePluralNumber(oldValue, newValue) },
		};
	}

	updateTranslation() {
		const controlData = this.#privateData;
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
			this.#privateData.activeTranslator = p_Translator;
			this.updateTranslation();
		}, this);
	}

	#updateString(p_NewValue, p_OldValue) {
		if (p_OldValue === undefined && !p_NewValue && this.innerHTML.trim()) {
			this.string = this.innerHTML.trim();
		} else {
			this.updateTranslation();
		}
	}

	#updateParameters(p_NewValue, p_OldValue) {
		if (this.string && (p_OldValue !== undefined || p_NewValue.length > 0)) {
			this.updateTranslation();
		}
	}

	#updatePluralNumber(p_NewValue, p_OldValue) {
		if (this.string && (p_OldValue !== undefined || p_NewValue !== 1)) {
			this.updateTranslation();
		}
	}

	static get template() {
		return `
			<style>
			</style>
			<span id="string"></span>
		`;
	}
}

window.customElements.define("vicowa-string", VicowaString);
