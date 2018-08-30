import { webComponentBaseClass } from '../third_party/web-component-base-class/src/webComponentBaseClass.js';

function updateControls(p_ImageControl) {
	p_ImageControl.classList.toggle('start', p_ImageControl._activeImage === 0);
	p_ImageControl.classList.toggle('end', p_ImageControl._activeImage === p_ImageControl.images.length - 1);
}

function updateActiveImages(p_ImageControl) {
	updateControls(p_ImageControl);
	if (p_ImageControl._activeImage < p_ImageControl.images.length) {
		const active = p_ImageControl.images[p_ImageControl._activeImage];
		p_ImageControl.$.currentImage.alternates = active.alternates;
		p_ImageControl.$.currentImage.description = active.description;
		p_ImageControl.$.currentImage.alt = (active.alt || active.description).trim();
		p_ImageControl.$.currentImage.tooltip = (active.tooltip || active.description).trim();

		const previous = (p_ImageControl._activeImage > 0) ? p_ImageControl.images[p_ImageControl._activeImage - 1] : p_ImageControl.images[p_ImageControl.images.length - 1];
		p_ImageControl.$.previousImage.alternates = previous.alternates;
		p_ImageControl.$.previousImage.description = previous.description;
		p_ImageControl.$.previousImage.alt = (previous.alt || previous.description).trim();
		p_ImageControl.$.previousImage.tooltip = (previous.tooltip || previous.description).trim();

		const next = (p_ImageControl._activeImage < p_ImageControl.images.length - 1) ? p_ImageControl.images[p_ImageControl._activeImage + 1] : p_ImageControl.images[0];
		p_ImageControl.$.nextImage.alternates = next.alternates;
		p_ImageControl.$.nextImage.description = next.description;
		p_ImageControl.$.nextImage.alt = (next.alt || next.description).trim();
		p_ImageControl.$.nextImage.tooltip = (next.tooltip || next.description).trim();
	}
}

/**
 * Handler to be called when the pictures change
 * @param {VicowaImageCarousel} p_ImageControl The control for which this handler is called
 */
function imagesChanged(p_ImageControl) {
	p_ImageControl._activeImage = 0;
	updateActiveImages(p_ImageControl);
}

function startIndexChanged(p_ImageControl) {
	p_ImageControl.goToIndex(p_ImageControl.startIndex);
}

function autoChanged(p_ImageControl) {
	p_ImageControl.auto = Math.max(0, p_ImageControl.auto || 0);
	if (!p_ImageControl._autoTimer && p_ImageControl.auto) {
		p_ImageControl.loop = true; // always loop when auto
		p_ImageControl._autoTimer = setTimeout(() => { p_ImageControl.goToNext(); }, 1000);
	} else if (p_ImageControl._autoTimer && !p_ImageControl.auto) {
		clearTimeout(p_ImageControl._autoTimer);
		p_ImageControl._autoTimer = 0;
	}
}

const componentName = 'vicowa-image-carousel';

/**
 * Class that represents the vicowa-input custom element
 * @extends webComponentBaseClass
 * @property {array} images The list of images for this carousel, should be an array of { alternates: [string], description: string }
 * @property {boolean} loop Indicates if we loop back to the first picture when we reach the end
 * @property {number} auto If this value is not 0, it indicates the time in seconds to go to the next image automatically. If <= 0 automatic is off
 */
class VicowaImageCarousel extends webComponentBaseClass {
	static get is() { return componentName; }
	constructor() {
		super();
		this._activeImage = 0;
		this._autoTimer = 0;
	}

	static get properties() {
		return Object.assign({}, super.properties, {
			images: {
				type: Array,
				value: [],
				observer: imagesChanged,
			},
			startIndex: {
				type: Number,
				value: 0,
				reflectToAttribute: true,
				observer: startIndexChanged,
			},
			loop: {
				type: Boolean,
				value: false,
				reflectToAttribute: true,
			},
			auto: {
				type: Number,
				value: 0,
				reflectToAttribute: true,
				observer: autoChanged,
			},
		});
	}

	attached() {
		this.addAutoEventListener(this.$.previous, 'click', () => {
			this.goToPrevious();
		});
		this.addAutoEventListener(this.$.next, 'click', () => {
			this.goToNext();
		});
	}

	goToNext() {
		this.classList.toggle('transitioning', true);
		this.classList.toggle('next', true);
		this._autoTimer = 0;
		const handleNextEnd = () => {
			this._activeImage = (this._activeImage < this.images.length - 1) ? this._activeImage + 1 : 0;
			this.classList.toggle('transitioning', false);
			this.classList.toggle('next', false);
			updateActiveImages(this);
			this.removeAutoEventListener(this.$.pictures, 'transitionend', handleNextEnd);
			if (this.auto) {
				this._autoTimer = setTimeout(() => { this.goToNext(); }, this.auto);
			}
		};
		this.addAutoEventListener(this.$.pictures, 'transitionend', handleNextEnd);
	}

	goToPrevious() {
		this.classList.toggle('transitioning', true);
		this.classList.toggle('previous', true);
		const handlePreviousEnd = () => {
			this._activeImage = (this._activeImage > 0) ? this._activeImage - 1 : this.images.length - 1;
			this.classList.toggle('transitioning', false);
			this.classList.toggle('previous', false);
			updateActiveImages(this);
			this.removeAutoEventListener(this.$.pictures, 'transitionend', handlePreviousEnd);
		};
		this.addAutoEventListener(this.$.pictures, 'transitionend', handlePreviousEnd);
	}

	goToIndex(p_Index) {
		this.startIndex = Math.min(Math.max(0, p_Index), this.images.length - 1);
		this._activeImage = this.startIndex;
		updateActiveImages(this);
	}
}

window.customElements.define(componentName, VicowaImageCarousel);
