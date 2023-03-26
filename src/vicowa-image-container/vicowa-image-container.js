import { WebComponentBaseClass } from '/third_party/web-component-base-class/src/web-component-base-class.js';
import translator from '../utilities/translate.js';
import '../vicowa-string/vicowa-string.js';
import '/third_party/intersection-observer/intersection-observer.js';

/**
 * Class that represents the vicowa-input custom element
 * @extends WebComponentBaseClass
 * @property {string} imageTitle The t
 * @property {string} alt The string representation of the value for this instance
 * @property {string} description The label for this input element or empty if it has no label
 * @property {string} src The source of the image
 * @property {string} galleryGroup The gallery group this image belongs to
 */
class VicowaImageContainer extends WebComponentBaseClass {
	#visible;
	#activeTranslator;
	#intersectionObserver;
	constructor() {
		super();
	}

	static get properties() {
		return Object.assign({}, super.properties, {
			tooltip: {
				type: String,
				value: '',
				reflectToAttribute: true,
				observer: (control) => control.#tooltipChanged(),
			},
			alt: {
				type: String,
				value: '',
				reflectToAttribute: true,
				observer: (control) => control.#altChanged(),
			},
			description: {
				type: String,
				value: '',
				reflectToAttribute: true,
				observer: (control) => control.#descriptionChanged(),
			},
			src: {
				type: String,
				value: '',
				reflectToAttribute: true,
				observer: (control) => control.#srcChanged(),
			},
			galleryGroup: {
				type: String,
				value: '',
				reflectToAttribute: true,
			},
			alternates: {
				type: Array,
				value: [],
				reflectToAttribute: true,
				observer: (control) => control.#alternatesChanged(),
			},
			lazyload: {
				type: Boolean,
				value: false,
				reflectToAttribute: true,
				observer: (control) => control.#lazyloadChanged(),
			},
		});
	}

	updateTranslation() {
		this.$.image.title = (this.#activeTranslator && this.tooltip) ? this.#activeTranslator.translate(this.tooltip).fetch() : this.tooltip;
		this.$.image.alt = (this.#activeTranslator && this.alt) ? this.#activeTranslator.translate(this.alt).fetch() : this.alt;
	}

	attached() {
		translator.addTranslationUpdatedObserver((translatorInstance) => {
			this.#activeTranslator = translatorInstance;
			this.updateTranslation();
		}, this);

		this.$.image.onload = () => {
			if (this.onload) {
				this.onload();
			}
		};
	}

	#tooltipChanged() {
		if (this.tooltip) {
			this.$.image.title = this.tooltip;
			this.updateTranslation();
		} else {
			this.$.image.removeAttribute('title');
		}
	}

	#altChanged() {
		if (this.alt) {
			this.$.image.alt = this.alt;
			this.updateTranslation();
		} else {
			this.$.image.removeAttribute('alt');
		}
	}

	#descriptionChanged() {
		this.$.description.string = this.description;
		this.updateTranslation();
	}

	#alternatesChanged() {
		if (!this.hasAttribute('lazyload') || this.#visible) {
			const alternates = (this.alternates || []).slice();
			this.$$$('picture source').forEach((source) => { source.parentNode.removeChild(source); });
			if (alternates.length || this.src) {
				if ((!alternates.length || alternates[alternates.length - 1] !== this.src) && this.src) {
					alternates.push(this.src);
				}
				alternates.slice(0, -1).forEach((alternate) => {
					const source = document.createElement('source');
					source.setAttribute('srcset', alternate.replace(/ /g, '%20'));
					if (/\./.test(alternate)) {
						source.setAttribute('type', `image/${alternate.split('.').slice(-1)[0]}`);
					}
					this.$.picture.insertBefore(source, this.$.image);
				});
				this.$.image.src = alternates.slice(-1)[0].replace(/ /g, '%20');
			}
		}
	}

	#srcChanged() {
		this.#alternatesChanged();
	}

	#lazyloadChanged() {
		if (this.lazyload) {
			this.#intersectionObserver = new IntersectionObserver((entries) => {
				if (entries[0].intersectionRatio > 0) {
					// set the image containers
					this.#visible = true;
					this.#alternatesChanged();
				}
			});

			this.#intersectionObserver.observe(this);
		} else if (this.#intersectionObserver) {
			this.#intersectionObserver.disconnect();
			this.#intersectionObserver = null;
		}
	}

	static get template() {
		return `
			<style>
				:host {
					position: relative;
					box-sizing: border-box;
					display: inline-block;
				}
		
				#image-container {
					position: relative;
					width: 100%;
					height: 100%;
				}
		
				.description-container {
					box-sizing: border-box;
					position: absolute;
					bottom: 0;
					width: 100%;
					text-align: center;
					visibility: var(--vicowa-image-container-description-visibility, visible);
				}
		
				.description-container .background {
					position: absolute;
					left: 0;
					top: 0;
					right: 0;
					bottom: 0;
					background: var(--vicowa-image-container-description-background, rgba(0, 0, 0, 0.7));
				}
		
				#description {
					display: block;
					position: relative;
					padding: 3px;
					color: var(--vicowa-image-container-description-color, white);
				}
		
				#description[string=""],
					#description:not([string]) {
					display: none;
				}
		
				#image {
					pointer-events: var(--vicowa-image-container-image-pointer-events, all);
				}
		
				img {
					position: absolute;
					width: 100%;
					height: 100%;
					object-fit: var(--vicowa-image-container-object-fit, contain);
					object-position: 50% 0;
				}
		
			</style>
			<div id="image-container">
				<picture id="picture">
					<img id="image" src="">
				</picture>
				<div class="description-container">
					<div class="background"></div>
					<vicowa-string id="description"></vicowa-string>
				</div>
			</div>
		`;
	}
}

window.customElements.define('vicowa-image-container', VicowaImageContainer);
