import { webComponentBaseClass } from '../third_party/web-component-base-class/dist/webComponentBaseClass.js';

const componentName = 'vicowa-modal';

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
		this.addAutoEventListener(this, 'click', () => {
			if (this.outsideCloses) {
				this.open = false;
			}
		});
		this.addAutoEventListener(this.$.modalBox, 'click', (p_Event) => {
			p_Event.cancelBubble = true;
		});
	}
}

window.customElements.define(componentName, VicowaModal);
