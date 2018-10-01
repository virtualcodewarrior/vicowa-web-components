import { webComponentBaseClass } from "../third_party/web-component-base-class/src/webComponentBaseClass.js";

const componentName = "vicowa-web-components-icons";

class VicowaWebComponentsIcons extends webComponentBaseClass {
	static get is() { return componentName; }
	constructor() { super(); }
}

window.customElements.define(componentName, VicowaWebComponentsIcons);
