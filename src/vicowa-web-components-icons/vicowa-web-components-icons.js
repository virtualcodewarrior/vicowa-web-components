import { webComponentBaseClass } from "../third_party/web-component-base-class/src/webComponentBaseClass.js";

const componentName = "vicowa-web-components-icons";

class VicowaWebComponentsIcons extends webComponentBaseClass {
	static get is() { return componentName; }
	constructor() { super(); }

	static get template() {
		return `
			<vicowa-icon-set name="vicowa">
				<svg slot="icons">
					<defs>
						<g id="drop"><g transform="scale(4) translate(0,-290.64998)"><path d="m 3.1655506,291.07048 v 3.78566" style="stroke-width:0.26458332px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"/><path d="m 4.7601377,293.03123 -1.5945871,1.82491 -1.5827753,-1.82491" style="stroke-width:0.26458335px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" /><path d="M 1.5827753,295.80699 H 4.7601377" style="stroke-width:0.26458335px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" /></g></g>
						<g id="upload"><g transform="scale(4) translate(0,-290.64998)"><path d="m 3.1770426,295.05762 0,-3.78566" style="fill:none;stroke:#000000;stroke-width:0.26458332px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" /><path d="m 1.5824555,293.09687 1.5945871,-1.82491 1.5827753,1.82491" style="fill:none;stroke:#000000;stroke-width:0.26458335px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" /><path d="M 5.8113839,296.32671 H 0.51971726 v -1.18118 H 1.5827753 l 0.531529,0.53153 h 2.1143043 l 0.5315291,-0.53153 h 1.0512462 z" style="fill:none;stroke:#000000;stroke-width:0.26458335px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" /><path d="m 0.49955335,295.0712 0.53152905,-1.05124 h 0.8031994 l 0.2598586,0.35435 h 0.6453723" style="fill:none;stroke:#000000;stroke-width:0.26458335px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" /><path d="M 5.821689,295.07295 5.2901599,294.02171 H 4.4869605 l -0.2598586,0.35435 H 3.5817296" style="fill:none;stroke:#000000;stroke-width:0.26458335px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" /></g></g>
					</defs>
				</svg>
			</vicowa-icon-set>
	}
}

window.customElements.define(componentName, VicowaWebComponentsIcons);
