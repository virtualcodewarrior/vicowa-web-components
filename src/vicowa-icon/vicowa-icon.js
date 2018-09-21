import { webComponentBaseClass } from "../third_party/web-component-base-class/src/webComponentBaseClass.js";

const componentName = "vicowa-icon";

function iconChanged(p_IconControl) {
	p_IconControl.$.iconContainer.innerHTML = "";
	p_IconControl.$.iconSource.constructor.getIcon(p_IconControl, p_IconControl.icon, (p_Icon) => {
		p_IconControl.$.iconContainer.innerHTML = "";
		if (p_Icon) {
			p_IconControl.$.iconContainer.appendChild(p_Icon.cloneNode(true));
		}
	});
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
}

window.customElements.define(componentName, VicowaIcon);
