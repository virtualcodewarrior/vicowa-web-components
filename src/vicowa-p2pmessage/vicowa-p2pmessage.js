/* eslint-disable */
// disable eslint while this code is not done
import { WebComponentBaseClass } from "/third_party/web-component-base-class/src/web-component-base-class.js";
import { WebRTCHandler } from "../utilities/webrtc.js";

class VicowaP2PMessage extends WebComponentBaseClass {
	#privateData;
	constructor() {
		super();
		this.#privateData = {
			webRTC: null,
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

	set setSignalingHandler(handler) {
		this.#privateData.webRTC = new WebRTCHandler(handler);
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
			<div id="message-output"></div>
			<div id="message-input"></div>
			<slot name="incoming-template"></slot>
			<slot name="outgoing-template"></slot>
		`;
	}
}

window.customElements.define("vicowa-p2pmessage", VicowaP2PMessage);
