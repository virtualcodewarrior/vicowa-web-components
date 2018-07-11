import { webComponentBaseClass } from '../third_party/web-component-base-class/dist/webComponentBaseClass.js';
import validators from '../utilities/validators.js';

const componentName = 'vicowa-input';
window.customElements.define(componentName, class extends webComponentBaseClass {
	static get is() { return componentName; }
	constructor() {
		super();
	}

	static get properties() {
		return {
			validatorType: {
				type: String,
				value: '',
			},
			value: {
				type: String,
				value: '',
				reflectToAttribute: true,
				observer: '_valueChanged',
			},
			preventInvalid: {
				type: Boolean,
				value: false,
				reflectToAttribute: true,
				observer: '_preventInvalidChanged',
			},
			label: {
				type: String,
				value: '',
				reflectToAttribute: true,
				observer: '_labelChanged',
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
		};
	}

	detached() {
	}

	attached() {
		const validate = (p_Value, p_Message) => {
			const validation = (validators[this.validatorType] || this.validator)(p_Value);
			this.$.error.string = (!validation.valid && p_Message) ? validation.error || 'something is wrong' : '';
		};

		const validateAndSet = () => {
			this.value = this.$.input.value;
			validate(this.value, true);
		};

		const validateAndSetNoErrorMessage = () => {
			this.value = this.$.input.value;
			validate(this.value, false);
		};

		this.addAutoEventListener(this.$.input, 'blur', validateAndSet); // loosing focus
		this.addAutoEventListener(this.$.input, 'change', validateAndSet); // applying the value
		this.addAutoEventListener(this.$.input, 'input', validateAndSetNoErrorMessage); // inputting text
	}

	_valueChanged(p_NewValue, p_OldValue) {
		this.$.input.value = p_NewValue;
		if (this.onChange) {
			this.onChange(this.value, p_OldValue);
		}

		this._validate(this.value, true);
	}

	get valid() { return this.validator(this.value).valid; }

	_preventInvalidChanged() {

	}

	_labelChanged() {
		this.$.label.string = this.label;
	}

	_placeholderChanged() {

	}
});
