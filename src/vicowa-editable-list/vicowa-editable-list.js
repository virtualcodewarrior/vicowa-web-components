// vicowa-editable-list.js
// ////////////////////////////////////////////////////////////
// this web component will show a list of editable items
import { webComponentBaseClass } from "../third_party/web-component-base-class/src/webComponentBaseClass.js";
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
		const save = itemClone.querySelector('[name="save"]');
		const listUpdate = () => {
			// create new work list for items
			const newWorkList = Array.from(p_Control.$.items.querySelectorAll(".edit-area")).map((p_Item) => p_Control.itemInterface.getItemData(p_Item.item));
			// compare work list with real list
			if (!window._.isEqual(newWorkList, listData.workList)) {
				const oldItems = listData.retrievedData.items;
				listData.retrievedData.items = listData.workList = newWorkList;
				if (p_Control.onChange) {
					const newOrModifiedItems = window._.differenceWith(newWorkList, oldItems, window._.isEqual);
					const newItems = newOrModifiedItems.filter((p_Item) => p_Item[originalItem] === undefined);
					const modifiedItems = newOrModifiedItems.filter((p_Item) => p_Item[originalItem] !== undefined);
					const removedItems = window._.differenceWith(oldItems, newWorkList, window._.isEqual).filter((p_Item) => !modifiedItems.find((p_TestItem) => p_TestItem[originalItem] === p_Item[originalItem]));
					p_Control.onChange(listData.retrievedData.items, oldItems, { newItems, modifiedItems, removedItems });
				}
			}
		};
		itemClone.querySelector('[name="editable-item"]').appendChild(item);
		p_Control.addAutoEventListener(itemClone.querySelector('[name="edit"]'), "click", () => {
			p_Control.itemInterface.startEdit(item);
			editArea.classList.add("editing");
		});
		p_Control.addAutoEventListener(save, "click", () => {
			if (p_Control.itemInterface.doSave(item)) {
				p_Control.itemInterface.stopEdit(item);
				editArea.classList.remove("editing");
				listUpdate();
			}
		});
		p_Control.addAutoEventListener(itemClone.querySelector('[name="cancel"]'), "click", () => {
			p_Control.itemInterface.doCancel(item);
			p_Control.itemInterface.stopEdit(item);
			editArea.classList.remove("editing");
			if (!p_Control.itemInterface.hasData(item)) {
				editArea.parentElement.removeChild(editArea);
			}
		});
		p_Control.addAutoEventListener(itemClone.querySelector('[name="delete"]'), "click", async() => {
			const continueDelete = await p_Control.continueDelete(editArea.item);
			if (continueDelete) {
				editArea.parentElement.removeChild(editArea);
				listUpdate();
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
	listData.retrievedData.items = listData.retrievedData.items.map((p_Item, p_Index) => { p_Item[originalItem] = p_Index; return p_Item; });
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
		this.continueDelete = async() => true;
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
}

window.customElements.define(componentName, VicowaEditableList);
