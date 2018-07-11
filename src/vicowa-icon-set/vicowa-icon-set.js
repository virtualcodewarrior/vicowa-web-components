import { webComponentBaseClass } from '../third_party/web-component-base-class/dist/webComponentBaseClass.js';

// all icon sets will go here, there should be only one instance in the current web page
const iconSets = {};

const componentName = 'vicowa-icon-set';
window.customElements.define(componentName, class extends webComponentBaseClass {
	static get is() { return componentName; }
	constructor() {
		super();
	}

	static get properties() {
		return {
			name: {
				type: String,
				value: '',
				reflectToAttribute: true,
			},
		};
	}

	attached() {
		const activeSet = iconSets[this.name] = iconSets[this.name] || {};
		const childNodes = Array.from(this.$.icons.assignedNodes());
		Array.from(childNodes).forEach((p_ChildNode) => {
			Array.from(p_ChildNode.querySelectorAll('defs > g[id]')).forEach((p_SVGElement) => {
				activeSet[p_SVGElement.id] = p_SVGElement;
			});
		});
	}

	/**
	 * Retrieve an icon from the given icon set
	 * @param {string} p_Name Name of the icon, should be in the format namespace:iconName
	 * @returns {SVGElement|null} the icon or null if the icon or the set does not exist
	 */
	static getIcon(p_Name) {
		const parts = p_Name ? p_Name.split(':') : [];
		return (parts.length > 1) ? ((iconSets[parts[0]]) ? iconSets[parts[0]][parts[1]] : null) : null;
	}
});
