import { webComponentBaseClass } from '../third_party/web-component-base-class/src/webComponentBaseClass.js';

function headerChanged(p_PanelControl) {
	p_PanelControl.$.title = p_PanelControl.header;
}

const componentName = 'vicowa-panel';

/**
 * @extends webComponentBaseClass
 * @property {string} header The header text
 * @property {boolean} collapsible Indicates if the control is collapsible
 * @property {boolean} expanded Indicates if the panel is expanded
 * @property {string} expandControlAnimation Type of animation to use on the collapse control. Defaults to rotate
 */
class VicowaPanel extends webComponentBaseClass {
	static get is() { return componentName; }
	constructor() {
		super();
	}

	static get properties() {
		return {
			header: {
				type: String,
				value: '',
				reflectToAttribute: true,
				observer: headerChanged,
			},
			collapsible: {
				type: Boolean,
				value: false,
				reflectToAttribute: true,
			},
			expanded: {
				type: Boolean,
				value: true,
				reflectToAttribute: true,
			},
			expandControlAnimation: {
				type: String,
				value: 'rotate',
				reflectToAttribute: true,
			},
		};
	}

	attached() {
		this.addAutoEventListener(this.$.collapseControl, 'click', () => {
			this.expanded = !this.expanded;
		});
	}
}

window.customElements.define(componentName, VicowaPanel);
