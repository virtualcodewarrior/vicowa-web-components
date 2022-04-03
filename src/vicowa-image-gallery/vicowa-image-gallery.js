import { WebComponentBaseClass } from "/third_party/web-component-base-class/src/web-component-base-class.js";
import "../vicowa-image-carousel/vicowa-image-carousel.js";
import "../vicowa-modal/vicowa-modal.js";

/**
 * Class that represents the vicowa-input custom element
 * @extends WebComponentBaseClass
 * @property {array} images The list of images for this carousel, should be an array of { alternates: [string], description: string }
 * @property {boolean} loop Indicates if we loop back to the first picture when we reach the end
 * @property {number} auto If this value is not 0, it indicates the time in seconds to go to the next image automatically. If <= 0 automatic is off
 */
class VicowaImageGallery extends WebComponentBaseClass {
	#imageProvider;
	#imageInfo;
	constructor() {
		super();
		this.#imageProvider = null;
		this.#imageInfo = [];
	}

	static get properties() {
		return {
			noGridToolTip: {
				type: Boolean,
				value: false,
				reflectToAttribute: true,
			},
			noCarouselToolTip: {
				type: Boolean,
				value: false,
				reflectToAttribute: true,
			},
			noGridDescription: {
				type: Boolean,
				value: false,
				reflectToAttribute: true,
			},
			noCarouselDescription: {
				type: Boolean,
				value: false,
				reflectToAttribute: true,
			},
		};
	}

	setImageProvider(provider) {
		this.#imageProvider = provider;

		this.addAutoEventListener(this.$.images, "click", (event) => {
			// get the item under the mouse
			const container = (event.target) ? event.target.closest("[carousel-index]") : null;
			if (container) {
				this.$.modal.open = true;
				this.$.carousel.startIndex = parseInt(container.getAttribute("carousel-index"), 10);
			}
		});
		this.addAutoEventListener(this.$.closeCarousel, "click", () => {
			this.$.modal.open = false;
		});
		this.$.images.innerHTML = "";
		if (this.#imageProvider) {
			this.#retrieveImages();
		}
	}

	async #retrieveImages() {
		const images = await this.#imageProvider.getImages();
		images.forEach((imageInfo, index) => {
			this.#imageInfo[index] = { thumbNail: (imageInfo.thumbNail || imageInfo.fullSize || []).slice(), fullSize: (imageInfo.fullSize || imageInfo.thumbNail || []).slice(), description: imageInfo.description, tooltip: imageInfo.tooltip, alt: imageInfo.alt };

			let tile = document.querySelector(`[carousel-index="${index}]"`);
			let imageContainer = null;
			if (!tile) {
				imageContainer = (tile) ? tile.querySelector("vicowa-image-container") : null;
				if (!imageContainer) {
					tile = imageContainer = document.createElement("vicowa-image-container");
					tile.setAttribute("lazyload", "");
				}
				this.$.images.appendChild(tile);
			}

			tile.setAttribute("carousel-index", index);
			imageContainer.alternates = this.#imageInfo[index].thumbNail.slice();
			imageContainer.description = imageInfo.description;
			imageContainer.tooltip = imageInfo.tooltip;
			imageContainer.alt = (imageInfo.alt || imageInfo.description || imageInfo.tooltip || "").trim();
		});

		this.$.carousel.images = this.#imageInfo.map((info) => ({ alternates: info.fullSize.slice(), description: info.description, alt: info.alt, tooltip: info.tooltip }));
	}

	static get template() {
		return `
			<style>
				:host {
					display: block;
					position: relative;
				}
		
				#images {
					display: flex;
					flex-wrap: wrap;
				}
		
				vicowa-image-container {
					box-sizing: border-box;
					flex: 0 0 auto;
					margin-right: 1em;
					margin-bottom: 1em;
					width: var(--vicowa-image-gallery-tile-width, 200px);
					height: var(--vicowa-image-gallery-tile-height, 200px);
					box-shadow: var(--vicowa-image-gallery-tile-shadow, 2px 2px 8px grey);
					border: var(--vicowa-image-gallery-tile-border, none);
				}
		
				vicowa-modal [slot] {
					position: relative;
					display: flex;
					flex-direction: column;
					width: 90vw;
					height: 90vh;
					box-shadow: 10px 10px 30px black;
					align-content: stretch;
					align-items: stretch;
					background: lightgrey;
				}
		
				#carousel {
					flex: 1 1 auto;
					height: calc(100% - 40px);
					--vicowa-image-carousel-width: 100%;
					font-size: 1.5em;
					padding: .5em .5em 0;
					background: white;
				}
		
				#close-carousel {
					flex: 0 0 40px;
					text-align: center;
					align-self: center;
					width: 50px;
					font: bold 2em sans-serif;
					cursor: pointer;
					padding-top: 5px;
				}
		
				#custom-tile {
					display: none;
				}
		
				:host([no-grid-description]) #images vicowa-image-container {
					--vicowa-image-container-description-visibility: hidden;
				}
				:host([no-grid-tooltip]) #images vicowa-image-container {
					--vicowa-image-container-image-pointer-events: none;
				}
		
				:host([no-carousel-description]) vicowa-image-carousel {
					--vicowa-image-container-description-visibility: hidden;
				}
				:host([no-carousel-tooltip]) vicowa-image-carousel {
					--vicowa-image-container-image-pointer-events: none;
				}
			</style>
			<div id="images">
			</div>
			<vicowa-modal id="modal" outside-closes>
				<div slot="content">
					<vicowa-image-carousel id="carousel" loop></vicowa-image-carousel>
					<div id="close-carousel">X</div>
				</div>
			</vicowa-modal>
		`;
	}
}

window.customElements.define("vicowa-image-gallery", VicowaImageGallery);
