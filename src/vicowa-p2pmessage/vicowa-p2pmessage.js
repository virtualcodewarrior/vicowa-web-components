import { webComponentBaseClass } from "../third_party/web-component-base-class/src/webComponentBaseClass.js";
import { WebRTCHandler } from "../utilities/webrtc.js";

const privateData = Symbol("privateData");

const componentName = "vicowa-p2pmessage";

function handleSignalingChange(p_Control) {

}

class VicowaP2PMessage extends webComponentBaseClass {
	static get is() { return componentName; }
	constructor() {
		super();
		this[privateData] = {
			webRTC: null,
		};
	}

	static get properties() {
		return {
			signalingServer: {
				type: String,
				value: "",
				reflect: true,
				observer: handleSignalingChange,
			},
		};
	}

	set setSignalingHandler(p_Handler) {
		this[privateData].webRTC = new WebRTCHandler(p_Handler);
	}

	detached() {
	}

	attached() {
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

window.customElements.define(componentName, VicowaP2PMessage);
