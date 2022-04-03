import { WebComponentBaseClass } from "/third_party/web-component-base-class/src/web-component-base-class.js";
import translator from "../utilities/translate.js";

/**
 * Class to represent the vicowa-translate custom element
 * This custom element adds a convenient way of adding locations for translation files, just add the element with
 * the proper location set in the translationLocation attribute. Note that this location should be a directory containing all
 * your translation files and not a path to a specific translation file
 * e.g. <vicowa-translate translationLocation="./resources/i18n/">
 * @extends WebComponentBaseClass
 * @property {string} translationLocation The location where translations can be found
 */
class VicowaTranslate extends WebComponentBaseClass {
	constructor() {
		super();
	}

	static get properties() {
		return {
			translationLocation: {
				type: String,
				value: "",
				reflectToAttribute: true,
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

window.customElements.define("vicowa-translate", VicowaTranslate);
