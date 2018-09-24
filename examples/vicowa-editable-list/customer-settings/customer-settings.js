// business-settings.js
// ////////////////////////////////////////////////////////////
// this web component allows a user to change settings for a business owned by a user
import { webComponentBaseClass } from "../../../src/third_party/web-component-base-class/src/webComponentBaseClass.js";

const customElementName = "customer-settings";

const channelOptions = [
	{ value: "website", displayText: "Website" },
	{ value: "email", displayText: "EMail" },
	{ value: "phone", displayText: "Phone" },
	{ value: "word-of-mouth", displayText: "Word-of-mouth" },
	{ value: "other", displayText: "Other" },
];

window.customElements.define(customElementName, class extends webComponentBaseClass {
	/**
	 * return this web components name
	 * @returns {String} The name of this element
	 */
	static get is() { return customElementName; }
	/**
	 * constructor
	 */
	constructor() {
		super();
	}

	/**
	 * The properties for this component
	 * @returns {Object} The properties for this component
	 */
	static get properties() {
		return {
			settings: {
				type: Object,
				value: {
					id: "",
					name: "",
					email: "",
					channel: "other",
					address: "",
					postal: "",
					city: "",
					province: "",
					country: "",
				},
				observer: "_settingsChanged",
			},
			expanded: {
				type: Boolean,
				reflectToAttribute: true,
				value: false,
			},
		};
	}

	get hasData() { return Object.keys(this.settings).length > 0 && Object.keys(this.settings).every((p_Key) => this.settings[p_Key] !== ""); }

	startEdit() {
		this.$$$(".customer-card .input").forEach((p_Input) => {
			p_Input.static = false;
			p_Input.hideLabel = false;
		});
		this.expanded = true;
	}

	_fillSettings() {
		this.$.channel.onAttached = () => {
			this.$.channel.options = channelOptions;
			Object.keys(this.settings).forEach((p_Key) => {
				if (this.$[p_Key]) {
					this.$[p_Key].value = this.settings[p_Key];
				}
			});
		};
	}

	get valid() {
		return Object.keys(this.settings).every((p_Key) => !this.$[p_Key] || this.$[p_Key].valid);
	}

	doSave() {
		if (this.valid) {
			let changed = false;
			Object.keys(this.settings).forEach((p_Key) => {
				if (this.$[p_Key] && this.settings[p_Key] !== this.$[p_Key].value) {
					this.settings[p_Key] = this.$[p_Key].value;
					changed = true;
				}
			});

			if (changed && this.onChanged) {
				this.onChanged(this.settings);
			}
		}
		return this.valid;
	}

	doCancel() {
		this._fillSettings();
	}

	stopEdit() {
		this.$$(".customer-card").classList.remove("editing");
		this.$$$(".customer-card .input").forEach((p_Input) => {
			p_Input.static = true;
			p_Input.hideLabel = true;
		});
		this.expanded = false;
	}

	attached() {
		const handleChanged = () => {
			if (this.onChange) {
				this.onChange();
			}
		};
		this.$.channel.options = channelOptions;
		this.$.country.onAttached = () => { if (this.onReady) { this.onReady(); } };
		this.$$$(".input").forEach((p_Control) => { p_Control.onChange = handleChanged; p_Control.onInput = handleChanged; });
	}

	_settingsChanged() {
		this._fillSettings();
	}
});
