import { webComponentBaseClass } from "../third_party/web-component-base-class/src/webComponentBaseClass.js";
import "../vicowa-string/vicowa-string.js";
import "../vicowa-button/vicowa-button.js";
import { DEFAULT_LEVELS } from "./vicowa-notify-box.js";

export const DEFAULT_LOCATIONS = Object.freeze({
	START: "START",
	CENTER: "CENTER",
	END: "END",
});

function doMessage(control, properties, level) {
	if (typeof properties === "string") {
		properties = { message: properties };
	}

	properties = { ...{ level }, ...properties };

	const newNotification = document.createElement("vicowa-notify-box");
	newNotification.message = properties.message;
	newNotification.level = properties.level;
	newNotification.duration = properties.duration;

	control.$.container.insertBefore(newNotification, control.$.container.firstChild);
}

function handleLocation(control) {
	if (control.alignControl instanceof HTMLElement) {
		const rect = control.alignControl.getBoundingClientRect();
		control.$.container.style.left = `${rect.left}px`;
		control.$.container.style.top = `${rect.top + rect.height}px`;
		control.$.container.style.position = "absolute";
	} else {
		control.$.container.style.left = "";
		control.$.container.style.top = "";
		control.$.container.style.position = "relative";
		if (!Object.values(DEFAULT_LOCATIONS).includes(control.locationX)) {
			control.$.container.style.left = `${control.locationX}px`;
			control.$.container.style.position = "absolute";
		} if (!Object.values(DEFAULT_LOCATIONS).includes(control.locationY)) {
			control.$.container.style.top = `${control.locationY}px`;
			control.$.container.style.position = "absolute";
		}
	}
}

const customElementName = "vicowa-notify";
window.customElements.define(customElementName, class extends webComponentBaseClass {
	static get is() { return customElementName; }

	constructor() {
		super();
	}

	// add properties to this web component
	static get properties() {
		return {
			locationX: { type: String, value: DEFAULT_LOCATIONS.CENTER, reflectToAttribute: true, observer: handleLocation },
			locationY: { type: String, value: DEFAULT_LOCATIONS.END, reflectToAttribute: true, observer: handleLocation },
			alignControl: { type: Object, value: undefined, reflectToAttribute: false, observer: handleLocation },
		};
	}

	info(properties) { doMessage(this, { duration: 2000, ...(typeof properties === "string" ? { message: properties } : properties) }, DEFAULT_LEVELS.INFO); }
	warning(properties) { doMessage(this, { duration: 3500, ...(typeof properties === "string" ? { message: properties } : properties) }, DEFAULT_LEVELS.WARNING); }
	error(properties) { doMessage(this, { duration: 5000, ...(typeof properties === "string" ? { message: properties } : properties) }, DEFAULT_LEVELS.ERROR); }

	// string representation of the template to use with this web component
	static get template() {
		return `
            <style>
                #main-box {
                	display: flex;
                	position: fixed;
                	z-index: var(--vicowa-notify-z-index, 1000);
                	left: 0;
                	top: 0;
                	bottom: 0;
                	right: 0;
                	padding: var(--vicowa-notify-padding, 1em);
                	pointer-events: none;
                }

                #container {
                	display: flex;
                	flex-direction: column;
                	align-items: center;
                }
                
				:host([location-X="BEGIN"]) #main-box { justify-content: flex-start; }
				:host([location-X="CENTER"]) #main-box { justify-content: center; }
				:host([location-X="END"]) #main-box { justify-content: flex-end; }
				:host([location-Y="BEGIN"]) #main-box { align-items: flex-start; }
				:host([location-Y="CENTER"]) #main-box { align-items: center; }
				:host([location-Y="END"]) #main-box { align-items: flex-end; }
                
            </style>
            <div id="main-box">
            	<div id="container">
            </div>
			</div>
        `;
	}
});
