import { webComponentBaseClass } from "../third_party/web-component-base-class/src/webComponentBaseClass.js";

const componentName = "vicowa-hierarchical-palette";

const privateData = Symbol("privateData");
const itemData = Symbol("itemData");

function updateScrollButtons(p_Control) {
	const controlData = p_Control[privateData];
	const size = (p_Control.horizontal) ? p_Control.$.container.offsetWidth : p_Control.$.container.offsetHeight;
	controlData.pageSize = Math.floor(size / p_Control.itemSize);
	p_Control.$.moveToStart.classList.toggle("disabled", (p_Control.horizontal) ? p_Control.$.itemsContainer.scrollLeft === 0 : p_Control.$.itemsContainer.scrollTop === 0);
	p_Control.$.moveToEnd.classList.toggle("disabled", (p_Control.horizontal) ? p_Control.$.itemsContainer.scrollLeft >= p_Control.$.itemsContainer.scrollWidth - p_Control.$.itemsContainer.offsetWidth : p_Control.$.itemsContainer.scrollTop >= p_Control.$.itemsContainer.scrollHeight - p_Control.$.itemsContainer.offsetHeight);
	p_Control.$.back.classList.toggle("disabled", controlData.path.length === 0);
}

async function fillPaletteItems(p_Control, p_Target) {
	p_Target = p_Target || p_Control.$.itemsContainer;
	if (p_Control.getData) {
		if (p_Control.horizontal) {
			p_Control.style.height = `${p_Control.paletteSize}px`;
			p_Control.$.containersContainer.style.height = `${p_Control.paletteSize * 3}px`;
			p_Control.$.containersContainer.style.top = `${-p_Control.paletteSize}px`;
		} else {
			p_Control.style.width = `${p_Control.paletteSize}px`;
			p_Control.$.containersContainer.style.width = `${p_Control.paletteSize * 3}px`;
			p_Control.$.containersContainer.style.left = `${-p_Control.paletteSize}px`;
		}
		const size = (p_Control.horizontal) ? p_Control.$.container.offsetWidth : p_Control.$.container.offsetHeight;
		const controlData = p_Control[privateData];
		controlData.fillSequenceIndex++;
		p_Control.itemSize = Math.max(p_Control.itemSize, 10); // minimal size = 10px
		controlData.pageSize = Math.ceil(size / p_Control.itemSize) + 6; // 3 additional on each side
		controlData.items = await p_Control.getData((controlData.activePaletteRoot !== "root") ? controlData.activePaletteRoot : null, 0, 100);
		while (controlData.items.items.length < controlData.items.totalItemCount) {
			const additionalItems = await p_Control.getData((controlData.activePaletteRoot !== "root") ? controlData.activePaletteRoot : null, controlData.items.items.length, 100);
			controlData.items.items = controlData.items.items.concat(additionalItems.items);
		}

		p_Target.innerHTML = "";
		Array.from(p_Control.querySelectorAll(`[slot^="item-slot-${controlData.fillSequenceIndex}-"]`)).forEach((p_Item) => p_Control.removeChild(p_Item));
		controlData.items.items.forEach((p_Item, p_Index) => {
			const itemContainer = document.importNode(p_Control.$.itemTemplate.content, true).querySelector('div[name="item-container"]');
			itemContainer[itemData] = p_Item;
			itemContainer.style.width = (p_Control.horizontal) ? `${p_Control.itemSize}px` : "";
			itemContainer.style.height = (p_Control.horizontal) ? "" : `${p_Control.itemSize}px`;
			if (p_Item.subLevel) {
				itemContainer.classList.add("sub-level");
			}
			const itemContent = p_Control.factory(p_Item);
			const slot = itemContainer.querySelector("slot");
			slot.name = `item-slot-${controlData.fillSequenceIndex}-${p_Index}`;
			itemContent.slot = slot.name;
			p_Control.appendChild(itemContent);
			// itemContainer.appendChild(itemContent);
			p_Target.appendChild(itemContainer);
			itemContainer.addEventListener("click", async() => {
				if (p_Item.subLevel) {
					p_Control.$.back.setAttribute("target", controlData.activePaletteRoot || "root");
					controlData.path.push({
						target: controlData.activePaletteRoot || "root",
						scrollOffset: (p_Control.horizontal) ? p_Control.$.itemsContainer.scrollLeft : p_Control.$.itemsContainer.scrollTop,
					});
					controlData.activePaletteRoot = p_Item.path;
					await fillPaletteItems(p_Control, p_Control.$.nextItemsContainer);
					p_Control.$.containersContainer.classList.add("animate");
					p_Control.$.nextItemsContainer.scrollLeft = p_Control.$.nextItemsContainer.scrollTop = 0;

					if (p_Control.horizontal) {
						p_Control.$.containersContainer.style.top = `${-p_Control.paletteSize * 2}px`;
					} else {
						p_Control.$.containersContainer.style.left = `${-p_Control.paletteSize * 2}px`;
					}
				} else if (p_Control.onClick) {
					p_Control.onClick(p_Item);
				}
			});
		});
	}
	updateScrollButtons(p_Control);
}

class VicowaHierarchicalPalette extends webComponentBaseClass {
	static get is() { return componentName; }
	constructor() {
		super();
		this.getData = null;
		this.factory = null;
		this[privateData] = {
			activePaletteRoot: null,
			pageSize: 10,
			items: { items: [], totalItemCount: 0 },
			path: [],
			fillSequenceIndex: 0,
		};
	}

	static get properties() {
		return {
			paletteSize: {
				type: Number,
				value: 50,
				reflectToAttribute: true,
				observer: fillPaletteItems,
			},
			itemSize: {
				type: Number,
				value: 50,
				reflectToAttribute: true,
				observer: fillPaletteItems,
			},
			horizontal: {
				type: Boolean,
				value: false,
				reflectToAttribute: true,
				observer: fillPaletteItems,
			},
		};
	}

	attached() {
		const controlData = this[privateData];
		this.$.resizeDetector.addObserver(() => {
			updateScrollButtons(this);
		}, this);

		const handleMoveToStart = () => {
			if (this.horizontal) {
				this.$.itemsContainer.scrollLeft -= 10;
			} else {
				this.$.itemsContainer.scrollTop -= 10;
			}
			const interval = setInterval(() => {
				if (this.horizontal) {
					this.$.itemsContainer.scrollLeft -= 10;
				} else {
					this.$.itemsContainer.scrollTop -= 10;
				}
				updateScrollButtons(this);
			}, 100);
			const handleMouseUp = () => {
				window.removeEventListener("mouseup", handleMouseUp);
				clearInterval(interval);
			};
			window.addEventListener("mouseup", handleMouseUp, true);
		};

		const handleMoveToEnd = () => {
			if (this.horizontal) {
				this.$.itemsContainer.scrollLeft += 10;
			} else {
				this.$.itemsContainer.scrollTop += 10;
			}
			const interval = setInterval(() => {
				if (this.horizontal) {
					this.$.itemsContainer.scrollLeft += 10;
				} else {
					this.$.itemsContainer.scrollTop += 10;
				}
				updateScrollButtons(this);
			}, 100);
			const handleMouseUp = () => {
				window.removeEventListener("mouseup", handleMouseUp);
				clearInterval(interval);
			};
			window.addEventListener("mouseup", handleMouseUp, true);
		};

		this.addAutoEventListener(this.$.moveToStart, "mousedown", handleMoveToStart);
		this.addAutoEventListener(this.$.moveToEnd, "mousedown", handleMoveToEnd);

		this.addAutoEventListener(this.$.itemsContainer, "wheel", (p_Event) => {
			if (this.horizontal) {
				this.$.itemsContainer.scrollLeft += p_Event.deltaY;
			} else {
				this.$.itemsContainer.scrollTop += p_Event.deltaY;
			}
			updateScrollButtons(this);
		});

		this.addAutoEventListener(this.$.back, "click", async() => {
			controlData.activePaletteRoot = this.$.back.getAttribute("target");
			const targetContainer = this.$.prevItemsContainer;
			await fillPaletteItems(this, targetContainer);
			this.$.containersContainer.classList.add("animate");
			const pathItem = controlData.path.pop();
			if (this.horizontal) {
				targetContainer.scrollLeft = pathItem.scrollOffset;
				this.$.containersContainer.style.top = 0;
			} else {
				targetContainer.scrollTop = pathItem.scrollOffset;
				this.$.containersContainer.style.left = 0;
			}
			this.$.back.setAttribute("target", (controlData.path[controlData.path.length - 1] || { target: "" }).target);
		});

		this.$.containersContainer.addEventListener("transitionend", () => {
			this.$.containersContainer.classList.remove("animate");
			this.$.itemsContainer.innerHTML = "";
			if (this.horizontal) {
				const sourceContainer = (this.$.containersContainer.style.top === "0px") ? this.$.prevItemsContainer : this.$.nextItemsContainer;
				const scrollOffset = sourceContainer.scrollLeft;
				Array.from(sourceContainer.children).forEach((p_Item) => {
					this.$.itemsContainer.appendChild(p_Item);
				});
				this.$.containersContainer.style.top = `${-this.paletteSize}px`;
				this.$.itemsContainer.scrollLeft = scrollOffset;
			} else {
				const sourceContainer = (this.$.containersContainer.style.left === "0px") ? this.$.prevItemsContainer : this.$.nextItemsContainer;
				const scrollOffset = sourceContainer.scrollTop;
				Array.from(sourceContainer.children).forEach((p_Item) => {
					this.$.itemsContainer.appendChild(p_Item);
				});
				this.$.containersContainer.style.left = `${-this.paletteSize}px`;
				this.$.itemsContainer.scrollTop = scrollOffset;
			}
			this.$.prevItemsContainer.innerHTML = "";
			this.$.nextItemsContainer.innerHTML = "";
			const tester = new RegExp(`^item-slot-${controlData.fillSequenceIndex}`);
			Array.from(this.querySelectorAll('[slot^="item-slot-"]')).filter((p_Item) => !tester.test(p_Item.slot)).forEach((p_Item) => this.removeChild(p_Item));
			updateScrollButtons(this);
		});
	}

	initialize(p_Settings) {
		this[privateData].settings = Object.assign({ topLevel: null }, p_Settings);
		this[privateData].activePaletteRoot = this[privateData].settings.topLevel;
		fillPaletteItems(this);
	}
}

window.customElements.define(componentName, VicowaHierarchicalPalette);
