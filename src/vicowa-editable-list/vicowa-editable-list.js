// vicowa-editable-list.js
// ////////////////////////////////////////////////////////////
// this web component will show a list of editable items
import { webComponentBaseClass } from "../third_party/web-component-base-class/src/webComponentBaseClass.js";
import "../third_party/lodash/lodash.js";

function createItem(p_EditableList, p_Done) {
	if (p_EditableList.factory) {
		const itemClone = document.importNode(p_EditableList.$.item.content, true);
		const item = p_EditableList.factory();
		const editArea = itemClone.querySelector(".edit-area");
		editArea.item = item;
		const save = itemClone.querySelector('[name="save"]');
		const listUpdate = () => {
			// create new work list for items
			const newWorkList = Array.from(p_EditableList.$.items.querySelectorAll(".edit-area")).map((p_Item) => p_Item.item.settings);
			// compare work list with real list
			if (!window._.isEqual(newWorkList, p_EditableList._workList)) {
				p_EditableList.items = p_EditableList._workList = newWorkList;
				if (p_EditableList.onChange) {
					p_EditableList.onChange(p_EditableList.items);
				}
			}
		};
		itemClone.querySelector('[name="editable-item"]').appendChild(item);
		p_EditableList.addAutoEventListener(itemClone.querySelector('[name="edit"]'), "click", () => {
			item.startEdit();
			editArea.classList.add("editing");
		});
		p_EditableList.addAutoEventListener(save, "click", () => {
			if (item.doSave()) {
				item.stopEdit();
				editArea.classList.remove("editing");
				listUpdate();
			}
		});
		p_EditableList.addAutoEventListener(itemClone.querySelector('[name="cancel"]'), "click", () => {
			item.doCancel();
			item.stopEdit();
			editArea.classList.remove("editing");
			if (!item.hasData) {
				editArea.parentElement.removeChild(editArea);
			}
		});
		p_EditableList.addAutoEventListener(itemClone.querySelector('[name="delete"]'), "click", () => {
			editArea.parentElement.removeChild(editArea);
			listUpdate();
		});
		item.onReady = () => { p_Done(item, editArea); };
		p_EditableList.$.items.appendChild(itemClone);

		item.onChange = () => {
			save.disabled = !item.valid;
		};
	} else {
		throw new Error("a factory function should be specified");
	}
}

function headingChanged(p_EditableList) {
	p_EditableList.$.heading.string = p_EditableList.heading;
}

function itemsChanged(p_EditableList) {
	p_EditableList.$.items.innerHTML = "";

	if (p_EditableList.items) {
		p_EditableList._workList = window._.cloneDeep(p_EditableList.items);
		p_EditableList._workList.forEach((p_ItemData) => {
			createItem(p_EditableList, (p_Item) => {
				if (p_ItemData) {
					p_Item.settings = window._.cloneDeep(p_ItemData);
				}
			});
		});
	}
}


const componentName = "vicowa-editable-list";
class VicowaEditableList extends webComponentBaseClass {
	/**
	 * return this web components name
	 * @returns {String} The name of this element
	 */
	static get is() { return componentName; }
	/**
	 * constructor
	 */
	constructor() {
		super();
		this.factory = null;
		this._valid = true;
		this._originalList = [];
	}

	get valid() { return this._valid; }

	/**
	 * The properties for this component
	 * @returns {Object} The properties for this component
	 */
	static get properties() {
		return {
			items: {
				type: Array,
				observer: itemsChanged,
			},
			heading: {
				type: String,
				value: "",
				observer: headingChanged,
			},
			static: {
				type: Boolean,
				value: false,
				reflectToAttribute: true,
			},
		};
	}

	attached() {
		this.$.heading.string = this.heading;
		this.addAutoEventListener(this.$.add, "click", () => {
			createItem(this, (p_Item, p_EditArea) => {
				p_Item.startEdit();
				p_EditArea.classList.add("editing");
			});
		});
	}
}

window.customElements.define(componentName, VicowaEditableList);
