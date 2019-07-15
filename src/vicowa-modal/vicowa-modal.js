import { webComponentBaseClass } from "../third_party/web-component-base-class/src/webComponentBaseClass.js";

const componentName = "vicowa-modal";

/**
 * Class to represent the vicowa-icon custom element
 * @extends webComponentBaseClass
 * @property {boolean} open Set to true to open the modal or false the close it
 */
class VicowaModal extends webComponentBaseClass {
	static get is() { return componentName; }
	constructor() {
		super();
		this._activeTranslator = null;
	}

	static get properties() {
		return {
			open: {
				type: Boolean,
				reflectToAttribute: true,
				value: false,
			},
			outsideCloses: {
				type: Boolean,
				reflectToAttribute: true,
				value: false,
			},
		};
	}

	attached() {
		this.addAutoEventListener(this, "click", () => {
			if (this.outsideCloses) {
				this.open = false;
			}
		});
		this.addAutoEventListener(this.$.modalBox, "click", (p_Event) => {
			p_Event.cancelBubble = true;
		});
	}

	static get template() {
		return `
			<template id="vicowa-modal">
				<style>
					:host {
						position: fixed;
						left: 0;
						top: 0;
						right: 0;
						bottom: 0;
						display: none;
						align-items: center;
						justify-content: center;
						z-index: 10000;
					}
			
					.background {
						position: absolute;
						left: 0;
						top: 0;
						right: 0;
						bottom: 0;
						background: black;
						opacity: 0.7;
					}

					:host([open]) {
						display: flex;
					}
			
					#modal-box {
						background: white;
						border: 1px solid grey;
						box-shadow: 5px 5px 15px black;
						min-width: 1em;
						min-height: 1em;
						z-index: 1;
					}
				</style>
				<div class="background"></div>
				<div id="modal-box">
					<slot name="content"></slot>
				</div>
			</template>
		`;
	}
}

window.customElements.define(componentName, VicowaModal);
