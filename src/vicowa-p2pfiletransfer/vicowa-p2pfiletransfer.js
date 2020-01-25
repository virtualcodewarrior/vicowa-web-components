import { webComponentBaseClass } from "../third_party/web-component-base-class/src/webComponentBaseClass.js";
import translator from "../utilities/translate.js";

const privateData = Symbol("privateData");

const componentName = "vicowa-p2pfiletransfer";

function handleSignalingChange(p_Control) {

}

class VicowaP2pfiletransfer extends webComponentBaseClass {
	static get is() { return componentName; }
	constructor() {
		super();
		this[privateData] = {
		};
	}

	static get properties() {
		return {
			signalingServer: {
				type: String,
				value: "",
				reflectToAttribute: true,
				observer: handleSignalingChange,
			},
		};
	}

	detached() {
	}

	attached() {
	}

	static get template() {
		return `
			<style>
			</style>
			<span id="string"></span>
		`;
	}
}

window.customElements.define(componentName, VicowaP2pfiletransfer);
