import { WebComponentBaseClass } from '/third_party/web-component-base-class/src/web-component-base-class.js';
import '../vicowa-image-container/vicowa-image-container.js';
import '../vicowa-button/vicowa-button.js';

/**
 * Class that represents the vicowa-input custom element
 * @extends WebComponentBaseClass
 * @property {array} images The list of images for this carousel, should be an array of { alternates: [string], description: string }
 * @property {boolean} loop Indicates if we loop back to the first picture when we reach the end
 * @property {number} auto If this value is not 0, it indicates the time in seconds to go to the next image automatically. If <= 0 automatic is off
 */
class VicowaImageCarousel extends WebComponentBaseClass {
	#activeImage;
	#autoTimer;

	constructor() {
		super();
		this.#activeImage = 0;
		this.#autoTimer = 0;
	}

	static get properties() {
		return Object.assign({}, super.properties, {
			images: {
				type: Array,
				value: [],
				observer: (control) => control.#imagesChanged(),
			},
			startIndex: {
				type: Number,
				value: 0,
				reflectToAttribute: true,
				observer: (control) => control.#startIndexChanged(),
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
				observer: (control) => control.#autoChanged(),
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
		this.#autoTimer = 0;
		const handleNextEnd = () => {
			this.#activeImage = (this.#activeImage < this.images.length - 1) ? this.#activeImage + 1 : 0;
			this.classList.toggle('transitioning', false);
			this.classList.toggle('next', false);
			this.#updateActiveImages();
			this.removeAutoEventListener(this.$.pictures, 'transitionend', handleNextEnd);
			if (this.auto) {
				this.#autoTimer = setTimeout(() => { this.goToNext(); }, this.auto);
			}
		};
		this.addAutoEventListener(this.$.pictures, 'transitionend', handleNextEnd);
	}

	goToPrevious() {
		this.classList.toggle('transitioning', true);
		this.classList.toggle('previous', true);
		const handlePreviousEnd = () => {
			this.#activeImage = (this.#activeImage > 0) ? this.#activeImage - 1 : this.images.length - 1;
			this.classList.toggle('transitioning', false);
			this.classList.toggle('previous', false);
			this.#updateActiveImages();
			this.removeAutoEventListener(this.$.pictures, 'transitionend', handlePreviousEnd);
		};
		this.addAutoEventListener(this.$.pictures, 'transitionend', handlePreviousEnd);
	}

	goToIndex(index) {
		this.startIndex = Math.min(Math.max(0, index), this.images.length - 1);
		this.#activeImage = this.startIndex;
		this.#updateActiveImages();
	}

	#updateControls() {
		this.classList.toggle('start', this.#activeImage === 0);
		this.classList.toggle('end', this.#activeImage === this.images.length - 1);
	}

	#updateActiveImages() {
		this.#updateControls();
		if (this.#activeImage < this.images.length) {
			const active = this.images[this.#activeImage];
			if (active) {
				this.$.currentImage.alternates = active.alternates;
				this.$.currentImage.description = active.description || '';
				this.$.currentImage.alt = (active.alt || active.description || active.tooltip || '').trim();
				this.$.currentImage.tooltip = active.tooltip || '';
			}
			const previous = (this.#activeImage > 0) ? this.images[this.#activeImage - 1] : this.images[this.images.length - 1];
			if (previous) {
				this.$.previousImage.alternates = previous.alternates;
				this.$.previousImage.description = previous.description || '';
				this.$.previousImage.alt = (previous.alt || previous.description || previous.tooltip || '').trim();
				this.$.previousImage.tooltip = previous.tooltip || '';
			}

			const next = (this.#activeImage < this.images.length - 1) ? this.images[this.#activeImage + 1] : this.images[0];
			if (next) {
				this.$.nextImage.alternates = next.alternates;
				this.$.nextImage.description = next.description || '';
				this.$.nextImage.alt = (next.alt || next.description || next.tooltip || '').trim();
				this.$.nextImage.tooltip = next.tooltip || '';
			}
		}
	}

	#imagesChanged() {
		this.#activeImage = 0;
		this.#updateActiveImages();
	}

	#startIndexChanged() {
		this.goToIndex(this.startIndex);
	}

	#autoChanged() {
		this.auto = Math.max(0, this.auto || 0);
		if (!this.#autoTimer && this.auto) {
			this.loop = true; // always loop when auto
			this.#autoTimer = setTimeout(() => { this.goToNext(); }, 1000);
		} else if (this.#autoTimer && !this.auto) {
			clearTimeout(this.#autoTimer);
			this.#autoTimer = 0;
		}
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

window.customElements.define('vicowa-image-carousel', VicowaImageCarousel);
