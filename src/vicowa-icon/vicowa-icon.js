import { WebComponentBaseClass } from "/third_party/web-component-base-class/src/web-component-base-class.js";
import "../vicowa-icon-set/vicowa-icon-set.js";

/**
 * Class to represent the vicowa-icon custom element
 * @extends WebComponentBaseClass
 * @property {string} icon Name of the icon to use this should be in the form <iconSet>:<iconName> (e.g general:file)
 */
class VicowaIcon extends WebComponentBaseClass {
	#activeTranslator;
	constructor() {
		super();
		this.#activeTranslator = null;
	}

	static get properties() {
		return {
			icon: {
				type: String,
				reflectToAttribute: true,
				value: "",
				observer: (control) => control.#iconChanged(),
			},
		};
	}

	detached() {
		this.$.iconSource.constructor.removeCallback(this);
	}

	#iconChanged() {
		this.$.iconContainer.innerHTML = "";
		this.$.iconSource.onAttached = () => {
			this.$.iconSource.constructor.getIcon(this, this.icon, (icon) => {
				this.$.iconContainer.innerHTML = "";
				if (icon) {
					this.$.iconContainer.appendChild(icon.cloneNode(true));
				}
			});
		};
	}

	static get template() {
		return `
			<vicowa-icon-set id="icon-source"></vicowa-icon-set>
			<style>
				/* these styles make the icon fit to its container */
				:host {
					position: relative;
					display: block;
					margin: 0;
					padding: 0;
					box-sizing: border-box;
					width: 100%;
					height: 100%;
				}
		
				svg {
					width: 100%;
					height: 100%;
				}
		
				/* these styles allow you to change the icon color if they are not explicitly specified in the icon itself */
				#icon-container {
					stroke: var(--vicowa-icon-line-color, black);
					fill: var(--vicowa-icon-fill-color, none);
				}
				</style>
			<svg id="icon-container" viewBox="0 0 24 24"></svg>
		`;
	}
}

window.customElements.define("vicowa-icon", VicowaIcon);
