import { webComponentBaseClass } from '../third_party/web-component-base-class/dist/webComponentBaseClass.js';

const componentName = 'vicowa-icon';

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
				value: '',
				observer: '_iconChanged',
			},
		};
	}

	_iconChanged() {
		this.$.iconContainer.innerHTML = '';
		this.$.iconSource.constructor.getIcon(this, this.icon, (p_Icon) => {
			this.$.iconContainer.innerHTML = '';
			if (p_Icon) {
				this.$.iconContainer.appendChild(p_Icon.cloneNode(true));
			}
		});
	}

	detached() {
		this.$.iconSource.constructor.removeCallback(this);
	}
}

window.customElements.define(componentName, VicowaIcon);
