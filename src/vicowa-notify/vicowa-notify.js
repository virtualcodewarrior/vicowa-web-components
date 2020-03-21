import { webComponentBaseClass } from "../third_party/web-component-base-class/src/webComponentBaseClass.js";
import "../vicowa-string/vicowa-string.js";
import "../vicowa-button/vicowa-button.js";

const privateData = Symbol("privateData");

export const DEFAULT_LEVELS = Object.freeze({
	INFO: "INFO",
	WARNING: "WARNING",
	ERROR: "ERROR",
});

export const DEFAULT_LOCATIONS = Object.freeze({
	START: "START",
	CENTER: "CENTER",
	END: "END",
});

function doMessage(control, properties, level) {
	const controlData = control[privateData];
	if (typeof properties === "string") {
		properties = { message: properties };
	}

	properties = { ...{ level, locationX: control.LocationX, locationY: control.locationY, duration: control.duration }, ...properties };

	const message = {

	};
	controlData.notifications.push(message);
}

const customElementName = "vicowa-notify";
window.customElements.define(customElementName, class extends webComponentBaseClass {
	static get is() { return customElementName; }

	constructor() {
		super();
		// extra required initialization goes here ...

		this[privateData] = {
			notifications: [],
		};
	}

	// add properties to this web component
	static get properties() {
		return {
			duration: {
				type: Number,
				value: 5000,
				reflectToAttribute: true,
			},
			locationX: {
				type: String,
				value: DEFAULT_LOCATIONS.CENTER,
				refelectToAttribute: true,
			},
			locationY: {
				type: String,
				value: DEFAULT_LOCATIONS.END,
				reflectToAttribute: true,
			},
		};
	}

	info(properties) { doMessage(this, properties, DEFAULT_LEVELS.INFO); }
	warning(properties) { doMessage(this, properties, DEFAULT_LEVELS.WARNING); }
	error(properties) { doMessage(this, properties, DEFAULT_LEVELS.ERROR); }

	// optional callback function that will be called after this instance of the web component
	// has been added to the DOM
	attached() {
		// extra initialization that only can be done after an instance of the class has been attached to the DOM
	}

	// optional callback function that will be called after this instance of the web component has been removed from the DOM
	detached() {
		// extra cleanup that only can be done after an instance of the class has been removed from the DOM
	}

	// string representation of the template to use with this web component
	static get template() {
		return `
            <style>
                #container {
                	display: block;
                	position: fixed;
                }
                
            </style>
            <div id="container">
            	<slot id="custom-message">
            		<vicowa-string id="message"></vicowa-string>
            	</slot>
            	<vicowa-button id="close">X</vicowa-button>
			</div>
        `;
	}
});
