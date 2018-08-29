import { webComponentBaseClass } from '../third_party/web-component-base-class/dist/webComponentBaseClass.js';
import translator from '../utilities/translate.js';

const galleries = {
};

/**
 * Handler to be called when the tooltip text is changed
 * @param {VicowaImageContainer} p_ImageControl The control for which this handler is called
 */
function tooltipChanged(p_ImageControl) {
	p_ImageControl.$.image.title = p_ImageControl.tooltip;
	p_ImageControl.updateTranslation();
}

/**
 * Handler to be called when the alt text is changed
 * @param {VicowaImageContainer} p_ImageControl The control for which this handler is called
 */
function altChanged(p_ImageControl) {
	p_ImageControl.$.image.alt = p_ImageControl.alt;
	p_ImageControl.updateTranslation();
}

/**
 * Handler to be called when the description text is changed
 * @param {VicowaImageContainer} p_ImageControl The control for which this handler is called
 */
function descriptionChanged(p_ImageControl) {
	p_ImageControl.$.description.string = p_ImageControl.description;
	p_ImageControl.updateTranslation();
}

/**
 * Handler to be called when the src is changed
 * @param {VicowaImageContainer} p_ImageControl The control for which this handler is called
 */
function srcChanged(p_ImageControl) {
	p_ImageControl.$.image.src = p_ImageControl.src;
	p_ImageControl.updateTranslation();
}

/**
 * Handler to be called when the src is changed
 * @param {VicowaImageContainer} p_ImageControl The control for which this handler is called
 */
function galleryGroupChanged(p_ImageControl) {
	p_ImageControl.$.image.src = p_ImageControl.src;
	p_ImageControl.updateTranslation();
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
				observer: galleryGroupChanged,
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
		this.addAutoEventListener(this.$.image, 'click', () => {

		});
	}
}

window.customElements.define(componentName, VicowaImageContainer);
