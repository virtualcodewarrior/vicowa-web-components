/* eslint-disable */
// disable eslint while this code is not done
import { WebComponentBaseClass } from "/third_party/web-component-base-class/src/web-component-base-class.js";

class VicowaP2pfiletransfer extends WebComponentBaseClass {
	#privateData;
	constructor() {
		super();
		this.#privateData = {
		};
	}

	static get properties() {
		return {
			signalingServer: {
				type: String,
				value: "",
				reflectToAttribute: true,
				observer: (control) => control.#handleSignalingChange(),
			},
		};
	}

	detached() {
	}

	attached() {
	}

	#handleSignalingChange() {

	}

	static get template() {
		return `
			<style>
			</style>
			<span id="string"></span>
		`;
	}
}

window.customElements.define("vicowa-p2pfiletransfer", VicowaP2pfiletransfer);
