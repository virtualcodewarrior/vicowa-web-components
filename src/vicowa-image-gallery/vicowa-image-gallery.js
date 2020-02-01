import { webComponentBaseClass } from "../third_party/web-component-base-class/src/webComponentBaseClass.js";
import "../vicowa-image-carousel/vicowa-image-carousel.js";
import "../vicowa-modal/vicowa-modal.js";

const componentName = "vicowa-image-gallery";

async function retrieveImages(p_GalleryControl) {
	const images = await p_GalleryControl._imageProvider.getImages();
	images.forEach((p_ImageInfo, p_Index) => {
		p_GalleryControl._imageInfo[p_Index] = { thumbNail: (p_ImageInfo.thumbNail || p_ImageInfo.fullSize || []).slice(), fullSize: (p_ImageInfo.fullSize || p_ImageInfo.thumbNail || []).slice(), description: p_ImageInfo.description, tooltip: p_ImageInfo.tooltip, alt: p_ImageInfo.alt };

		let tile = document.querySelector(`[carousel-index="${p_Index}]"`);
		let imageContainer = null;
		if (!tile) {
			imageContainer = (tile) ? tile.querySelector("vicowa-image-container") : null;
			if (!imageContainer) {
				tile = imageContainer = document.createElement("vicowa-image-container");
				tile.setAttribute("lazyload", "");
			}
			p_GalleryControl.$.images.appendChild(tile);
		}

		tile.setAttribute("carousel-index", p_Index);
		imageContainer.alternates = p_GalleryControl._imageInfo[p_Index].thumbNail.slice();
		imageContainer.description = p_ImageInfo.description;
		imageContainer.tooltip = p_ImageInfo.tooltip;
		imageContainer.alt = (p_ImageInfo.alt || p_ImageInfo.description || p_ImageInfo.tooltip || "").trim();
	});

	p_GalleryControl.$.carousel.images = p_GalleryControl._imageInfo.map((p_Info) => ({ alternates: p_Info.fullSize.slice(), description: p_Info.description, alt: p_Info.alt, tooltip: p_Info.tooltip }));
}

/**
 * Class that represents the vicowa-input custom element
 * @extends webComponentBaseClass
 * @property {array} images The list of images for this carousel, should be an array of { alternates: [string], description: string }
 * @property {boolean} loop Indicates if we loop back to the first picture when we reach the end
 * @property {number} auto If this value is not 0, it indicates the time in seconds to go to the next image automatically. If <= 0 automatic is off
 */
class VicowaImageGallery extends webComponentBaseClass {
	static get is() { return componentName; }
	constructor() {
		super();
		this._imageProvider = null;
		this._imageInfo = [];
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

	setImageProvider(p_Provider) {
		this._imageProvider = p_Provider;

		this.addAutoEventListener(this.$.images, "click", (p_Event) => {
			// get the item under the mouse
			const container = (p_Event.target) ? p_Event.target.closest("[carousel-index]") : null;
			if (container) {
				this.$.modal.open = true;
				this.$.carousel.startIndex = parseInt(container.getAttribute("carousel-index"), 10);
			}
		});
		this.addAutoEventListener(this.$.closeCarousel, "click", () => {
			this.$.modal.open = false;
		});
		this.$.images.innerHTML = "";
		if (this._imageProvider) {
			retrieveImages(this);
		}
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

window.customElements.define(componentName, VicowaImageGallery);
