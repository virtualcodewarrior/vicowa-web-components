import { VicowaInputBaseClass } from "../vicowa-input-base/vicowa-input-base.js";
import "../vicowa-string/vicowa-string.js";
import { createQuickAccess } from "../third_party/web-component-base-class/src/tools.js";

const componentName = "vicowa-single-selection";

function handleSelectionChange(p_Control, p_Element) {
	p_Control.value = p_Element.id;
}

function optionsChanged(p_Control) {
	p_Control.$.radioOptionContainer.innerHTML = "";
	p_Control.$.selectOptionContainer.innerHTML = "";
	if (p_Control.type) {
		switch (p_Control.type) {
			case "radio":
				(p_Control.options || []).forEach((p_Option) => {
					const item = document.importNode(p_Control.$.radioOption.content, true);
					const itemAccess = createQuickAccess(item, "name");
					itemAccess.optionLabelString.setAttribute("string", p_Option.displayText || "");
					itemAccess.optionLabel.setAttribute("for", p_Option.value);
					itemAccess.vicowaSelectionOption.id = p_Option.value;
					if (p_Control.value === p_Option.value) { itemAccess.optionContainer.setAttribute("checked", ""); } else { itemAccess.optionContainer.removeAttribute("checked"); }
					itemAccess.vicowaSelectionOption.checked = p_Control.value === p_Option.value;
					itemAccess.vicowaSelectionOption.addEventListener("change", () => {
						handleSelectionChange(p_Control, itemAccess.vicowaSelectionOption);
						p_Control.$$$('[name="option-container"] input').forEach((p_RadioOption) => {
							p_RadioOption.checked = p_Control.value === p_RadioOption.id;
							if (p_Control.value === p_RadioOption.id) {
								p_RadioOption.parentNode.setAttribute("checked", "");
							} else {
								p_RadioOption.parentNode.removeAttribute("checked");
							}
						});
					});
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
			case "select":
				(p_Control.options || []).forEach((p_Option) => {
					const item = document.importNode(p_Control.$.selectOption.content, true);
					const itemAccess = createQuickAccess(item, "name");
					itemAccess.optionLabelString.setAttribute("string", p_Option.displayText || "");
					itemAccess.optionContainer.id = p_Option.value;
					if (p_Control.value === p_Option.value) { itemAccess.optionContainer.setAttribute("checked", ""); } else { itemAccess.optionContainer.removeAttribute("checked"); }
					itemAccess.optionContainer.addEventListener("click", () => {
						handleSelectionChange(p_Control, itemAccess.optionContainer);
						p_Control.$$$('[name="option-container"]').forEach((p_OptionContainer) => {
							if (p_Control.value === p_OptionContainer.id) { p_OptionContainer.setAttribute("checked", ""); } else { p_OptionContainer.removeAttribute("checked"); }
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
				throw new Error("Invalid type specified");
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
				value: "radio",
				reflectToAttribute: true,
				observer: optionsChanged,
			},
			opened: {
				type: Boolean,
				value: false,
				reflectToAttribute: true,
			},
			hideLabel: {
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
		this.addAutoEventListener(this.$.dropdownControl, "click", (p_Event) => {
			this.opened = !this.opened;
			if (this.opened) {
				this.$.selectOptionContainer.style.width = `${this.$.dropdownControl.offsetWidth}px`;
			}
			p_Event.preventDefault();
			p_Event.cancelBubble = true;
			const handleOutsideClick = () => {
				this.opened = false;
				this.removeAutoEventListener(window, "click", handleOutsideClick);
			};
			this.addAutoEventListener(window, "click", handleOutsideClick);
		});
	}

	_handleValueChange() {
		if (this.type) {
			switch (this.type) {
				case "radio":
					this.$$$('[name="option-container"] input').forEach((p_RadioOption) => {
						p_RadioOption.checked = this.value === p_RadioOption.id;
						if (this.value === p_RadioOption.id) {
							p_RadioOption.parentNode.setAttribute("checked", "");
						} else {
							p_RadioOption.parentNode.removeAttribute("checked");
						}
					});
					break;
				case "select":
					this.$$$('[name="option-container"]').forEach((p_OptionContainer) => {
						if (this.value === p_OptionContainer.id) { p_OptionContainer.setAttribute("checked", ""); } else { p_OptionContainer.removeAttribute("checked"); }
					});
					break;
				default:
					throw new Error("Invalid type specified");
			}
		}
	}

	static get template() {
		return `
		    <template id="vicowa-single-selection">
				<style>
					:host {
						position: relative;
						display: block;
						box-sizing: border-box;
						width: var(--vicowa-single-selection-width, 150px);
					}
					:host([type="select"]) {
					}
					:host(:not([type="select"])) #dropdown-control {
						display: none;
					}
			
					#control-container {
						position: relative;
						display: flex;
						flex-direction: row;
					}
			
					#arrow {
						position: absolute;
						top: 7px;
						right: 5px;
						border-top: 8px solid var(--vicowa-single-selection-arrow-color, black);
						border-bottom: 8px solid transparent;
						border-left: 6px solid transparent;
						border-right: 6px solid transparent;
					}
			
					:host([opened]) #arrow {
						z-index: 1000;
					}
			
					label {
						flex: 0 0 auto;
					}
			
					#label {
						margin-right: 1em;
					}
			
					#input {
						position: relative;
						flex: 1 1 auto;
						overflow: hidden;
					}
			
					#dropdown-control {
						position: absolute;
						left: 0;
						top: 0;
						right: 0;
						bottom: 0;
					}
			
					#select-option-container {
						display: block;
						position: relative;
						overflow-x: hidden;
						overflow-y: auto;
						border: var(--vicowa-single-selection-border, 1px solid #bbb);
						background: var(--vicowa-single-selection-background, white);
					}
			
					.option-container {
						padding: 2px 5px;
						display: none;
						width: 100%;
						height: var(--vicowa-single-selection-height, auto);
					}
					:host([opened]) .option-container,
					:host(:not([type="select"])) .option-container,
					.option-container[checked] {
						display: block;
						cursor: pointer;
					}
			
					:host([opened]) .option-container[checked],
					:host([opened]) .option-container:hover {
						background: var(--vicowa-single-selection-selected-background, blue);
						color: var(--vicowa-single-selection-selected-color, white);
						--vicowa-icon-fill-color: var(--vicowa-single-selection-selected-color, white);
					}
			
					:host([opened]) #select-option-container {
						box-sizing: border-box;
						position: fixed;
						z-index: 1000;
					}
			
					:host([static][type="select"]) #arrow,
					:host([static]) .option-container:not([checked]),
					:host([static]) .option-container input {
						display: none;
					}
					:host([static]) #select-option-container,
					:host([static]) #radio-option-container {
						width: 100%;
						border: transparent;
						overflow: hidden;
						text-overflow: ellipsis;
					}
					:host([static]) label[name="option-label"] {
						max-width: 100%;
						overflow: hidden;
						text-overflow: ellipsis;
						display: inline-block;
					}
			
					:host([hide-label]) #label {
						display: none;
					}
				</style>
				<div id="control-container">
					<label for="input"><vicowa-string id="label"></vicowa-string></label>
					<div id="input">
						<div id="dropdown-control">
							<div id="select-option-container">
							</div>
							<div id="arrow"></div>
						</div>
						<div id="radio-option-container"></div>
					</div>
				</div>
				<vicowa-string id="error"></vicowa-string>
				<template id="radio-option">
					<div name="option-container" class="option-container">
						<input name="vicowa-selection-option" type="radio">
						<label name="option-label"><vicowa-string name="option-label-string" string=""></vicowa-string></label>
						<div name="child-container"></div>
					</div>
				</template>
				<template id="select-option">
					<div name="option-container" class="option-container">
						<vicowa-string name="option-label-string" string=""></vicowa-string>
						<div name="child-container"></div>
					</div>
				</template>
			</template>
		`;
	}
}

window.customElements.define(componentName, VicowaSingleSelection);
