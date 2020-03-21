import { webComponentBaseClass } from "../third_party/web-component-base-class/src/webComponentBaseClass.js";

export const DEFAULT_LEVELS = Object.freeze({
	INFO: "INFO",
	WARNING: "WARNING",
	ERROR: "ERROR",
});

const privateData = Symbol("privateData");

function closeBox(control) {
	control.$.box.classList.add("closing");
	clearTimeout(control[privateData].timeoutId);
	control[privateData].timeoutId = undefined;
}
function setMessage(control) { control.$.message.string = control.message; }
function setLevel(control) {
	Object.values(DEFAULT_LEVELS).filter((level) => level !== control.level).forEach((level) => control.$.box.classList.remove(`level-${level.toLowerCase()}`));
	control.$.box.classList.add(`level-${control.level.toLowerCase()}`);
}

const customElementName = "vicowa-notify-box";
window.customElements.define(customElementName, class extends webComponentBaseClass {
	static get is() { return customElementName; }

	constructor() {
		super();
		this[privateData] = { timeoutId: undefined };
	}

	static get properties() {
		return {
			message: { type: String, value: "", reflectToAttribute: true, notify: (control) => { setMessage(control); } },
			level: { type: String, value: DEFAULT_LEVELS.INFO, reflectToAttribute: true, notify: (control) => { setLevel(control); } },
			duration: { type: Number, value: 2000, reflectToAttribute: true },
		};
	}

	attached() {
		const controlData = this[privateData];
		setMessage(this);
		setLevel(this);
		controlData.timeoutId = setTimeout(() => closeBox(this), this.duration);

		this.addAutoEventListener(this.$.close, "click", () => closeBox(this));
		this.addAutoEventListener(this.$.box, "transitionend", () => {
			if (this.$.box.classList.contains("closing") && !this.$.box.classList.contains("collapsing")) {
				this.$.box.classList.add("collapsing");
			} else if (this.$.box.classList.contains("closing") && this.$.box.classList.contains("collapsing")) {
				this.parentElement.removeChild(this);
			}
		});
	}

	detached() { closeBox(this); }

	static get template() {
		return `
            <style>
                #box {
                	box-sizing: border-box;
                	margin: 0.3em 0;
                	padding: 0.2em 1em;
                	transition-property: opacity;
                	transition-duration:  1000ms;
                	max-height: var(--vicowa-notify-max-height, 30px);
                	display: flex;
                	align-content: space-between;
                	border-radius: var(--vicowa-notify-border-radius, .3em);
                	border-width: var(--vicowa-notify-border-width, 2px);
                	border-style: var(--vicowa-notify-border-style: solid);
                }
                
                #box > div {
	                flex: 1 1 auto;
	                padding: 2px 1em;
	                display: flex;
	                justify-content: center;
	                align-items: center;
                }
                
                #box.closing {
                	opacity: 0;
                }
                #box.collapsing {
                	transition-property: max-height, margin, border-width;
                	transition-duration:  500ms;
                	transition-timing-function: ease-out;
                	max-height: 0;
                	margin: 0;
                	border-width: 0;
                }
                #close {
                	background: var(--vicowa-notify-close-button-background, transparent);
                	border: var(--vicowa-notify-close-button-border, none);
                	font-weight: var(--vicowa-notify-close-button-font-weight, bold);
                	pointer-events: all;
                }
                #box.level-info {
                	background: var(--vicowa-notify-info-background, black);
                	color: var(--vicowa-notify-info-color, white);
                	border-color: var(--vicowa-notify-info-border-color, white);
                }
                #box.level-info #close {
                	color: var(--vicowa-notify-info-close-button-color, white);
                }
                #box.level-warning {
                	background: var(--vicowa-notify-warning-background, yellow);
                	color: var(--vicowa-notify-warning-color, black);
                	border-color: var(--vicowa-notify-warning-border-color, black);
                }
                #box.level-warning #close {
                	color: var(--vicowa-notify-warning-close-button-color, black);
                }
                #box.level-error {
                	background: var(--vicowa-notify-error-background, red);
                	color: var(--vicowa-notify-error-color, white);
                	border-color: var(--vicowa-notify-error-border-color, white);
                }
                #box.level-error #close {
                	color: var(--vicowa-notify-error-close-button-color, white);
                }
            </style>
            <div id="box">
          		<div><vicowa-string id="message"></vicowa-string></div><button id="close">x</button>
			</div>
        `;
	}
});
