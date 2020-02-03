import { webComponentBaseClass } from '/third_party/we-component-base-class/src/webComponentBaseClass.js';

const componentName = 'vicowa-route';
window.customElements.define(componentName, class extends webComponentBaseClass {
	static get is() { return componentName; }

	constructor() {
		super();
		// extra required initialization goes here ...
	}

	// here we add some properties to this web component
	static get properties() {
		return {
			route: {
				type: String, // (required) the type of the property, one of Array, Boolean, Number, Object, String
				reflectToAttribute: true, // (optional) indicate if you want the component attribute to always reflect the current property value
				observer: (component) => { }, // (optional) the name or a symbol for a function in the class to be called when the value of the property is changed
			}
		};
	}

// optional callback function that will be called after this instance of the web component
// has been added to the DOM
attached()
{
	// extra initialization that only can be done after an instance of the class has been attached to the DOM
}

// optional callback function that will be called after this instance of the web component has been removed from the DOM
detached()
{
	// extra cleanup that only can be done after an instance of the class has been removed from the DOM
}

// string representation of the template to use with this web component
// note that providing the template element is optional and that if the template wrapper is not provided
// the whole content will be wrapped within a template element
static
get
template()
{
	return `
            <style>
                /* put you styling here */
            </style>
            <!-- The content of the template goes here -->
        `;
}
})
;
