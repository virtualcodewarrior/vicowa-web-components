import { webComponentBaseClass } from "../../../src/third_party/web-component-base-class/src/webComponentBaseClass.js";

function testValueChanged(p_Control) {
	p_Control.$.value.textContent = p_Control.testValue;
}

// note that this is in a separate javascript file only because the polyfill doesn't support inline module scripts, so you could move it into the html if you no longer use the polyfill
const webComponentName = "content-test1";
window.customElements.define(webComponentName, class extends webComponentBaseClass {
	static get is() { return webComponentName; }
	constructor() { super(); }
	static get properties() {
		return {
			testValue: {
				type: String,
				value: "",
				observer: testValueChanged,
			},
		};
	}

	attached() {
		this.$.value.textContent = this.testValue;
	}
});
