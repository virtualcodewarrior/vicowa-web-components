import { webComponentBaseClass } from '../third_party/web-component-base-class/dist/webComponentBaseClass.js';

const componentName = 'vicowa-sidebar';
window.customElements.define(componentName, class extends webComponentBaseClass {
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
				this.$.innerContainer.style.height = `${Math.min(maxSize, Math.max(0, newSize))}px`;
				this.$.sideContent.style.height = `${Math.min(maxSize, Math.max(0, newSize))}px`;
			} else {
				this.$.innerContainer.style.width = `${Math.min(maxSize, Math.max(0, newSize))}px`;
				this.$.sideContent.style.width = `${Math.min(maxSize, Math.max(0, newSize))}px`;
			}
		};

		const handleDragEnd = () => {
			this.classList.toggle('resizing', false);
			this.removeAutoEventListener(window, 'mouseup', handleDragEnd);
			this.removeAutoEventListener(window, 'touchend', handleDragEnd);
			this.removeAutoEventListener(window, 'mousemove', handleDrag);
			this.removeAutoEventListener(window, 'touchmove', handleDrag);
		};

		const handleDragStart = (p_Event) => {
			vertical = this.location === 'top' || this.location === 'bottom';
			invertFactor = (this.location === 'bottom' || this.location === 'right') ? -1 : 1;
			maxSize = (vertical) ? this.$.main.getBoundingClientRect().height : this.getBoundingClientRect().width;
			startSize = (vertical) ? this.$.sideContent.getBoundingClientRect().height : this.$.sideContent.getBoundingClientRect().width;
			this.addAutoEventListener(window, 'mouseup', handleDragEnd);
			this.addAutoEventListener(window, 'touchend', handleDragEnd);
			this.addAutoEventListener(window, 'mousemove', handleDrag);
			this.addAutoEventListener(window, 'touchmove', handleDrag);
			this.classList.toggle('resizing', true);
			startPos = (vertical) ? p_Event.clientY : p_Event.clientX;
			console.log(`start ${startPos}`);
		};

		this.$.resizeHandle.addEventListener('mousedown', handleDragStart);
		this.$.resizeHandle.addEventListener('touchstart', handleDragStart);
	}
});
