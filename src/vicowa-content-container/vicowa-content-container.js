import { webComponentBaseClass } from "../third_party/web-component-base-class/src/webComponentBaseClass.js";
import observerFactory from "../utilities/observerFactory.js";

const privateData = Symbol("privateData");

const componentName = "vicowa-content-container";

function handleChangeLocation(p_Control) {
	const controlData = p_Control[privateData];
	if (p_Control.location && typeof p_Control.contentBaseLocation === "string") {
		// get the web component name by taking the location, taking the file name and stripping of the extension. This requires you to always name the
		// target content the same as the web component
		const element = p_Control.location.trim().split("/").pop().replace(/\..*$/, "");
		const location = p_Control.contentBaseLocation + p_Control.location;

		// make sure we didn't load this already
		if (controlData.currentElement !== element && controlData.currentLocation !== location) {
			if (p_Control.handleHistory) {
				// only push a new state if we are changing the location not if we are just initializing
				if (controlData.currentElement && controlData.currentLocation && controlData.currentTitle !== undefined && !p_Control.noPush) {
					if (!window.history.state) {
						window.history.replaceState({ location: controlData.currentLocation.replace(p_Control.contentBaseLocation, ""), id: p_Control.getAttribute("id"), title: controlData.currentTitle }, controlData.currentTitle, (p_Control.addLocationToUrl) ? `#${controlData.currentLocation.replace(p_Control.contentBaseLocation, "")}` : undefined);
					}
					window.history.pushState({ location: location.replace(p_Control.contentBaseLocation, ""), id: p_Control.getAttribute("id"), title: p_Control.getAttribute("page-title") }, p_Control.getAttribute("page-title"), (p_Control.addLocationToUrl) ? `#${location.replace(p_Control.contentBaseLocation, "")}` : undefined);
				}
			}
			controlData.currentElement = element;
			controlData.elementInstance = null;
			controlData.currentLocation = location;
			controlData.currentTitle = p_Control.getAttribute("page-title");
			const createElement = () => {
				// test again because importing the document might be out of order
				if (!controlData.elementInstance || controlData.elementInstance.localName !== controlData.currentElement) {
					p_Control.$.container.innerHTML = "";
					controlData.elementInstance = document.createElement(controlData.currentElement);
					p_Control.$.container.appendChild(controlData.elementInstance);
					if (p_Control.pageTitle) {
						document.title = p_Control.pageTitle;
					}
					controlData.changeObserver.notify("change", { contentInstance: controlData.elementInstance, control: p_Control });
					if (controlData.onChange) {
						controlData.onChange(controlData.elementInstance);
					}
				}
			};

			if (!window.customElements.get(element)) {
				const head = document.querySelector("head");
				let script = head.querySelector(`script[src="${location}"]`);
				if (!script) {
					script = document.createElement("script");
					script.type = "module";
					script.src = location;
					head.appendChild(script);
				}
				script.addEventListener("load", createElement);
			} else {
				createElement();
			}
		}
	}
}

function setupStateHandling(p_Control) {
	const handleLoadState = (p_State, p_Anchor) => {
		if (p_Control.handleHistory) {
			p_Anchor = (p_Anchor || "").replace(/^#/, "");
			if (p_Anchor) {
				p_Control.noPush = true;
				p_Control.location = p_Anchor;
				p_Control.noPush = false;
			} else if (p_State && p_State.location) {
				if (p_State.id === p_Control.getAttribute("id")) {
					p_Control.noPush = true;
					p_Control.pageTitle = window.history.state.title;
					p_Control.location = window.history.state.location;
					p_Control.noPush = false;
				}
			} else {
				handleChangeLocation(p_Control);
			}
		}
	};

	const handlePopState = (p_Event) => {
		handleLoadState(p_Event.state, (p_Event.state) ? "" : document.location.hash);
	};

	handleLoadState(window.history.state, document.location.hash);

	window.addEventListener("popstate", handlePopState);
}

/**
 * Class to represent the vicowa-content-container custom element
 * This web component allows you to use other web components as your website content, to simply create a single page website
 * What it does is to create a web component of the given type and place that inside itself
 * It will take care of the browser history and importing of the external html when needed
 * @extends webComponentBaseClass
 * @property {string} location The location of the web component html file to load into the content container
 * @property {string} pageTitle Change the page title to this name  when the content is loaded
 * @property {boolean} addLocationToUrl Indicates if you want to add the loaded content to the url. This will append a hash and the path to the content (e.g. yourwebsite/#./content/my-page.html)
 * @property {string} contentBaseLocation Set the base location for your content web components. This will allow you to omit the full path when using the components and it will also omit the path from the url to make for shorter urls if the addLocationToUrl option is set
 */
class VicowaContentContainer extends webComponentBaseClass {
	static get is() { return componentName; }
	static get properties() {
		return {
			location: {
				type: String,
				reflectToAttribute: true,
				observer: handleChangeLocation,
			},
			pageTitle: {
				type: String,
				value: "",
				reflectToAttribute: true,
			},
			addLocationToUrl: {
				type: Boolean,
				value: false,
				reflectToAttribute: true,
			},
			contentBaseLocation: {
				type: String,
				value: "",
				reflectToAttribute: true,
				observer: handleChangeLocation,
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
		this[privateData] = {
			currentElement: null,
			currentLocation: null,
			currentTitle: "",
			elementInstance: null,
			onChange: null,
			changeObserver: observerFactory(),
		};
	}

	addChangeListener(callback) {
		this[privateData].changeObserver.addObserver("change", callback);
	}

	removeChangeListener(callback) {
		this[privateData].changeObserver.removeObserver("change", callback);
	}

	attached() {
		const controlData = this[privateData];
		controlData.onChange = this.onChange;
		Object.defineProperty(this, "onChange", {
			get() { return undefined; },
			set(p_Callback) { controlData.onChange = p_Callback; controlData.onChange(controlData.elementInstance); },
		});

		setupStateHandling(this);
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

window.customElements.define(componentName, VicowaContentContainer);
