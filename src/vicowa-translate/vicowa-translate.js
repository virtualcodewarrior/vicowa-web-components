import { webComponentBaseClass } from "../third_party/web-component-base-class/src/webComponentBaseClass.js";
import translator from "../utilities/translate.js";

const componentName = "vicowa-translate";
/**
 * Class to represent the vicowa-translate custom element
 * This custom element adds a convenient way of adding locations for translation files, just add the element with
 * the proper location set in the translationLocation attribute. Note that this location should be a directory containing all
 * your translation files and not a path to a specific translation file
 * e.g. <vicowa-translate translationLocation="./resources/i18n/">
 * @extends webComponentBaseClass
 * @property {string} translationLocation The location where translations can be found
 */
class VicowaTranslate extends webComponentBaseClass {
	static get is() { return componentName; }
	constructor() {
		super();
	}

	static get properties() {
		return {
			translationLocation: {
				type: String,
				value: "",
				reflect: true,
				observer: (inst) => {
					translator.addTranslationLocation(inst.translationLocation);
				},
			},
		};
	}

	attached() {
		translator.addTranslationLocation(this.translationLocation);
	}

	static get template() {
		return "";
	}
}

window.customElements.define(componentName, VicowaTranslate);
