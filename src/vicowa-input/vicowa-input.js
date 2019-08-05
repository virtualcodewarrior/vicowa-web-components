import { VicowaInputBaseClass, validate } from "../vicowa-input-base/vicowa-input-base.js";
import "../vicowa-string/vicowa-string.js";
import translator from "../utilities/translate.js";

/**
 * Handler to be called when the placeholder text is changed
 * @param {VicowaInput} p_InputControl The control for which this handler is called
 */
function placeholderChanged(p_InputControl) {
	p_InputControl.$.input.placeholder = p_InputControl.placeholder;
	p_InputControl.updateTranslation();
}

const componentName = "vicowa-input";

/**
 * Class that represents the vicowa-input custom element
 * @extends VicowaInputBaseClass
 * @property {string} validatorName Name of the validator function to use with this instance or empty for no validation
 * @property {string} value The string representation of the value for this instance
 * @property {string} label The label for this input element or empty if it has no label
 * @property {boolean} topLabel Boolean that indicates if the label should e on top of the input control, default is to the left
 * @property {boolean} hideLabel Boolean to indicate that the label should be hidden
 * @property {boolean} static Boolean to indicate if the input should be drawn as if it is a static field, this will disable all input on it
 * @property {string} placeholder Placeholder text to show in the control
 * @property {number} index Tab index
 * @property {string} tooltip Tooltip string for the control
 * @property {boolean} disabled Indicates if the control is disabled or not
 * @property {function} onChange Assign a function to this member that will get called when the value changes
 * @property {function} validator Assign a custom validator function to this to use instead of one of the pre defined ones
 */
class VicowaInput extends VicowaInputBaseClass {
	static get is() { return componentName; }
	constructor() {
		super();
	}

	static get properties() {
		return Object.assign({}, super.properties, {
			placeholder: {
				type: String,
				value: "",
				reflect: true,
				observer: placeholderChanged,
			},
		});
	}

	updateTranslation() {
		super.updateTranslation();
		this.$.input.placeholder = (this._activeTranslator && this.placeholder) ? this._activeTranslator.translate(this.placeholder).fetch() : this.placeholder;
	}

	attached() {
		super.attached();
		const validateAndSet = () => {
			validate(this, this.value, true);
			this.value = this.$.input.value;
		};

		const validateAndSetNoErrorMessage = () => {
			this.value = this.$.input.value;
			validate(this, this.value, false);
		};

		this.addAutoEventListener(this.$.input, "blur", validateAndSet); // loosing focus
		this.addAutoEventListener(this.$.input, "change", validateAndSet); // applying the value
		this.addAutoEventListener(this.$.input, "input", validateAndSetNoErrorMessage); // inputting text

		this.$.input.placeholder = this.placeholder;
		translator.addTranslationUpdatedObserver((p_Translator) => {
			this._activeTranslator = p_Translator;
			this.updateTranslation();
		}, this);
	}

	static get template() {
		return `
			<style>
				#label {
					position: relative;
					display: inline-block;
					margin-right: 10px;
					font-family: var(--vicowa-input-label-font-family, inherit);
					font-size: var(--vicowa-input-label-font-size, inherit);
					font-style: var(--vicowa-input-label-font-style, inherit);
					font-weight: var(--vicowa-input-label-font-weight, inherit);
					color: var(--vicowa-input-label-color, inherit);
					opacity: var(--vicowa-input-label-opacity, inherit);
					width: var(--vicowa-input-label-width, auto);
					overflow: hidden;
					text-overflow: ellipsis;
					flex: var(--vicowa-input-label-flex, 1 1 auto);
				}

				:host {
					position: relative;
					display: block;
					box-sizing: border-box;
				}

				:host([hide-label]) #label {
					display: none;
				}

				:host([disabled]) {
					opacity: 0.5;
					pointer-events: none;
				}

				#control-container {
					display: flex;
					flex-direction: row;
				}

				:host([top-label]) #control-container {
					flex-direction: column;
				}

				#input {
					box-sizing: border-box;
					border: var(--vicowa-input-border, 1px solid gray);
					font-family: var(--vicowa-input-control-font-family, inherit);
					font-size: var(--vicowa-input-control-font-size, inherit);
					font-style: var(--vicowa-input-control-font-style, inherit);
					font-weight: var(--vicowa-input-control-font-weight, inherit);
					color: var(--vicowa-input-control-color, inherit);
					background: var(--vicowa-input-control-background, transparent);
					height: var(--vicowa-input-control-height, auto);
					width: var(--vicowa-input-control-width, 100px);
				}

				:host([top-label]) #input {
					width: var(--vicowa-input-control-width, 100%);
				}

				:host(.invalid) #input {
					background: var(--vicowa-input-control-error-background, red);
					color: var(--vicowa-input-control-error-color, white);
				}

				#error {
					font-family: var(--vicowa-input-error-font-family, inherit);
					font-size: var(--vicowa-input-error-font-size, 0.6em);
					font-style: var(--vicowa-input-error-font-style, italic);
					font-weight: var(--vicowa-input-error-font-weight, inherit);
					color: var(--vicowa-input-error-color, red);
					opacity: var(--vicowa-input-error-opacity, 1);
				}
		
				#input::placeholder {
					font-family: var(--vicowa-input-placeholder-font-family, inherit);
					font-size: var(--vicowa-input-placeholder-font-size, 1em);
					font-style: var(--vicowa-input-placeholder-font-style, italic);
					font-weight: var(--vicowa-input-placeholder-font-weight, inherit);
					color: var(--vicowa-input-placeholder-color, black);
					opacity: var(--vicowa-input-placeholder-opacity, 0.3);
				}
		
				:host([static]) #input {
					background: transparent;
					border-color: transparent;
					outline: none;
					overflow: hidden;
					text-overflow: ellipsis;
				}
				:host([static]) #input::placeholder {
					color: transparent;
				}

				#error[string=''],
				:host([static]) #error {
					display: none;
				}
			</style>
			<div id="control-container">
				<label for="input"><vicowa-string id="label"></vicowa-string></label>
				<input name="input" id="input" title="">
			</div>
			<vicowa-string id="error"></vicowa-string>
		`;
	}
}

window.customElements.define(componentName, VicowaInput);
