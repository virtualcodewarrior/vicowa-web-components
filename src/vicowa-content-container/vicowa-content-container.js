import { WebComponentBaseClass } from '/third_party/web-component-base-class/src/web-component-base-class.js';
import observerFactory from '../utilities/observerFactory.js';

/**
 * Class to represent the vicowa-content-container custom element
 * This web component allows you to use other web components as your website content, to simply create a single page website
 * What it does is to create a web component of the given type and place that inside itself
 * It will take care of the browser history and importing of the external html when needed
 * @extends WebComponentBaseClass
 * @property {string} location The location of the web component html file to load into the content container
 * @property {string} pageTitle Change the page title to this name  when the content is loaded
 * @property {boolean} addLocationToUrl Indicates if you want to add the loaded content to the url. This will append a hash and the path to the content (e.g. yourwebsite/#./content/my-page.html)
 * @property {string} contentBaseLocation Set the base location for your content web components. This will allow you to omit the full path when using the components and it will also omit the path from the url to make for shorter urls if the addLocationToUrl option is set
 */
class VicowaContentContainer extends WebComponentBaseClass {
	#privateData;
	static get properties() {
		return {
			location: {
				type: String,
				reflectToAttribute: true,
				observer: (control) => control.#handleChangeLocation(),
			},
			pageTitle: {
				type: String,
				value: '',
				reflectToAttribute: true,
			},
			addLocationToUrl: {
				type: Boolean,
				value: false,
				reflectToAttribute: true,
			},
			contentBaseLocation: {
				type: String,
				value: '',
				reflectToAttribute: true,
				observer: (control) => control.#handleChangeLocation(),
			},
			handleHistory: {
				type: Boolean,
				value: true,
				reflectToAttribute: true,
			},
		};
	}
	constructor() {
		super();
		this.#privateData = {
			currentElement: null,
			currentLocation: null,
			currentTitle: '',
			elementInstance: null,
			onChange: null,
			changeObserver: observerFactory(),
		};
	}

	addChangeListener(callback) {
		this.#privateData.changeObserver.addObserver('change', callback);
	}

	removeChangeListener(callback) {
		this.#privateData.changeObserver.removeObserver('change', callback);
	}

	attached() {
		const controlData = this.#privateData;
		controlData.onChange = this.onChange;
		Object.defineProperty(this, 'onChange', {
			get() { return undefined; },
			set(callback) { controlData.onChange = callback; controlData.onChange(controlData.elementInstance); },
		});

		this.#setupStateHandling();
	}

	#handleChangeLocation() {
		const controlData = this.#privateData;
		if (this.location && typeof this.contentBaseLocation === 'string') {
			// get the web component name by taking the location, taking the file name and stripping of the extension. This requires you to always name the
			// target content the same as the web component
			const element = this.location.trim().split('/').pop().replace(/\..*$/, '');
			const location = this.contentBaseLocation + this.location;

			// make sure we didn't load this already
			if (controlData.currentElement !== element && controlData.currentLocation !== location) {
				if (this.handleHistory) {
					// only push a new state if we are changing the location not if we are just initializing
					if (controlData.currentElement && controlData.currentLocation && controlData.currentTitle !== undefined && !this.noPush) {
						if (!window.history.state) {
							window.history.replaceState({ location: controlData.currentLocation.replace(this.contentBaseLocation, ''), id: this.getAttribute('id'), title: controlData.currentTitle }, controlData.currentTitle, (this.addLocationToUrl) ? `#${controlData.currentLocation.replace(this.contentBaseLocation, '')}` : undefined);
						}
						window.history.pushState({ location: location.replace(this.contentBaseLocation, ''), id: this.getAttribute('id'), title: this.getAttribute('page-title') }, this.getAttribute('page-title'), (this.addLocationToUrl) ? `#${location.replace(this.contentBaseLocation, '')}` : undefined);
					}
				}
				controlData.currentElement = element;
				controlData.elementInstance = null;
				controlData.currentLocation = location;
				controlData.currentTitle = this.getAttribute('page-title');
				const createElement = () => {
					// test again because importing the document might be out of order
					if (!controlData.elementInstance || controlData.elementInstance.localName !== controlData.currentElement) {
						this.$.container.innerHTML = '';
						controlData.elementInstance = document.createElement(controlData.currentElement);
						this.$.container.appendChild(controlData.elementInstance);
						if (this.pageTitle) {
							document.title = this.pageTitle;
						}
						controlData.changeObserver.notify('change', { contentInstance: controlData.elementInstance, control: this });
						if (controlData.onChange) {
							controlData.onChange(controlData.elementInstance);
						}
					}
				};

				if (!window.customElements.get(element)) {
					const head = document.querySelector('head');
					let script = head.querySelector(`script[src="${location}"]`);
					if (!script) {
						script = document.createElement('script');
						script.type = 'module';
						script.src = location;
						head.appendChild(script);
					}
					script.addEventListener('load', createElement);
				} else {
					createElement();
				}
			}
		}
	}

	#setupStateHandling() {
		const handleLoadState = (state, anchor) => {
			if (this.handleHistory) {
				anchor = (anchor || '').replace(/^#/, '');
				if (anchor) {
					this.noPush = true;
					this.location = anchor;
					this.noPush = false;
				} else if (state && state.location) {
					if (state.id === this.getAttribute('id')) {
						this.noPush = true;
						this.pageTitle = window.history.state.title;
						this.location = window.history.state.location;
						this.noPush = false;
					}
				} else {
					this.#handleChangeLocation();
				}
			}
		};

		const handlePopState = (event) => {
			if (this.handleHistory) {
				handleLoadState(event.state, (event.state) ? '' : document.location.hash);
			}
		};

		handleLoadState(window.history.state, document.location.hash);

		window.addEventListener('popstate', handlePopState);
	}

	static get template() {
		return `
			<style>
				:host {
						position: relative;
						display: block;
						box-sizing: border-box;
					}
			
			</style>
			<div id="container"></div>
		`;
	}
}

window.customElements.define('vicowa-content-container', VicowaContentContainer);
