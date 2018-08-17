import { VicowaInputBaseClass, validate } from '../vicowa-input-base/vicowa-input-base.js';
import translator from '../utilities/translate.js';
import validators from '../utilities/validators.js';

/**
 * Handler to be called when the placeholder text is changed
 * @param {VicowaInput} p_InputControl The control for which this handler is called
 */
function placeholderChanged(p_InputControl) {
	p_InputControl.$.input.placeholder = p_InputControl.placeholder;
	p_InputControl.updateTranslation();
}

const componentName = 'vicowa-input';

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
				value: '',
				reflectToAttribute: true,
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

		this.addAutoEventListener(this.$.input, 'blur', validateAndSet); // loosing focus
		this.addAutoEventListener(this.$.input, 'change', validateAndSet); // applying the value
		this.addAutoEventListener(this.$.input, 'input', validateAndSetNoErrorMessage); // inputting text

		this.$.input.placeholder = this.placeholder;
		translator.addTranslationUpdatedObserver((p_Translator) => {
			this._activeTranslator = p_Translator;
			this.updateTranslation();
		}, this);
	}
}

window.customElements.define(componentName, VicowaInput);
