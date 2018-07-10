import { webComponentBaseClass } from '../third_party/web-component-base-class/dist/webComponentBaseClass.js';
import translator from '../utilities/translate.js';

const componentName = 'vicowa-string';
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
				reflectToAttribute: true,
				observer: '_stringChanged',
			},
		};
	}

	attached() {
	}

	detached() {
	}

	_stringChanged(p_NewValue, p_OldValue) {
		this.$.string.textContent = p_NewValue;
		translator.addTranslationAvailableHandler((p_Translator) => {
			this.$.string.textContent = p_Translator.translate(p_NewValue);
		});
	}
});
