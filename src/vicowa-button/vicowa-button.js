import { WebComponentBaseClass } from "/third_party/web-component-base-class/src/web-component-base-class.js";
import "../vicowa-icon/vicowa-icon.js";
import "../vicowa-string/vicowa-string.js";
import translator from "../utilities/translate.js";

/**
 * Class that represents the vicowa-button custom element
 * @extends WebComponentBaseClass
 * @property {string} string The text to be displayed on the button
 * @property {array} parameters Arguments that can be used in combination with the button text to do printf type insertions
 * @property {number} pluralNumber A number to indicate the number of items a string applies to. The translator will use this to determine if a plural form should be used
 * @property {string} icon The name of an icon to use with this button. This should be in the format <iconSet>:<iconName> e.g. general:file
 * @property {string} ariaLabel The name of the button, used for accessibility, if this is not set it will use any string set for the button
 * @property {string} tooltip A tooltip for the button
 */
class VicowaButton extends WebComponentBaseClass {
	#privateData;

	constructor() {
		super();
		this.#privateData = {
			activeTranslator: null,
		};
	}

	static get properties() {
		return {
			string: { type: String, value: "", observer: (inst) => { inst.$.string.string = inst.string; } },
			parameters: { type: Array, value: [], observer: (inst) => { inst.$.string.parameters = inst.parameters; } },
			pluralNumber: { type: Number, value: 1, observer: (inst) => { inst.$.string.pluralNumber = inst.pluralNumber; } },
			icon: { type: String, value: "", observer: (inst) => { inst.$.icon.icon = inst.icon; } },
			ariaLabel: { type: String, value: "", observer: (inst) => { inst.$.button.setAttribute("aria-label", inst.ariaLabel); } },
			disabled: { type: Boolean, value: false, reflectToAttribute: true },
			tooltip: { type: String, value: "", reflectToAttribute: true, observer: (inst) => { inst.$.button.setAttribute("title", inst.tooltip); inst.updateTranslation(); } },
		};
	}

	updateTranslation() {
		const controlData = this.#privateData;
		this.$.button.setAttribute("title", (controlData.activeTranslator && this.tooltip) ? controlData.activeTranslator.translate(this.tooltip).fetch() : this.tooltip);
	}

	attached() {
		this.$.string.onTranslationUpdated = (text) => {
			if (!this.ariaLabel) {
				this.$.button.setAttribute("aria-label", text);
			}
		};
		this.$.button.setAttribute("aria-label", this.$.string.displayString);

		translator.addTranslationUpdatedObserver((translatorInstance) => {
			this.#privateData.activeTranslator = translatorInstance;
			this.updateTranslation();
		}, this);
	}

	static get template() {
		return `
			<style>
				:host {
					position: relative;
					box-sizing: border-box;
					display: block;
					margin: 0;
					padding: 0;
					background: var(--vicowa-button-background, transparent);
					color: var(--vicowa-button-color);
					font: var(--vicowa-button-font);
					cursor: var(--vicowa-button-cursor);
					box-shadow: var(--vicowa-button-box-shadow);
				}
	
				:host(:hover) {
					background: var(--vicowa-button-background-hover, var(--vicowa-button-background));
					color: var(--vicowa-button-color-hover, var(--vicowa-button-color));
					font: var(--vicowa-button-font-hover, var(--vicowa-button-font));
					cursor: var(--vicowa-button-cursor-hover, var(--vicowa-button-cursor));
					box-shadow: var(--vicowa-button-box-shadow-hover, var(--vicowa-button-shadow));
					left: var(--vicowa-button-left-hover);
					top: var(--vicowa-button-top-hover);
				}
		
				:host(:active) {
					background: var(--vicowa-button-background-active, var(--vicowa-button-background));
					color: var(--vicowa-button-color-active, var(--vicowa-button-color));
					font: var(--vicowa-button-font-active, var(--vicowa-button-font));
					cursor: var(--vicowa-button-cursor-active, var(--vicowa-button-cursor));
					box-shadow: var(--vicowa-button-box-shadow-active, var(--vicowa-button-shadow));
					left: var(--vicowa-button-left-active);
					top: var(--vicowa-button-top-active);
					border: var(--vicowa-button-border, none);
				}
	
				button {
					width: 100%;
					box-sizing: border-box;
					position: relative;
					user-select: none;
					display: flex;
					flex-direction: row;
					align-content: stretch;
					align-items: center;
					border: none;
					background: transparent;
					color: inherit;
					font: inherit;
					cursor: inherit;
					outline: none;
				}
		
				#icon {
					position: relative;
					height: 24px;
					flex: 0 0 24px;
				}
		
				#icon[icon=""],
					#icon:not([icon]){
					flex: 0 0 var(--vicowa-button-min-icon-width, 0);
					max-width: 0;
				}
		
				:host([disabled]) {
					pointer-events: none;
					opacity: 0.5;
					cursor: default;
				}
		
				#container {
					display: flex;
					flex-direction: row;
					height: 100%;
				}
		
				vicowa-string {
					flex: 1 1 auto;
				}
		
			</style>
			<div id="container">
				<button id="button"><slot name="custom-content"></slot><vicowa-icon id="icon"></vicowa-icon><vicowa-string id="string"></vicowa-string></button>
			</div>`;
	}
}

window.customElements.define("vicowa-button", VicowaButton);
