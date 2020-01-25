// vicowa-editable-list.js
// ////////////////////////////////////////////////////////////
// this web component will show a list of editable items
import { webComponentBaseClass } from "../third_party/web-component-base-class/src/webComponentBaseClass.js";
import "../vicowa-string/vicowa-string.js";
import "../vicowa-input/vicowa-input.js";
import "../third_party/lodash/lodash.js";
import debug from "../utilities/debug.js";

const privateData = Symbol("privateData");
const originalItem = Symbol("originalItem");

function createItem(p_Control, p_Done) {
	if (p_Control.factory) {
		const listData = p_Control[privateData];
		const itemClone = document.importNode(p_Control.$.item.content, true);
		const item = p_Control.factory();
		const editArea = itemClone.querySelector(".edit-area");
		editArea.item = item;
		const save = itemClone.querySelector("[name=\"save\"]");
		const listUpdate = () => {
			// create new work list for items
			const newWorkList = Array.from(p_Control.$.items.querySelectorAll(".edit-area")).map((p_Item) => p_Control.itemInterface.getItemData(p_Item.item));
			// compare work list with real list
			if (!window._.isEqual(newWorkList, listData.workList)) {
				const oldItems = listData.retrievedData.items;
				listData.retrievedData.items = window._.cloneDeepWith(newWorkList);
				listData.workList = window._.cloneDeepWith(listData.retrievedData.items);
				if (p_Control.onChange) {
					const newOrModifiedItems = window._.differenceWith(newWorkList, oldItems, window._.isEqual);
					const newItems = newOrModifiedItems.filter((p_Item) => p_Item[originalItem] === undefined);
					const modifiedItems = newOrModifiedItems.filter((p_Item) => p_Item[originalItem] !== undefined);
					const removedItems = window._.differenceWith(oldItems, newWorkList, window._.isEqual).filter((p_Item) => !modifiedItems.find((p_TestItem) => p_TestItem[originalItem] === p_Item[originalItem]));
					p_Control.onChange(listData.retrievedData.items, oldItems, { newItems, modifiedItems, removedItems });
				}
			}
		};
		const applyActions = {
			startEditing() {
				editArea.classList.add("editing");
			},
			update() { listUpdate(); },
			stopEditing() {
				editArea.classList.remove("editing");
			},
			removeEditArea() { editArea.parentElement.removeChild(editArea); },
		};

		itemClone.querySelector("[name=\"editable-item\"]").appendChild(item);
		item.applyActions = applyActions;
		p_Control.addAutoEventListener(itemClone.querySelector("[name=\"edit\"]"), "click", () => {
			p_Control.itemInterface.startEdit(item);
			applyActions.startEditing();
		});
		p_Control.addAutoEventListener(save, "click", () => {
			if (p_Control.itemInterface.doSave(item)) {
				p_Control.itemInterface.stopEdit(item);
				applyActions.stopEditing();
				applyActions.update();
			}
		});
		p_Control.addAutoEventListener(itemClone.querySelector("[name=\"cancel\"]"), "click", () => {
			p_Control.itemInterface.doCancel(item);
			p_Control.itemInterface.stopEdit(item);
			applyActions.stopEditing();
			if (!p_Control.itemInterface.hasData(item)) {
				applyActions.removeEditArea();
			}
		});
		p_Control.addAutoEventListener(itemClone.querySelector("[name=\"delete\"]"), "click", async () => {
			const continueDelete = await p_Control.continueDelete(editArea.item);
			if (continueDelete) {
				applyActions.removeEditArea();
				applyActions.update();
			}
		});
		p_Control.itemInterface.setReadyHandler(item, () => { p_Done(item, editArea); });
		p_Control.itemInterface.setChangeHandler(item, () => { save.disabled = !p_Control.itemInterface.isValid(item); });

		p_Control.$.items.appendChild(itemClone);
	} else {
		throw new Error("a factory function should be specified");
	}
}

function updateJumpButton(p_Control) {
	const listData = p_Control[privateData];
	const value = parseInt(p_Control.$.jumpTo.value, 10);
	p_Control.$.jump.disabled = isNaN(value) || value < 1 || value > Math.ceil(listData.retrievedData.totalItemCount / p_Control.maxPageItems);
}

async function fillList(p_Control, p_Start, p_Count, p_Filter) {
	const listData = p_Control[privateData];
	listData.startItem = p_Start;
	listData.retrievedData = await p_Control.getData(p_Start, p_Count, p_Filter);
	listData.retrievedData.items = listData.retrievedData.items.map((p_Item, p_Index) => {
		p_Item[originalItem] = p_Index;
		return p_Item;
	});
	p_Control.classList.toggle("pages", listData.retrievedData.totalItemCount > p_Control.maxPageItems);
	const pageContainer = p_Control.$.pageLinks;
	pageContainer.innerHTML = "";

	if (listData.retrievedData.totalItemCount > p_Control.maxPageItems) {
		const currentPage = Math.ceil(p_Start / p_Control.maxPageItems);
		const pages = Math.ceil(listData.retrievedData.totalItemCount / p_Control.maxPageItems);

		updateJumpButton(p_Control);

		if (pages > 10) {
			if (currentPage > 4) {
				const firstButton = document.createElement("button");
				firstButton.addEventListener("click", () => {
					fillList(p_Control, 0, p_Control.maxPageItems, p_Filter);
				});
				firstButton.textContent = "1";
				pageContainer.appendChild(firstButton);
				if (currentPage > 5) {
					const spacerBefore = document.createElement("span");
					spacerBefore.textContent = "...";
					pageContainer.appendChild(spacerBefore);
				}
			}
			const startIndex = Math.min(pages - 8, Math.max(currentPage - 4, 0));
			const end = Math.min(startIndex + 8, pages);
			for (let index = startIndex; index < end; index++) {
				const button = document.createElement("button");
				button.addEventListener("click", () => {
					fillList(p_Control, index * p_Control.maxPageItems, p_Control.maxPageItems, p_Filter);
				});
				button.textContent = index + 1;
				if (index === currentPage) {
					button.disabled = true;
					button.classList.add("active");
				}
				pageContainer.appendChild(button);
			}
			if (pages - currentPage > 4) {
				if (pages - currentPage > 5) {
					const spacerAfter = document.createElement("span");
					spacerAfter.textContent = "...";
					pageContainer.appendChild(spacerAfter);
				}
				const lastButton = document.createElement("button");
				lastButton.addEventListener("click", () => {
					fillList(p_Control, (pages - 1) * p_Control.maxPageItems, p_Control.maxPageItems, p_Filter);
				});
				lastButton.textContent = pages;
				pageContainer.appendChild(lastButton);
			}
		} else {
			for (let index = 0; index < pages; index++) {
				const button = document.createElement("button");
				button.addEventListener("click", () => {
					fillList(p_Control, index * p_Control.maxPageItems, p_Control.maxPageItems, p_Filter);
				});
				button.textContent = index + 1;
				if (index === currentPage) {
					button.disabled = true;
					button.classList.add("active");
				}
				pageContainer.appendChild(button);
			}
		}
	}

	if (listData.retrievedData.items) {
		listData.workList = window._.cloneDeepWith(listData.retrievedData.items);
		const editAreas = Array.from(p_Control.$.items.children);
		for (let index = listData.retrievedData.items.length; index < editAreas.length; index++) {
			p_Control.$.items.removeChild(editAreas[index]);
		}
		listData.workList.forEach((p_ItemData, p_Index) => {
			if (p_Index < editAreas.length) {
				p_Control.itemInterface.setItemData(editAreas[p_Index].item, window._.cloneDeep(p_ItemData));
			} else {
				createItem(p_Control, (p_Item) => {
					if (p_ItemData) {
						p_Control.itemInterface.setItemData(p_Item, window._.cloneDeep(p_ItemData));
					}
				});
			}
		});
	} else {
		p_Control.$.items.innerHTML = "";
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
		this[privateData] = {
			startItem: 0,
			workList: [],
			retrievedData: {
				items: [],
				totalItemCount: 0,
			},
		};
		this.factory = null;
		this.getData = null;
		this.continueDelete = async () => true;
		this.itemInterface = {
			setItemData(p_Item, p_Data) { p_Item.data = p_Data; },
			getItemData(p_Item) { return p_Item.data; },
			startEdit(p_Item) { p_Item.startEdit(); },
			stopEdit(p_Item) { p_Item.stopEdit(); },
			doSave(p_Item) { return p_Item.doSave(); },
			doCancel(p_Item) { p_Item.doCancel(); },
			hasData(p_Item) { return p_Item.hasData; },
			setReadyHandler(p_Item, p_Callback) { p_Item.onReady = p_Callback; },
			setChangeHandler(p_Item, p_Callback) { p_Item.onChange = p_Callback; },
			isValid(p_Item) { return p_Item.valid; },
		};
	}

	get valid() { return this[privateData].valid; }

	/**
	 * The properties for this component
	 * @returns {Object} The properties for this component
	 */
	static get properties() {
		return {
			static: {
				type: Boolean,
				value: false,
				reflectToAttribute: true,
			},
			maxPageItems: {
				type: Number,
				value: 100,
				reflectToAttribute: true,
			},
			filter: {
				type: Boolean,
				value: false,
				reflectToAttribute: true,
			},
			noEdit: {
				type: Boolean,
				value: false,
				reflectToAttribute: true,
			},
			noDelete: {
				type: Boolean,
				value: false,
				reflectToAttribute: true,
			},
			noAdd: {
				type: Boolean,
				value: false,
				reflectToAttribute: true,
			},
			noSave: {
				type: Boolean,
				value: false,
				reflectToAttribute: true,
			},
			noCancel: {
				type: Boolean,
				value: false,
				reflectToAttribute: true,
			},
			select: {
				type: Boolean,
				value: false,
				reflectToAttribute: true,
			},
			single: {
				type: Boolean,
				value: false,
				reflectToAttribute: true,
			},
			multi: {
				type: Boolean,
				value: false,
				reflectToAttribute: true,
			},
		};
	}

	attached() {
		this.addAutoEventListener(this.$.add, "click", () => {
			createItem(this, (p_Item, p_EditArea) => {
				this.itemInterface.startEdit(p_Item);
				p_EditArea.classList.add("editing");
			});
		});

		this.$.jumpTo.onChange = () => {
			updateJumpButton(this);
		};

		this.addAutoEventListener(this.$.jump, "click", () => {
			const value = parseInt(this.$.jumpTo.value, 10);
			fillList(this, (value - 1) * this.maxPageItems, this.maxPageItems, this.$.filter.value);
		});

		this.addAutoEventListener(this.$.items, "click", (p_Event) => {
			if (this.select) {
				const item = p_Event.target.closest(".edit-area");
				if (item) {
					if (this.single) {
						this.$$$("#items .edit-area").forEach((p_Item) => {
							p_Item.classList.remove("selected");
						});
						item.classList.add("selected");
					} else if (this.multi) {
						item.classList.toggle("selected");
					}
				}
				if (this.onSelect) {
					this.onSelect(this.$$$("#items .edit-area").filter((p_Item) => p_Item.classList.contains("selected")).map((p_Item) => this.itemInterface.getItemData(p_Item.item)));
				}
			}
		});

		updateJumpButton(this);
	}

	/**
	 * @typedef itemInterface
	 * @type {object}
	 * @prop {function} setItemData Should be a function that sets the data on the item, it will receive the item and a data object
	 * @prop {function} getItemData Should be a function that gets the data on the item, it will receive the item and should return the data
	 * @prop {function} startEdit Should be a function that start edit mode on the item, it will receive the item as the only parameter
	 * @prop {function} stopEdit Should be a function that stops edit mode on the item, it will receive the item as the only parameter
	 * @prop {function} doSave Should be a function that saves data back into the item, it will receive the item as the only parameter, the function should return true if it can save (because it is valid) or false if it cannot save (because of invalid data for instance),
	 * @prop {function} doCancel Should be a function that cancels changes made on the item, it will receive the item as the only parameter
	 * @prop {function} hasData Should be a function that returns true when enough valid data exists on the item to be valid, it will receive the item as the only parameter
	 * @prop {function} setReadyHandler Should be a function that sets the given callback on the item to be called when the item is ready, it will receive the item and the callback function (this is mostly useful for web components so they can call back when they have been attached)
	 * @prop {function} setChangeHandler Should be a function that sets the given callback on the item to be called when the item is changed, it will receive the item and the callback function
	 * @prop {function} isValid Should be a function that returns true when the item is valid or false otherwise, it will receive the item as the only parameter
	 */
	/**
	 *
	 * @param {[itemInterface]} p_ItemInterface Optional interface for the items, if this is not specified, the items themselves should provide this functionality on their own interface
	 * If the itemInterface parameter is not given the following interface is assumed to be on each item :
	 * set data // setter to set the data
	 * get data // getter to get the data
	 * function startEdit() // function to start editing
	 * function stopEdit() // function to stop editing
	 * function doSave() { return Boolean; } // function to save modified data in the item data, returning true if it can save or false if it cannot save
	 * function doCancel() // function to cancel any data changes and restore original data
	 * get hasData // getter to see if sufficient data for a valid object is available
	 * variable onReady // item member that should receive a callback function and will be called by the item when it is ready
	 * variable onChange // item member that should receive a callback function and will be called by the item when it is changed
	 * get valid // getter to see if the data is valid
	 */
	initialize(p_ItemInterface) {
		const required = ["setItemData", "getItemData", "startEdit", "stopEdit", "doSave", "doCancel", "hasData", "setReadyHandler", "setChangeHandler", "isValid"];
		debug.assert(!p_ItemInterface || required.every((p_Key) => typeof p_ItemInterface[p_Key] === "function"), "setItemData, startEdit, stopEdit, doSave, doCancel, hasData, setReadyHandler, setChangeHandler and isValid should be functions");

		this.$.filter.onChange = window._.debounce(() => { fillList(this, 0, this.maxPageItems, this.$.filter.value); }, 250);
		this.itemInterface = p_ItemInterface || this.itemInterface;
		this.reloadData();
	}

	reloadData() {
		const listData = this[privateData];
		fillList(this, listData.startItem, this.maxPageItems, this.$.filter.value || "");
	}

	static get template() {
		return `
			<style>
				:host {
					display: block;
					position: relative;
					overflow: auto;
				}
		
				:host([static]) #add,
					div[name="edit-area"].editing [name="edit"],
					div[name="edit-area"].editing [name="delete"],
				:host([static]) [name="edit"],
				:host([static]) [name="delete"],
				:host([static]) [name="save"],
					div[name="edit-area"]:not(.editing) [name="save"],
					div[name="edit-area"]:not(.editing) [name="cancel"] {
					display: none;
				}
		
				.edit-area,
				.button-area {
					box-sizing: border-box;
					display: flex;
					flex-direction: row;
				}
		
				#items .edit-area:not(.editing) {
					background: var(--vicowa-editable-list-item-background, transparent);
					border: var(--vicowa-editable-list-item-border, 0);
					border-bottom: 0;
				}
		
				#items .edit-area:not(.editing):last-child {
					border: var(--vicowa-editable-list-item-border, 0);
				}
		
				#items .edit-area:nth-child(even):not(.editing) {
					background: var(--vicowa-editable-list-item-even-background, transparent);
				}
		
				.button-area {
					padding-right: 5px;
					width: var(--vicowa-editable-list-button-area-width, auto);
				}
		
				.edit-area.editing {
					flex-direction: column;
					margin: 1em;
					padding: 1em;
					box-shadow: 0 0 6px gray;
				}
		
				.filter {
					margin-bottom: 1em;
				}
		
				#pages {
					margin-bottom: 1em;
					display: flex;
				}
		
				:host(:not([filter])) .filter,
				:host(:not(.pages)) #pages,
				:host([no-edit]) button[name="edit"],
				:host([no-delete]) button[name="delete"],
				:host([no-save]) button[name="save"],
				:host([no-cancel]) button[name="cancel"],
				:host([no-add]) #add {
					display: none;
				}
		
				#page-links {
					margin-right: 1em;
				}
		
				.edit-area.editing .button-area {
					order: 2;
				}
		
				#add {
					margin-top: 5px;
				}
		
				:host([select]) .edit-area,
				:host([select]) vicowa-input,
				:host([select]) .edit-area:hover {
					cursor: pointer;
				}
		
				:host([select]) #items .edit-area:not(.editing):hover {
					background: var(--vicowa-editable-list-hover-background, #88f);
					color: var(--vicowa-editable-list-hover-color, white);
				}
				:host([select]) #items .edit-area:not(.editing).selected {
					background: var(--vicowa-editable-list-select-background, blue);
					color: var(--vicowa-editable-list-select-color, white);
				}
			</style>
			<div>
			<div class="item-area">
				<vicowa-input class="filter" id="filter" label="Filter items"></vicowa-input>
				<div id="pages">
					<div id="page-links"></div>
					<vicowa-input id="jump-to" hide-label></vicowa-input>
					<button id="jump"><vicowa-string>Jump to page</vicowa-string></button>
				</div>
				<p><vicowa-string id="heading" string=""></vicowa-string></p>
				<slot name="header"></slot>
					<div id="items">
					</div>
					<div class="button-area">
						<button id="add"><vicowa-string>Add</vicowa-string></button>
					</div>
				</div>
			</div>
			<template id="item">
				<div name="edit-area" class="edit-area">
					<div class="button-area">
						<button name="edit"><vicowa-string>Edit</vicowa-string></button>
						<button name="delete"><vicowa-string>Delete</vicowa-string></button>
						<button name="save"><vicowa-string>Save</vicowa-string></button>
						<button name="cancel"><vicowa-string>Cancel</vicowa-string></button>
					</div>
					<div name="editable-item">
					</div>
				</div>
			</template>
		`;
	}
}

window.customElements.define(componentName, VicowaEditableList);
