import { webComponentBaseClass } from "../third_party/web-component-base-class/src/webComponentBaseClass.js";

// all icon sets will go here, there should be only one instance in the current web page
const iconSets = {};
const callbacks = {};

const componentName = "vicowa-icon-set";

/**
 * Class that represents the vicowa-icon-set custom element
 * @extends webComponentBaseClass
 * @property {string} name The name of this icon set
 */
class VicowaIconSet extends webComponentBaseClass {
	static get is() { return componentName; }
	constructor() {
		super();
	}

	static get properties() {
		return {
			name: {
				type: String,
				value: "",
				reflect: true,
			},
		};
	}

	attached() {
		const activeSet = iconSets[this.name] = iconSets[this.name] || {};
		const childNodes = Array.from(this.$.icons.assignedNodes());
		Array.from(childNodes).forEach((p_ChildNode) => {
			Array.from(p_ChildNode.querySelectorAll("defs > g[id]")).forEach((p_SVGElement) => {
				activeSet[p_SVGElement.id] = p_SVGElement;
			});
		});
		const activeSetCallbacks = callbacks[this.name];
		if (activeSetCallbacks) {
			Object.keys(activeSetCallbacks).forEach((p_Key) => {
				if (activeSet[p_Key] && activeSetCallbacks[p_Key]) {
					activeSetCallbacks[p_Key].forEach((p_CallbackInfo) => {
						p_CallbackInfo.callback(activeSet[p_Key]);
					});
				}
			});
		}
	}

	/**
	 * Retrieve an icon from the given icon set
	 * @param {object} p_CallbackOwner The owner of the callback
	 * @param {string} p_Name Name of the icon, should be in the format namespace:iconName
	 * @param {function} p_Callback Function that will be called when the icon is found or changes
	 */
	static getIcon(p_CallbackOwner, p_Name, p_Callback) {
		const parts = p_Name ? p_Name.trim().split(":") : [];

		if (parts.length > 1) {
			const iconInfo = { group: parts[0], name: parts[1] };
			callbacks[iconInfo.group] = callbacks[iconInfo.group] || {};
			const callbacksByName = callbacks[iconInfo.group][iconInfo.name] = callbacks[iconInfo.group][iconInfo.name] || [];
			if (!callbacksByName.find((p_CallbackInfo) => p_CallbackInfo.owner === p_CallbackOwner && p_CallbackInfo.callback === p_Callback)) {
				callbacksByName.push({ owner: p_CallbackOwner, callback: p_Callback });
			}
			if ((iconSets[iconInfo.group])) {
				p_Callback(iconSets[iconInfo.group][iconInfo.name]);
			}
		} else if (p_Name) {
			throw new Error("icon names should have the format group:name");
		}
	}

	static removeCallback(p_CallbackOwner) {
		Object.keys(callbacks).forEach((p_GroupKey) => {
			const group = callbacks[p_GroupKey];
			Object.keys(group).forEach((p_NameKey) => {
				group[p_NameKey] = group[p_NameKey].filter((p_CallbackInfo) => p_CallbackInfo.owner === p_CallbackOwner);
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

window.customElements.define(componentName, VicowaIconSet);
