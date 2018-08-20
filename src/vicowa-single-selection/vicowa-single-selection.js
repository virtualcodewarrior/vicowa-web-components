import { VicowaInputBaseClass } from '../vicowa-input-base/vicowa-input-base.js';
import { createQuickAccess } from '../third_party/web-component-base-class/dist/tools.js';

const componentName = 'vicowa-single-selection';

function handleSelectionChange(p_Control, p_Element) {
	p_Control.value = p_Element.id;
}

function optionsChanged(p_Control) {
	p_Control.$.radioOptionContainer.innerHTML = '';
	p_Control.$.selectOptionContainer.innerHTML = '';
	if (p_Control.type) {
		switch (p_Control.type) {
			case 'radio':
				p_Control.options.forEach((p_Option) => {
					const item = document.importNode(p_Control.$.radioOption.content, true);
					const itemAccess = createQuickAccess(item, 'name');
					itemAccess.optionLabelString.setAttribute('string', p_Option.displayText || '');
					itemAccess.optionLabel.setAttribute('for', p_Option.value);
					itemAccess.vicowaSelectionOption.id = p_Option.value;
					itemAccess.vicowaSelectionOption.checked = p_Control.value === p_Option.value;
					itemAccess.vicowaSelectionOption.addEventListener('change', () => { handleSelectionChange(p_Control, itemAccess.vicowaSelectionOption); });
					const childElement = (p_Option.childElementName) ? document.createElement(p_Option.childElementName) : (p_Option.childElement || null);
					if (childElement) {
						itemAccess.childContainer.appendChild(childElement);
					}
					p_Control.$.radioOptionContainer.appendChild(item);
					if (p_Option.childElementName && childElement) {
						childElement.onAttached = () => { childElement.option = p_Option; };
					}
				});
				break;
			case 'select':
				p_Control.options.forEach((p_Option) => {
					const item = document.importNode(p_Control.$.selectOption.content, true);
					const itemAccess = createQuickAccess(item, 'name');
					itemAccess.optionLabelString.setAttribute('string', p_Option.displayText || '');
					itemAccess.optionContainer.id = p_Option.value;
					if (p_Control.value === p_Option.value) { itemAccess.optionContainer.setAttribute('checked', ''); } else { itemAccess.optionContainer.removeAttribute('checked'); }
					itemAccess.optionContainer.addEventListener('click', () => {
						handleSelectionChange(p_Control, itemAccess.optionContainer);
						p_Control.$$$('[name="option-container"]').forEach((p_OptionContainer) => {
							if (p_Control.value === p_OptionContainer.id) { p_OptionContainer.setAttribute('checked', ''); } else { p_OptionContainer.removeAttribute('checked'); }
						});
					});
					const childElement = (p_Option.childElementName) ? document.createElement(p_Option.childElementName) : (p_Option.childElement || null);
					if (childElement) {
						itemAccess.childContainer.appendChild(childElement);
					}
					p_Control.$.selectOptionContainer.appendChild(item);
					if (p_Option.childElementName && childElement) {
						childElement.onAttached = () => { childElement.option = p_Option; };
					}
				});
				break;
			default:
				throw new Error('Invalid type specified');
		}
	}
}

/**
 * Class to represent the vicowa-single-selection custom element
 * @extends VicowaInputBaseClass
 */
class VicowaSingleSelection extends VicowaInputBaseClass {
	static get is() { return componentName; }
	constructor() {
		super();
	}

	static get properties() {
		return Object.assign({}, super.properties, {
			options: {
				type: Array,
				value: [],
				observer: optionsChanged,
			},
			type: {
				type: String,
				value: 'radio',
				reflectToAttribute: true,
				observer: optionsChanged,
			},
			opened: {
				type: Boolean,
				value: false,
				reflectToAttribute: true,
			},
		});
	}

	updateTranslation() {
		super.updateTranslation();
	}

	attached() {
		this.addAutoEventListener(this.$.dropdownControl, 'click', (p_Event) => {
			this.opened = !this.opened;
			if (this.opened) {
				this.$.selectOptionContainer.style.width = `${this.$.dropdownControl.offsetWidth}px`;
			}
			p_Event.preventDefault();
			p_Event.cancelBubble = true;
			const handleOutsideClick = () => {
				this.opened = false;
				this.removeAutoEventListener(window, 'click', handleOutsideClick);
			};
			this.addAutoEventListener(window, 'click', handleOutsideClick);
		});
	}
}

window.customElements.define(componentName, VicowaSingleSelection);
