// business-settings.js
// ////////////////////////////////////////////////////////////
// this web component allows a user to change settings for a business owned by a user
import { webComponentBaseClass } from "../../../src/third_party/web-component-base-class/src/webComponentBaseClass.js";
import "../../../src/vicowa-single-selection/vicowa-single-selection.js";

const customElementName = "customer-settings";

const channelOptions = [
	{ value: "website", displayText: "Website" },
	{ value: "email", displayText: "EMail" },
	{ value: "phone", displayText: "Phone" },
	{ value: "word-of-mouth", displayText: "Word-of-mouth" },
	{ value: "other", displayText: "Other" },
];

function fillData(p_Control) {
	p_Control.$.channel.onAttached = () => {
		p_Control.$.channel.options = channelOptions;
		Object.keys(p_Control.data).forEach((p_Key) => {
			if (p_Control.$[p_Key]) {
				p_Control.$[p_Key].value = p_Control.data[p_Key];
			}
		});
	};
}

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
			data: {
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
				observer: fillData,
			},
			expanded: {
				type: Boolean,
				reflectToAttribute: true,
				value: false,
			},
		};
	}

	get hasData() { return Object.keys(this.data).length > 0 && Object.keys(this.data).every((p_Key) => this.data[p_Key] !== ""); }

	startEdit() {
		this.$$$(".customer-card .input").forEach((p_Input) => {
			p_Input.static = false;
			p_Input.hideLabel = false;
		});
		this.expanded = true;
	}

	get valid() {
		return Object.keys(this.data).every((p_Key) => !this.$[p_Key] || p_Key === "id" || this.$[p_Key].valid);
	}

	doSave() {
		if (this.valid) {
			let changed = false;
			Object.keys(this.data).forEach((p_Key) => {
				if (this.$[p_Key] && this.data[p_Key] !== this.$[p_Key].value) {
					this.data[p_Key] = this.$[p_Key].value;
					changed = true;
				}
			});

			if (changed && this.onChanged) {
				this.onChanged(this.data);
			}
		}
		return this.valid;
	}

	doCancel() {
		fillData(this);
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

	static get template() {
		return 	`
			<template id="customer-settings">
				<style>
					.customer-card {
						display: flex;
						flex-direction: row;
					}
			
					.info {
						width: 150px;
					}
					vicowa-input {
						--vicowa-input-control-width: 150px;
					}
			
					:host([expanded]) .customer-card {
						flex-direction: column;
						--vicowa-single-selection-width: 300px;
					}
			
					:host([expanded]) .info {
						margin-bottom: 3px;
						width: auto;
					}
				</style>
				<div>
					<div class="customer-card">
						<div class="info">
							<vicowa-input id="name" static inline label="Name" hide-label class="input" validatorType="notEmpty"></vicowa-input>
						</div>
						<div class="info">
							<vicowa-input id="email" static inline label="EMail" hide-label class="input" validatorType="email"></vicowa-input>
						</div>
						<div class="info">
							<vicowa-single-selection id="channel" static inline label="Channel" hide-label class="input"></vicowa-single-selection>
						</div>
						<div class="info">
							<vicowa-input id="address" static inline label="Address" hide-label class="input" validatorType="notEmpty"></vicowa-input>
						</div>
						<div class="info">
							<vicowa-input id="postal" static inline label="Zip code" hide-label class="input" validatorType="postalCodeCA"></vicowa-input>
						</div>
						<div class="info">
							<vicowa-input id="city" static inline label="City" hide-label class="input" validatorType="notEmpty"></vicowa-input>
						</div>
						<div class="info">
							<vicowa-input id="province" static inline label="State" hide-label class="input" validatorType="notEmpty"></vicowa-input>
						</div>
						<div class="info">
							<vicowa-input id="country" static inline label="Country" hide-label class="input" validatorType="notEmpty"></vicowa-input>
						</div>
					</div>
				</div>
			</template>
		`;
	}
});
