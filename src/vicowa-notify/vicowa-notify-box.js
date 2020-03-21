import { webComponentBaseClass } from "../third_party/web-component-base-class/src/webComponentBaseClass.js";
import { DEFAULT_LEVELS } from "src/vicowa-notify/vicowa-notify.js";

const privateData = Symbol("privateData");

function closeBox(control) {
	const controlData = control[privateData];

	control.$.box.classList.add("closing");
}

const customElementName = "vicowa-notify-box";
window.customElements.define(customElementName, class extends webComponentBaseClass {
	static get is() { return customElementName; }

	constructor() {
		super();

		this[privateData] = {
			timeoutId: undefined,
		};
		// extra required initialization goes here ...
	}

	// add properties to this web component
	static get properties() {
		return {
			message: {
				type: String,
				value: "",
				reflectToAttribute: true,
				notify: (control) => { control.$.message.innerHTML = control.message; },
			},
			level: {
				type: String,
				value: DEFAULT_LEVELS.INFO,
				reflectToAttribute: true,
			},
			duration: {
				type: Number,
				value: 2000,
				reflectToAttribute: true,
			},
			/*
			 propertyName: { // the name of the property
			 type: String, // (required) the type of the property, one of Array, Boolean, Number, Object, String
			 value: 'value', // (optional) default value for the property
			 reflectToAttribute: true, // (optional) indicate if you want the component attribute to always reflect the current property value
			 observer: changeHandlerKey, // (optional) the name or a symbol for a function in the class to be called when the value of the property is changed
			 },
			 // add as many properties as you need ... */
		};
	}

	// optional callback function that will be called after this instance of the web component
	// has been added to the DOM
	attached() {
		this.$.message = this.message;
		const controlData = this[privateData];
		controlData.timeoutId = setTimeout(() => {
			closeBox(this);
		}, this.duration);

		this.addAutoEventListener(this.$.close, "click", () => closeBox(this));
	}

	// optional callback function that will be called after this instance of the web component has been removed from the DOM
	detached() {
		// extra cleanup that only can be done after an instance of the class has been removed from the DOM
	}

	// string representation of the template to use with this web component
	static get template() {
		return `
            <style>
                #box {
                	transition: opacity 1000ms;
                }
                #box.closing {
                	opacity: 0;
                }
                #box.level-info {
                	background: black;
                	color: white;
                }
                #box.level-warning {
                	background: yellow;
                }
                #box.level-error {
                	background: red;
                	color: white;
                }
            </style>
            <div id="box">
            	<slot id="content">
            		<vicowa-string id="message"></vicowa-string><button id="close">x</button>
				</slot>
			</div>
        `;
	}
});
