import { webComponentBaseClass } from '../third_party/web-component-base-class/src/webComponentBaseClass.js';
import translator from '../utilities/translate.js';
import '../third_party/intersection-observer/intersection-observer.js';

/**
 * Handler to be called when the tooltip text is changed
 * @param {VicowaImageContainer} p_ImageControl The control for which this handler is called
 */
function tooltipChanged(p_ImageControl) {
	if (p_ImageControl.tooltip) {
		p_ImageControl.$.image.title = p_ImageControl.tooltip;
		p_ImageControl.updateTranslation();
	} else {
		p_ImageControl.$.image.removeAttribute('title');
	}
}

/**
 * Handler to be called when the alt text is changed
 * @param {VicowaImageContainer} p_ImageControl The control for which this handler is called
 */
function altChanged(p_ImageControl) {
	if (p_ImageControl.alt) {
		p_ImageControl.$.image.alt = p_ImageControl.alt;
		p_ImageControl.updateTranslation();
	} else {
		p_ImageControl.$.image.removeAttribute('alt');
	}
}

/**
 * Handler to be called when the description text is changed
 * @param {VicowaImageContainer} p_ImageControl The control for which this handler is called
 */
function descriptionChanged(p_ImageControl) {
	p_ImageControl.$.description.string = p_ImageControl.description;
	p_ImageControl.updateTranslation();
}

function alternatesChanged(p_ImageControl) {
	if (!p_ImageControl.hasAttribute('lazyload') || p_ImageControl._visible) {
		const alternates = (p_ImageControl.alternates || []).slice();
		p_ImageControl.$$$('picture source').forEach((p_Source) => { p_Source.parentNode.removeChild(p_Source); });
		if (alternates.length || p_ImageControl.src) {
			if ((!alternates.length || alternates[alternates.length - 1] !== p_ImageControl.src) && p_ImageControl.src) {
				alternates.push(p_ImageControl.src);
			}
			alternates.slice(0, -1).forEach((p_Alternate) => {
				const source = document.createElement('source');
				source.setAttribute('srcset', p_Alternate.replace(/ /g, '%20'));
				if (/\./.test(p_Alternate)) {
					source.setAttribute('type', `image/${p_Alternate.split('.').slice(-1)[0]}`);
				}
				p_ImageControl.$.picture.insertBefore(source, p_ImageControl.$.image);
			});
			p_ImageControl.$.image.src = alternates.slice(-1)[0].replace(/ /g, '%20');
		}
	}
}

/**
 * Handler to be called when the src is changed
 * @param {VicowaImageContainer} p_ImageControl The control for which this handler is called
 */
function srcChanged(p_ImageControl) {
	alternatesChanged(p_ImageControl);
}

function isVisible(p_Element) {
	const rect = p_Element.getBoundingClientRect();
	return rect.bottom > 0 && rect.top < window.innerHeight && rect.right > 0 && rect.left < window.innerWidth;
}

function lazyloadChanged(p_ImageControl) {
	if (p_ImageControl.lazyload) {
		p_ImageControl._intersectionObserver = new IntersectionObserver((p_Entries) => {
			if (p_Entries[0].intersectionRatio > 0) {
				// set the image containers
				p_ImageControl._visible = true;
				alternatesChanged(p_ImageControl);
			}
		});

		p_ImageControl._intersectionObserver.observe(p_ImageControl);
		p_ImageControl._visible = isVisible(p_ImageControl);
	} else if (p_ImageControl._intersectionObserver) {
		p_ImageControl._intersectionObserver.disconnect();
		p_ImageControl._intersectionObserver = null;
	}
}

const componentName = 'vicowa-image-container';

/**
 * Class that represents the vicowa-input custom element
 * @extends webComponentBaseClass
 * @property {string} imageTitle The t
 * @property {string} alt The string representation of the value for this instance
 * @property {string} description The label for this input element or empty if it has no label
 * @property {string} src The source of the image
 * @property {string} galleryGroup The gallery group this image belongs to
 */
class VicowaImageContainer extends webComponentBaseClass {
	static get is() { return componentName; }
	constructor() {
		super();
	}

	static get properties() {
		return Object.assign({}, super.properties, {
			tooltip: {
				type: String,
				value: '',
				reflectToAttribute: true,
				observer: tooltipChanged,
			},
			alt: {
				type: String,
				value: '',
				reflectToAttribute: true,
				observer: altChanged,
			},
			description: {
				type: String,
				value: '',
				reflectToAttribute: true,
				observer: descriptionChanged,
			},
			src: {
				type: String,
				value: '',
				reflectToAttribute: true,
				observer: srcChanged,
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
				observer: alternatesChanged,
			},
			lazyload: {
				type: Boolean,
				value: false,
				reflectToAttribute: true,
				observer: lazyloadChanged,
			},
		});
	}

	updateTranslation() {
		this.$.image.title = (this._activeTranslator && this.tooltip) ? this._activeTranslator.translate(this.tooltip).fetch() : this.tooltip;
		this.$.image.alt = (this._activeTranslator && this.alt) ? this._activeTranslator.translate(this.alt).fetch() : this.alt;
	}

	attached() {
		translator.addTranslationUpdatedObserver((p_Translator) => {
			this._activeTranslator = p_Translator;
			this.updateTranslation();
		}, this);
	}
}

window.customElements.define(componentName, VicowaImageContainer);
