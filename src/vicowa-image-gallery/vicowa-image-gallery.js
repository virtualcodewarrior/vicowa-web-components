import { webComponentBaseClass } from '../third_party/web-component-base-class/src/webComponentBaseClass.js';

const componentName = 'vicowa-image-gallery';

async function retrieveImages(p_GalleryControl, p_StartIndex, p_EndIndex) {
	const images = await p_GalleryControl._imageProvider.getImages(p_StartIndex, p_EndIndex);
	images.forEach((p_ImageInfo, p_Index) => {
		p_GalleryControl._imageInfo[p_Index] = { thumbNail: (p_ImageInfo.thumbNail || p_ImageInfo.fullSize || []).slice(), fullSize: (p_ImageInfo.fullSize || p_ImageInfo.thumbNail || []).slice(), description: p_ImageInfo.description };
		const imageContainer = document.querySelector(`[carouselIndex="${p_Index}]"`) || document.createElement('vicowa-image-container');
		imageContainer.setAttribute('carouselIndex', p_Index);
		imageContainer.alternates = p_GalleryControl._imageInfo[p_Index].thumbNail.slice();
		imageContainer.description = p_ImageInfo.description;
		p_GalleryControl.$.images.appendChild(imageContainer);
	});

	p_GalleryControl.$.carousel.images = p_GalleryControl._imageInfo.map((p_Info) => ({ alternates: p_Info.fullSize.slice(), description: p_Info.description }));
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
		return Object.assign({}, super.properties, {
		});
	}

	setImageProvider(p_Provider) {
		this._imageProvider = p_Provider;

		this.addAutoEventListener(this.$.images, 'click', (p_Event) => {
			// get the item under the mouse
			const container = p_Event.target;
			if (container && container.hasAttribute('carouselIndex')) {
				this.$.modal.open = true;
				this.$.carousel.startIndex = parseInt(container.getAttribute('carouselIndex'), 10);
			}
		});
		this.addAutoEventListener(this.$.closeCarousel, 'click', () => {
			this.$.modal.open = false;
		});
		this.$.images.innerHTML = '';
		if (this._imageProvider) {
			retrieveImages(this, 0, 100);
		}
	}
}

window.customElements.define(componentName, VicowaImageGallery);
