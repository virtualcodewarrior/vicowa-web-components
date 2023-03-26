import { WebComponentBaseClass } from '/third_party/web-component-base-class/src/web-component-base-class.js';
import '../vicowa-string/vicowa-string.js';
import '../vicowa-button/vicowa-button.js';
import { DEFAULT_LEVELS } from './vicowa-notify-box.js';

export const DEFAULT_LOCATIONS = Object.freeze({
	START: 'START',
	CENTER: 'CENTER',
	END: 'END',
});

class VicowaNotify extends WebComponentBaseClass {
	constructor() {
		super();
	}

	// add properties to this web component
	static get properties() {
		return {
			locationX: { type: String, value: DEFAULT_LOCATIONS.CENTER, reflectToAttribute: true, observer: (control) => control.#handleLocation() },
			locationY: { type: String, value: DEFAULT_LOCATIONS.END, reflectToAttribute: true, observer: (control) => control.#handleLocation() },
			alignControl: { type: Object, value: undefined, reflectToAttribute: false, observer: (control) => control.#handleLocation() },
		};
	}

	info(properties) { this.#doMessage({ duration: 2000, ...(typeof properties === 'string' ? { message: properties } : properties) }, DEFAULT_LEVELS.INFO); }
	warning(properties) { this.#doMessage({ duration: 3500, ...(typeof properties === 'string' ? { message: properties } : properties) }, DEFAULT_LEVELS.WARNING); }
	error(properties) { this.#doMessage({ duration: 5000, ...(typeof properties === 'string' ? { message: properties } : properties) }, DEFAULT_LEVELS.ERROR); }

	#doMessage(properties, level) {
		if (typeof properties === 'string') {
			properties = { message: properties };
		}

		properties = { ...{ level }, ...properties };

		const newNotification = document.createElement('vicowa-notify-box');
		newNotification.message = properties.message;
		newNotification.level = properties.level;
		newNotification.duration = properties.duration;

		this.$.container.insertBefore(newNotification, this.$.container.firstChild);
	}

	#handleLocation() {
		if (this.alignControl instanceof HTMLElement) {
			const rect = this.alignControl.getBoundingClientRect();
			this.$.container.style.left = `${rect.left}px`;
			this.$.container.style.top = `${rect.top + rect.height}px`;
			this.$.container.style.position = 'absolute';
		} else {
			this.$.container.style.left = '';
			this.$.container.style.top = '';
			this.$.container.style.position = 'relative';
			if (!Object.values(DEFAULT_LOCATIONS).includes(this.locationX)) {
				this.$.container.style.left = `${this.locationX}px`;
				this.$.container.style.position = 'absolute';
			} if (!Object.values(DEFAULT_LOCATIONS).includes(this.locationY)) {
				this.$.container.style.top = `${this.locationY}px`;
				this.$.container.style.position = 'absolute';
			}
		}
	}

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
}

window.customElements.define('vicowa-notify', VicowaNotify);
