import { webComponentBaseClass } from '../third_party/web-component-base-class/src/webComponentBaseClass.js';

const componentName = 'vicowa-sidebar';

/**
 * Class that represents the vicowa-sidebar custom element
 * @extends webComponentBaseClass
 * @property {string} location The location where the expandable bar is located.This can be one of left,right,top,bottom
 * @property {boolean} expanded Indicate if the bar should be expanded or not
 * @property {boolean} resizeable Indicate if the bar is user resizeable
 * @property {boolean} floating Indicate if the bar if in floating (on top) mode
 * @property {boolean} forceNonFloating Indicate that the bar will not switch automatically to floating when running in a small size (like mobile phone)
 */
class VicowaSideBar extends webComponentBaseClass {
	static get is() { return componentName; }
	constructor() {
		super();
	}

	static get properties() {
		return {
			location: {
				type: String,
				value: 'left',
				reflectToAttribute: true,
			},
			expanded: {
				type: Boolean,
				value: true,
				reflectToAttribute: true,
			},
			resizeable: {
				type: Boolean,
				value: false,
				reflectToAttribute: true,
			},
			floating: {
				type: Boolean,
				value: false,
				reflectToAttribute: true,
			},
			forceNonFloating: {
				type: Boolean,
				value: false,
				reflectToAttribute: true,
			},
		};
	}

	attached() {
		let startPos = 0;
		let startSize = 0;
		let vertical = false;
		let invertFactor = 1;
		let maxSize = 0;
		const handleDrag = (p_Event) => {
			const dragPos = (vertical) ? p_Event.clientY : p_Event.clientX;
			const delta = startPos - dragPos;
			const newSize = startSize - (invertFactor * delta);
			this.$.sideContent.style.flexBasis = `${Math.min(maxSize, Math.max(0, newSize))}px`;
			if (vertical) {
				const resizerSize = this.$.resizeHandle.getBoundingClientRect().height;
				this.$.innerContainer.style.minHeight = `${Math.min(maxSize, Math.max(0, newSize - resizerSize))}px`;
				this.$.sideContent.style.height = `${Math.min(maxSize, Math.max(0, newSize))}px`;
			} else {
				const resizerSize = this.$.resizeHandle.getBoundingClientRect().width;
				this.$.innerContainer.style.minWidth = `${Math.min(maxSize, Math.max(0, newSize - resizerSize))}px`;
				this.$.sideContent.style.width = `${Math.min(maxSize, Math.max(0, newSize))}px`;
			}
		};
		const handleTouchDrag = (p_Event) => {
			p_Event.clientX = p_Event.touches[0].clientX;
			p_Event.clientY = p_Event.touches[0].clientY;
			handleDrag(p_Event);
		};

		const handleDragEnd = () => {
			this.classList.toggle('resizing', false);
			this.removeAutoEventListener(window, 'mouseup', handleDragEnd);
			this.removeAutoEventListener(window, 'touchend', handleDragEnd);
			this.removeAutoEventListener(window, 'mousemove', handleDrag);
			this.removeAutoEventListener(window, 'touchmove', handleTouchDrag);
		};

		const handleDragStart = (p_Event) => {
			vertical = this.location === 'top' || this.location === 'bottom';
			invertFactor = (this.location === 'bottom' || this.location === 'right') ? -1 : 1;
			maxSize = (vertical) ? this.$.main.getBoundingClientRect().height : this.getBoundingClientRect().width;
			startSize = (vertical) ? this.$.sideContent.getBoundingClientRect().height : this.$.sideContent.getBoundingClientRect().width;
			this.addAutoEventListener(window, 'mouseup', handleDragEnd);
			this.addAutoEventListener(window, 'touchend', handleDragEnd);
			this.addAutoEventListener(window, 'mousemove', handleDrag);
			this.addAutoEventListener(window, 'touchmove', handleTouchDrag);
			this.classList.toggle('resizing', true);
			startPos = (vertical) ? p_Event.clientY : p_Event.clientX;
			console.log(`start ${startPos}`);
		};
		const handleTouchDragStart = (p_Event) => {
			p_Event.clientX = p_Event.touches[0].clientX;
			p_Event.clientY = p_Event.touches[0].clientY;
			handleDragStart(p_Event);
		};

		this.$.resizeHandle.addEventListener('mousedown', handleDragStart);
		this.$.resizeHandle.addEventListener('touchstart', handleTouchDragStart);
	}
}

window.customElements.define(componentName, VicowaSideBar);
