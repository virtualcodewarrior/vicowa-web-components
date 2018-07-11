import { webComponentBaseClass } from '../third_party/web-component-base-class/dist/webComponentBaseClass.js';
import translator from '../utilities/translate.js';

const componentName = 'vicowa-string';
window.customElements.define(componentName, class extends webComponentBaseClass {
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
			arguments: {
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
		this.$.string.textContent = (this._activeTranslator && this.string) ? this._activeTranslator.translate(this.string).ifPlural(this.pluralNumber || 1).fetch(this.arguments) : this.string;
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
});
