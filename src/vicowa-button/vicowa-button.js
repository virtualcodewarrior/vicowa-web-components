import { webComponentBaseClass } from "../third_party/web-component-base-class/src/webComponentBaseClass.js";
import translator from "../utilities/translate.js";

const privateData = Symbol("privateData");

const componentName = "vicowa-button";

function ariaLabelChanged(p_ButtonControl) {
	p_ButtonControl.$.button.setAttribute("aria-label", p_ButtonControl.ariaLabel);
}

function stringChanged(p_ButtonControl) {
	p_ButtonControl.$.string.string = p_ButtonControl.string;
}

function iconChanged(p_ButtonControl) {
	p_ButtonControl.$.icon.icon = p_ButtonControl.icon;
}

function pluralNumberChanged(p_ButtonControl) {
	p_ButtonControl.$.string.pluralNumber = p_ButtonControl.pluralNumber;
}

function argumentsChanged(p_ButtonControl) {
	p_ButtonControl.$.string.parameters = p_ButtonControl.parameters;
}

/**
 * Handler to be called when the tooltip text is changed
 * @param {VicowaButton} p_InputControl The control for which this handler is called
 */
function tooltipChanged(p_InputControl) {
	p_InputControl.$.button.setAttribute("title", p_InputControl.tooltip);
	p_InputControl.updateTranslation();
}


/**
 * Class that represents the vicowa-button custom element
 * @extends webComponentBaseClass
 * @property {string} string The text to be displayed on the button
 * @property {array} parameters Arguments that can be used in combination with the button text to do printf type insertions
 * @property {number} pluralNumber A number to indicate the number of items a string applies to. The translator will use this to determine if a plural form should be used
 * @property {string} icon The name of an icon to use with this button. This should be in the format <iconSet>:<iconName> e.g. general:file
 * @property {string} ariaLabel The name of the button, used for accessibility, if this is not set it will use any string set for the button
 * @property {string} tooltip A tooltip for the button
 */
class VicowaButton extends webComponentBaseClass {
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
				observer: stringChanged,
			},
			parameters: {
				type: Array,
				value: [],
				observer: argumentsChanged,
			},
			pluralNumber: {
				type: Number,
				value: 1,
				observer: pluralNumberChanged,
			},
			icon: {
				type: String,
				value: "",
				observer: iconChanged,
			},
			ariaLabel: {
				type: String,
				value: "",
				observer: ariaLabelChanged,
			},
			disabled: {
				type: Boolean,
				value: false,
				reflectToAttribute: true,
			},
			tooltip: {
				type: String,
				value: "",
				reflectToAttribute: true,
				observer: tooltipChanged,
			},
		};
	}

	updateTranslation() {
		const controlData = this[privateData];
		this.$.button.setAttribute("title", (controlData.activeTranslator && this.tooltip) ? controlData.activeTranslator.translate(this.tooltip).fetch() : this.tooltip);
	}

	attached() {
		this.$.string.onTranslationUpdated = (p_String) => {
			if (!this.ariaLabel) {
				this.$.button.setAttribute("aria-label", p_String);
			}
		};
		this.$.button.setAttribute("aria-label", this.$.string.displayString);

		translator.addTranslationUpdatedObserver((p_Translator) => {
			this[privateData].activeTranslator = p_Translator;
			this.updateTranslation();
		}, this);
	}
}

window.customElements.define(componentName, VicowaButton);
