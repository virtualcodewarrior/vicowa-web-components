import { webComponentBaseClass } from '../third_party/web-component-base-class/dist/webComponentBaseClass.js';

const componentName = 'vicowa-icon';
window.customElements.define(componentName, class extends webComponentBaseClass {
	static get is() { return componentName; }
	constructor() {
		super();
		this._activeTranslator = null;
	}

	static get properties() {
		return {
			icon: {
				type: String,
				reflectToAttribute: true,
				value: '',
				observer: '_iconChanged',
			},
		};
	}

	_iconChanged() {
		const icon = this.$.iconSource.constructor.getIcon(this.icon);
		this.$.iconContainer.innerHTML = '';
		if (icon) {
			this.$.iconContainer.appendChild(icon.cloneNode(true));
		}
	}
});
