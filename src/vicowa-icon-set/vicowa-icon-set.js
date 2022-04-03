import { WebComponentBaseClass } from "/third_party/web-component-base-class/src/web-component-base-class.js";

// all icon sets will go here, there should be only one instance in the current web page
const iconSets = {};
const callbacks = {};

/**
 * Class that represents the vicowa-icon-set custom element
 * @extends WebComponentBaseClass
 * @property {string} name The name of this icon set
 */
class VicowaIconSet extends WebComponentBaseClass {
	constructor() {
		super();
	}

	static get properties() {
		return {
			name: {
				type: String,
				value: "",
				reflectToAttribute: true,
			},
		};
	}

	attached() {
		const activeSet = iconSets[this.name] = iconSets[this.name] || {};
		const childNodes = Array.from(this.$.icons.assignedNodes());
		Array.from(childNodes).forEach((childNode) => {
			Array.from(childNode.querySelectorAll("defs > g[id]")).forEach((svgElement) => {
				activeSet[svgElement.id] = svgElement;
			});
		});
		const activeSetCallbacks = callbacks[this.name];
		if (activeSetCallbacks) {
			Object.keys(activeSetCallbacks).forEach((key) => {
				if (activeSet[key] && activeSetCallbacks[key]) {
					activeSetCallbacks[key].forEach((callbackInfo) => {
						callbackInfo.callback(activeSet[key]);
					});
				}
			});
		}
	}

	/**
	 * Retrieve an icon from the given icon set
	 * @param {object} callbackOwner The owner of the callback
	 * @param {string} name Name of the icon, should be in the format namespace:iconName
	 * @param {function} callback Function that will be called when the icon is found or changes
	 */
	static getIcon(callbackOwner, name, callback) {
		const parts = name ? name.trim().split(":") : [];

		if (parts.length > 1) {
			const iconInfo = { group: parts[0], name: parts[1] };
			callbacks[iconInfo.group] = callbacks[iconInfo.group] || {};
			const callbacksByName = callbacks[iconInfo.group][iconInfo.name] = callbacks[iconInfo.group][iconInfo.name] || [];
			if (!callbacksByName.find((callbackInfo) => callbackInfo.owner === callbackOwner && callbackInfo.callback === callback)) {
				callbacksByName.push({ owner: callbackOwner, callback });
			}
			if ((iconSets[iconInfo.group])) {
				callback(iconSets[iconInfo.group][iconInfo.name]);
			}
		} else if (name) {
			throw new Error("icon names should have the format group:name");
		}
	}

	static removeCallback(callbackOwner) {
		Object.keys(callbacks).forEach((groupKey) => {
			const group = callbacks[groupKey];
			Object.keys(group).forEach((nameKey) => {
				group[nameKey] = group[nameKey].filter((callbackInfo) => callbackInfo.owner === callbackOwner);
			});
		});
	}

	static get template() {
		return `
			<style>
				:host {
					display: none;
				}
			</style>
			<slot id="icons" name="icons"></slot>
		`;
	}
}

window.customElements.define("vicowa-icon-set", VicowaIconSet);
