import { webComponentBaseClass } from '../third_party/web-component-base-class/dist/webComponentBaseClass.js';

const componentName = 'vicowa-data-grid';

function updateData(p_Control) {
	p_Control._dataInfo = p_Control.data.map((p_Data) => ((Array.isArray(p_Data)) ? p_Data.map((p_SubData) => ({ value: p_SubData })) : [{ value: p_Data }]));
	p_Control._dataInfo.forEach((p_Data) => {
		const div = document.createElement('div');
		p_Control.$.rows.appendChild(div);
		p_Data.forEach((p_Cell) => {
			const cell = document.createElement('div');
			cell.textContent = p_Cell.value;
			div.appendChild(cell);
		});
	});
}

function updateSizes(p_Control, p_NewRect) {
	p_Control
}

/**
 * Class to represent the vicowa-data-grid custom element
 * @extends webComponentBaseClass
 * @property {array} data The data that will be displayed in the grid
 */
class VicowaDataGrid extends webComponentBaseClass {
	static get is() { return componentName; }
	constructor() {
		super();
		this._dataInfo = [];
	}

	static get properties() {
		return {
			data: {
				type: Array,
				value: [],
				observer: updateData,
			},
		};
	}

	attached() {
		this.$.resizeDetector.addObserver((p_ResizeResult) => {
			updateSizes(this, p_ResizeResult.newRect);
		}, this);
	}

	detached() {
		this.$.resizeDetector.removeOwner(this);
	}
}

window.customElements.define(componentName, VicowaDataGrid);
