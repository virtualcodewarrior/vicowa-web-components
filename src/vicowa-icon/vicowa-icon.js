import { webComponentBaseClass } from "../third_party/web-component-base-class/src/webComponentBaseClass.js";
import "../vicowa-icon-set/vicowa-icon-set.js";

const componentName = "vicowa-icon";

function iconChanged(p_IconControl) {
	p_IconControl.$.iconContainer.innerHTML = "";
	p_IconControl.$.iconSource.onAttached = () => {
		p_IconControl.$.iconSource.constructor.getIcon(p_IconControl, p_IconControl.icon, (p_Icon) => {
			p_IconControl.$.iconContainer.innerHTML = "";
			if (p_Icon) {
				p_IconControl.$.iconContainer.appendChild(p_Icon.cloneNode(true));
			}
		});
	};
}

/**
 * Class to represent the vicowa-icon custom element
 * @extends webComponentBaseClass
 * @property {string} icon Name of the icon to use this should be in the form <iconSet>:<iconName> (e.g general:file)
 */
class VicowaIcon extends webComponentBaseClass {
	static get is() { return componentName; }
	constructor() {
		super();
		this._activeTranslator = null;
	}

	static get properties() {
		return {
			icon: {
				type: String,
				reflectToAttribute: true,
				value: "",
				observer: iconChanged,
			},
		};
	}

	detached() {
		this.$.iconSource.constructor.removeCallback(this);
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

window.customElements.define(componentName, VicowaIcon);
