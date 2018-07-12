import { webComponentBaseClass } from '../third_party/web-component-base-class/dist/webComponentBaseClass.js';
import translator from '../utilities/translate.js';
import validators from '../utilities/validators.js';

/**
 * Validate the value for the given input element
 * @param {webComponentBaseClass} p_Element Element for which the value is validated
 * @param {string} p_Value The value to validate
 * @param {boolean} p_ShowMessage true when an error message should be shown when invalid or false to not show the error message
 * @returns {{ valid: {boolean}, error: {string} }} Returns an object that indicates if the result was valid or not
 */
function validate(p_Element, p_Value, p_ShowMessage) {
	const validation = (validators[p_Element.validatorName] || p_Element.validator || (() => ({ valid: true })))(p_Value);
	p_Element.$.error.string = (!validation.valid && p_ShowMessage) ? validation.error || 'something is wrong' : '';
	p_Element.classList.toggle('invalid', !validation.valid && p_ShowMessage);
	return validation;
}

const componentName = 'vicowa-input';
window.customElements.define(componentName, class extends webComponentBaseClass {
	static get is() { return componentName; }
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
				observer: '_valueChanged',
			},
			label: {
				type: String,
				value: '',
				reflectToAttribute: true,
				observer: '_labelChanged',
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
			placeholder: {
				type: String,
				value: '',
				reflectToAttribute: true,
				observer: '_placeholderChanged',
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
				observer: '_tooltipChanged',
			},

		};
	}

	updateTranslation() {
		this.$.input.placeholder = (this._activeTranslator && this.placeholder) ? this._activeTranslator.translate(this.placeholder).fetch() : this.placeholder;
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

	_valueChanged(p_NewValue, p_OldValue) {
		this.$.input.value = p_NewValue;
		if (this.onChange) {
			this.onChange(this.value, p_OldValue);
		}

		validate(this, this.value, true);
	}

	get valid() { return validate(this, this.value, true).valid; }

	_labelChanged() {
		this.$.label.string = this.label;
	}

	_placeholderChanged() {
		this.$.input.placeholder = this.placeholder;
		this.updateTranslation();
	}

	_tooltipChanged() {
		this.$.input.title = this.tooltip;
		this.updateTranslation();
	}
});
