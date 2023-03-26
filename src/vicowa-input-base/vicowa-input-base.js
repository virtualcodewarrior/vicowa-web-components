import { WebComponentBaseClass } from '/third_party/web-component-base-class/src/web-component-base-class.js';
import translator from '../utilities/translate.js';
import validators from '../utilities/validators.js';

/**
 * Validate the value for the given input element
 * @param {VicowaInputBase} inputControl Element for which the value is validated
 * @param {string} value The value to validate
 * @param {boolean} showMessage true when an error message should be shown when invalid or false to not show the error message
 * @returns {{ valid: {boolean}, error: {string} }} Returns an object that indicates if the result was valid or not
 */
export function validate(inputControl, value, showMessage) {
	const validation = (validators[inputControl.validatorName] || inputControl.validator || (() => ({ valid: true })))(value);
	inputControl.$.error.string = (!validation.valid && showMessage) ? validation.error || 'something is wrong' : '';
	inputControl.classList.toggle('invalid', !validation.valid && showMessage);
	return validation;
}

/**
 * Class that represents the vicowa-input custom element
 * @extends WebComponentBaseClass
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
 * @property {string} ariaLabel The name of the input control, used for accessibility, if this is not set it will use any string set for the button
 */
export class VicowaInputBaseClass extends WebComponentBaseClass {
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
			type: {
				type: String,
				value: 'text',
				reflectToAttribute: true,
				observer: (control) => control.#typeChanged(),
			},
			value: {
				type: String,
				value: '',
				reflectToAttribute: true,
				observer: (control, newValue, oldValue) => control.#valueChanged(newValue, oldValue),
			},
			label: {
				type: String,
				value: '',
				reflectToAttribute: true,
				observer: (control) => control.#labelChanged(),
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
				observer: (control) => control.#staticChanged(),
			},
			tooltip: {
				type: String,
				value: '',
				reflectToAttribute: true,
				observer: (control) => control.#tooltipChanged(),
			},
			disabled: {
				type: Boolean,
				value: false,
				reflectToAttribute: true,
			},
			readonly: {
				type: Boolean,
				value: false,
				reflectToAttribute: true,
				observer: (control) => control.#readOnlyChanged(),
			},
			ariaLabel: {
				type: String,
				value: '',
				observer: (control) => control.#ariaLabelChanged(),
			},
			autocomplete: {
				type: String,
				value: undefined,
				observer: (control) => control.#autocompleteChanged(),
			},
		};
	}

	updateTranslation() {
		this.$.input.title = (this._activeTranslator && this.tooltip) ? this._activeTranslator.translate(this.tooltip).fetch() : this.tooltip;
	}

	attached() {
		this.$.label.onTranslationUpdated = (string) => {
			if (!this.ariaLabel) {
				this.$.input.setAttribute('aria-label', string);
			}
		};
		this.$.input.setAttribute('aria-label', this.$.label.displayString);

		const validateAndSet = () => {
			validate(this, this.value, true);
			this.value = this.$.input.value;
		};

		const validateAndSetNoErrorMessage = () => {
			this.value = this.$.input.value;
			validate(this, this.value, false);
		};

		this.addAutoEventListener(this.$.input, 'blur', validateAndSet); // loosing focus
		this.addAutoEventListener(this.$.input, 'change', validateAndSetNoErrorMessage); // applying the value
		this.addAutoEventListener(this.$.input, 'input', validateAndSetNoErrorMessage); // inputting text

		this.$.input.placeholder = this.placeholder;
		translator.addTranslationUpdatedObserver((translatorInstance) => {
			this._activeTranslator = translatorInstance;
			this.updateTranslation();
		}, this);
	}

	updateValidFeedback() { validate(this, this.value, true); }
	get valid() { return validate(this, this.value, false).valid; }

	#ariaLabelChanged() {
		this.$.input.setAttribute('aria-label', this.ariaLabel);
	}

	#autocompleteChanged() {
		this.$.input.setAttribute('autocomplete', this.autocomplete);
	}

	#staticChanged() {
		this.$.input.readOnly = this.static || this.readonly;
		this.$.input.tabIndex = (this.static) ? -1 : 0;
	}

	#readOnlyChanged() {
		this.$.input.readOnly = this.readonly || this.static;
	}

	#typeChanged() {
		if (['text', 'password', 'email', 'number', 'search', 'url'].indexOf(this.type) === -1) {
			this.type = 'text';
		}
		this.$.input.type = this.type;
	}

	#valueChanged(newValue, oldValue) {
		this.$.input.value = newValue;
		if (this.onChange) {
			this.onChange(this.value, oldValue);
		}

		validate(this, this.value, false);
		if (this._handleValueChange) {
			this._handleValueChange();
		}
	}

	#labelChanged() {
		this.$.label.string = this.label;
	}

	#tooltipChanged() {
		this.$.input.title = this.tooltip;
		this.updateTranslation();
	}
}
