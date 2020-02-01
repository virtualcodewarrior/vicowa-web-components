import { webComponentBaseClass } from "../third_party/web-component-base-class/src/webComponentBaseClass.js";
import "../vicowa-image-container/vicowa-image-container.js";
import "../vicowa-button/vicowa-button.js";

function updateControls(p_ImageControl) {
	p_ImageControl.classList.toggle("start", p_ImageControl._activeImage === 0);
	p_ImageControl.classList.toggle("end", p_ImageControl._activeImage === p_ImageControl.images.length - 1);
}

function updateActiveImages(p_ImageControl) {
	updateControls(p_ImageControl);
	if (p_ImageControl._activeImage < p_ImageControl.images.length) {
		const active = p_ImageControl.images[p_ImageControl._activeImage];
		if (active) {
			p_ImageControl.$.currentImage.alternates = active.alternates;
			p_ImageControl.$.currentImage.description = active.description || "";
			p_ImageControl.$.currentImage.alt = (active.alt || active.description || active.tooltip || "").trim();
			p_ImageControl.$.currentImage.tooltip = active.tooltip || "";
		}
		const previous = (p_ImageControl._activeImage > 0) ? p_ImageControl.images[p_ImageControl._activeImage - 1] : p_ImageControl.images[p_ImageControl.images.length - 1];
		if (previous) {
			p_ImageControl.$.previousImage.alternates = previous.alternates;
			p_ImageControl.$.previousImage.description = previous.description || "";
			p_ImageControl.$.previousImage.alt = (previous.alt || previous.description || previous.tooltip || "").trim();
			p_ImageControl.$.previousImage.tooltip = previous.tooltip || "";
		}

		const next = (p_ImageControl._activeImage < p_ImageControl.images.length - 1) ? p_ImageControl.images[p_ImageControl._activeImage + 1] : p_ImageControl.images[0];
		if (next) {
			p_ImageControl.$.nextImage.alternates = next.alternates;
			p_ImageControl.$.nextImage.description = next.description || "";
			p_ImageControl.$.nextImage.alt = (next.alt || next.description || next.tooltip || "").trim();
			p_ImageControl.$.nextImage.tooltip = next.tooltip || "";
		}
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

const componentName = "vicowa-image-carousel";

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
		this.addAutoEventListener(this.$.previous, "click", () => {
			this.goToPrevious();
		});
		this.addAutoEventListener(this.$.next, "click", () => {
			this.goToNext();
		});
	}

	goToNext() {
		this.classList.toggle("transitioning", true);
		this.classList.toggle("next", true);
		this._autoTimer = 0;
		const handleNextEnd = () => {
			this._activeImage = (this._activeImage < this.images.length - 1) ? this._activeImage + 1 : 0;
			this.classList.toggle("transitioning", false);
			this.classList.toggle("next", false);
			updateActiveImages(this);
			this.removeAutoEventListener(this.$.pictures, "transitionend", handleNextEnd);
			if (this.auto) {
				this._autoTimer = setTimeout(() => { this.goToNext(); }, this.auto);
			}
		};
		this.addAutoEventListener(this.$.pictures, "transitionend", handleNextEnd);
	}

	goToPrevious() {
		this.classList.toggle("transitioning", true);
		this.classList.toggle("previous", true);
		const handlePreviousEnd = () => {
			this._activeImage = (this._activeImage > 0) ? this._activeImage - 1 : this.images.length - 1;
			this.classList.toggle("transitioning", false);
			this.classList.toggle("previous", false);
			updateActiveImages(this);
			this.removeAutoEventListener(this.$.pictures, "transitionend", handlePreviousEnd);
		};
		this.addAutoEventListener(this.$.pictures, "transitionend", handlePreviousEnd);
	}

	goToIndex(p_Index) {
		this.startIndex = Math.min(Math.max(0, p_Index), this.images.length - 1);
		this._activeImage = this.startIndex;
		updateActiveImages(this);
	}

	static get template() {
		return `
			<style>
				:host {
					position: relative;
					box-sizing: border-box;
					display: inline-block;
					width: var(--vicowa-image-carousel-width, 200px);
				}
		
				#controls {
					position: absolute;
					left: 0;
					top: 0;
					right: 0;
					bottom: 0;
					display: grid;
					grid-template-columns: 50px auto 50px;
					grid-template-rows: auto 40px;
					pointer-events: none;
				}
		
				.left,
				.right {
					display: flex;
					justify-content: center;
					align-items: center;
					grid-row-start: span 2;
				}
		
				#pictures {
					position: relative;
					height: 100%;
					width: 100%;
					overflow: hidden;
				}
		
				vicowa-image-container {
					width: var(--vicowa-image-carousel-width, 200px);
					height: 100%;
				}
		
				#moving-part {
					position: relative;
					display: flex;
					width: calc(var(--vicowa-image-carousel-width, 200px) * 3);
					height: 100%;
					left: calc(-1 * var(--vicowa-image-carousel-width, 200px));
				}
		
				:host(.transitioning) #moving-part {
					transition: left var(--vicowa-image-carousel-animation-time, 1s);
				}
				:host(.next) #moving-part {
					left: calc(-2 * var(--vicowa-image-carousel-width, 200px));
				}
				:host(.previous) #moving-part {
					left: 0;
				}
		
				:host(.transitioning) .right,
				:host(.transitioning) .left {
					opacity: 0;
				}
		
				.right,
				.left {
					opacity: 0.5;
					transition: opacity .5s;
				}
		
				:host(:not(.transitioning)[loop]) .right,
				:host(:not(.transitioning)[loop]) .left,
				:host(:not(.transitioning):not(.end)) .right,
				:host(:not(.transitioning):not(.start)) .left {
					pointer-events: all;
					cursor: pointer;
					opacity: 1;
				}
		
				.arrow-top {
					position: absolute;
					width: 31px;
					height: 3px;
					left: 10px;
					top: 16px;
					border: 2px solid black;
					background: white;
					transform: rotate(45deg);
				}
		
				.arrow-bottom {
					position: absolute;
					top: 38px;
					left: 10px;
					width: 29px;
					height: 3px;
					border: 2px solid black;
					border-right: none;
					background: white;
					transform: rotate(-45deg);
				}
		
				.arrow-container {
					position: relative;
					width: 50px;
					height: 60px;
				}
		
				#previous .arrow-container {
					transform: rotate(180deg);
				}
		
			</style>
			<div id="pictures">
				<div id="moving-part">
					<vicowa-image-container id="previous-image"></vicowa-image-container>
					<vicowa-image-container id="current-image"></vicowa-image-container>
					<vicowa-image-container id="next-image"></vicowa-image-container>
				</div>
			</div>
			<div id="controls">
				<div class="left"><slot id="previous" name="previous-control"><div class="arrow-container"><div class="arrow-top"></div><div class="arrow-bottom"></div></div></slot></div>
				<div class="center"></div>
				<div class="right"><slot id="next" name="next-control"><div class="arrow-container"><div class="arrow-top"></div><div class="arrow-bottom"></div></div></slot></div>
				<div class="bottom"><div id="progress"></div></div>
			</div>
		`;
	}
}

window.customElements.define(componentName, VicowaImageCarousel);
