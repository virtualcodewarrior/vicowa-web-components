import { webComponentBaseClass } from '../third_party/web-component-base-class/src/webComponentBaseClass.js';
import translator from '../utilities/translate.js';
import validators from '../utilities/validators.js';

/**
 * Validate the value for the given input element
 * @param {VicowaInputBase} p_InputControl Element for which the value is validated
 * @param {string} p_Value The value to validate
 * @param {boolean} p_ShowMessage true when an error message should be shown when invalid or false to not show the error message
 * @returns {{ valid: {boolean}, error: {string} }} Returns an object that indicates if the result was valid or not
 */
export function validate(p_InputControl, p_Value, p_ShowMessage) {
	const validation = (validators[p_InputControl.validatorName] || p_InputControl.validator || (() => ({ valid: true })))(p_Value);
	p_InputControl.$.error.string = (!validation.valid && p_ShowMessage) ? validation.error || 'something is wrong' : '';
	p_InputControl.classList.toggle('invalid', !validation.valid && p_ShowMessage);
	return validation;
}

/**
 * Handler to be called when the value gets changed
 * @param {VicowaInputBase} p_InputControl The control for which this handler is called
 * @param {string} p_NewValue The new value
 * @param {string} p_OldValue The old value
 */
function valueChanged(p_InputControl, p_NewValue, p_OldValue) {
	p_InputControl.$.input.value = p_NewValue;
	if (p_InputControl.onChange) {
		p_InputControl.onChange(p_InputControl.value, p_OldValue);
	}

	validate(p_InputControl, p_InputControl.value, true);
}

/**
 * Handler to be called when the label is changed
 * @param {VicowaInputBase} p_InputControl The control for which this handler is called
 */
function labelChanged(p_InputControl) {
	p_InputControl.$.label.string = p_InputControl.label;
}

/**
 * Handler to be called when the tooltip text is changed
 * @param {VicowaInputBase} p_InputControl The control for which this handler is called
 */
function tooltipChanged(p_InputControl) {
	p_InputControl.$.input.title = p_InputControl.tooltip;
	p_InputControl.updateTranslation();
}

/**
 * Class that represents the vicowa-input custom element
 * @extends webComponentBaseClass
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
export class VicowaInputBaseClass extends webComponentBaseClass {
	constructor() {
		super();
		this.validator = null;
		this._activeTranslator = null;
	}

	static get properties() {
		return {
			validatorName: {
				type: String,
				value: '',
			},
			value: {
				type: String,
				value: '',
				reflectToAttribute: true,
				observer: valueChanged,
			},
			label: {
				type: String,
				value: '',
				reflectToAttribute: true,
				observer: labelChanged,
			},
			topLabel: {
				type: Boolean,
				value: false,
				reflectToAttribute: true,
			},
			hideLabel: {
				type: Boolean,
				value: false,
				reflectToAttribute: true,
			},
			static: {
				type: Boolean,
				value: false,
				reflectToAttribute: true,
			},
			index: {
				type: Number,
				value: 0,
				reflectToAttribute: true,
			},
			tooltip: {
				type: String,
				value: '',
				reflectToAttribute: true,
				observer: tooltipChanged,
			},
			disabled: {
				type: Boolean,
				value: false,
				reflectToAttribute: true,
			},
		};
	}

	updateTranslation() {
		this.$.input.title = (this._activeTranslator && this.tooltip) ? this._activeTranslator.translate(this.tooltip).fetch() : this.tooltip;
	}

	attached() {
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

	get valid() { return validate(this, this.value, true).valid; }
}
