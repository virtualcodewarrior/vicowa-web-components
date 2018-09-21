import { webComponentBaseClass } from "../third_party/web-component-base-class/src/webComponentBaseClass.js";

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
}

window.customElements.define(componentName, VicowaImageGallery);
