import { WebComponentBaseClass } from "/third_party/web-component-base-class/src/web-component-base-class.js";
import "../vicowa-string/vicowa-string.js";
import "../vicowa-icon/vicowa-icon.js";
import "../vicowa-resize-detector/vicowa-resize-detector.js";

const itemData = Symbol("itemData");

class VicowaHierarchicalPalette extends WebComponentBaseClass {
	#privateData;

	constructor() {
		super();
		this.getData = null;
		this.factory = null;
		this.#privateData = {
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
				observer: (control) => control.#fillPaletteItems(),
			},
			itemSize: {
				type: Number,
				value: 50,
				reflectToAttribute: true,
				observer: (control) => control.#fillPaletteItems(),
			},
			horizontal: {
				type: Boolean,
				value: false,
				reflectToAttribute: true,
				observer: (control) => control.#fillPaletteItems(),
			},
		};
	}

	attached() {
		const controlData = this.#privateData;
		this.$.resizeDetector.addObserver(() => {
			this.#updateScrollButtons();
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
				this.#updateScrollButtons();
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
				this.#updateScrollButtons();
			}, 100);
			const handleMouseUp = () => {
				window.removeEventListener("mouseup", handleMouseUp);
				clearInterval(interval);
			};
			window.addEventListener("mouseup", handleMouseUp, true);
		};

		this.addAutoEventListener(this.$.moveToStart, "mousedown", handleMoveToStart);
		this.addAutoEventListener(this.$.moveToEnd, "mousedown", handleMoveToEnd);

		this.addAutoEventListener(this.$.itemsContainer, "wheel", (event) => {
			if (this.horizontal) {
				this.$.itemsContainer.scrollLeft += event.deltaY;
			} else {
				this.$.itemsContainer.scrollTop += event.deltaY;
			}
			this.#updateScrollButtons();
		});

		this.addAutoEventListener(this.$.back, "click", async() => {
			controlData.activePaletteRoot = this.$.back.getAttribute("target");
			const targetContainer = this.$.prevItemsContainer;
			await this.#fillPaletteItems(targetContainer);
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
				Array.from(sourceContainer.children).forEach((item) => {
					this.$.itemsContainer.appendChild(item);
				});
				this.$.containersContainer.style.top = `${-this.paletteSize}px`;
				this.$.itemsContainer.scrollLeft = scrollOffset;
			} else {
				const sourceContainer = (this.$.containersContainer.style.left === "0px") ? this.$.prevItemsContainer : this.$.nextItemsContainer;
				const scrollOffset = sourceContainer.scrollTop;
				Array.from(sourceContainer.children).forEach((item) => {
					this.$.itemsContainer.appendChild(item);
				});
				this.$.containersContainer.style.left = `${-this.paletteSize}px`;
				this.$.itemsContainer.scrollTop = scrollOffset;
			}
			this.$.prevItemsContainer.innerHTML = "";
			this.$.nextItemsContainer.innerHTML = "";
			const tester = new RegExp(`^item-slot-${controlData.fillSequenceIndex}`);
			Array.from(this.querySelectorAll('[slot^="item-slot-"]')).filter((item) => !tester.test(item.slot)).forEach((item) => this.removeChild(item));
			this.#updateScrollButtons();
		});
	}

	initialize(settings) {
		this.#privateData.settings = Object.assign({ topLevel: null }, settings);
		this.#privateData.activePaletteRoot = this.#privateData.settings.topLevel;
		this.#fillPaletteItems();
	}

	#updateScrollButtons() {
		const controlData = this.#privateData;
		const size = (this.horizontal) ? this.$.container.offsetWidth : this.$.container.offsetHeight;
		controlData.pageSize = Math.floor(size / this.itemSize);
		this.$.moveToStart.classList.toggle("disabled", (this.horizontal) ? this.$.itemsContainer.scrollLeft === 0 : this.$.itemsContainer.scrollTop === 0);
		this.$.moveToEnd.classList.toggle("disabled", (this.horizontal) ? this.$.itemsContainer.scrollLeft >= this.$.itemsContainer.scrollWidth - this.$.itemsContainer.offsetWidth : this.$.itemsContainer.scrollTop >= this.$.itemsContainer.scrollHeight - this.$.itemsContainer.offsetHeight);
		this.$.back.classList.toggle("disabled", controlData.path.length === 0);
	}

	async #fillPaletteItems(target) {
		target = target || this.$.itemsContainer;
		if (this.getData) {
			if (this.horizontal) {
				this.style.height = `${this.paletteSize}px`;
				this.$.containersContainer.style.height = `${this.paletteSize * 3}px`;
				this.$.containersContainer.style.top = `${-this.paletteSize}px`;
			} else {
				this.style.width = `${this.paletteSize}px`;
				this.$.containersContainer.style.width = `${this.paletteSize * 3}px`;
				this.$.containersContainer.style.left = `${-this.paletteSize}px`;
			}
			const size = (this.horizontal) ? this.$.container.offsetWidth : this.$.container.offsetHeight;
			const controlData = this.#privateData;
			controlData.fillSequenceIndex++;
			this.itemSize = Math.max(this.itemSize, 10); // minimal size = 10px
			controlData.pageSize = Math.ceil(size / this.itemSize) + 6; // 3 additional on each side
			controlData.items = await this.getData((controlData.activePaletteRoot !== "root") ? controlData.activePaletteRoot : null, 0, 100);
			while (controlData.items.items.length < controlData.items.totalItemCount) {
				const additionalItems = await this.getData((controlData.activePaletteRoot !== "root") ? controlData.activePaletteRoot : null, controlData.items.items.length, 100);
				controlData.items.items = controlData.items.items.concat(additionalItems.items);
			}

			target.innerHTML = "";
			Array.from(this.querySelectorAll(`[slot^="item-slot-${controlData.fillSequenceIndex}-"]`)).forEach((item) => this.removeChild(item));
			controlData.items.items.forEach((item, index) => {
				const itemContainer = document.importNode(this.$.itemTemplate.content, true).querySelector('div[name="item-container"]');
				itemContainer[itemData] = item;
				itemContainer.style.width = (this.horizontal) ? `${this.itemSize}px` : "";
				itemContainer.style.height = (this.horizontal) ? "" : `${this.itemSize}px`;
				if (item.subLevel) {
					itemContainer.classList.add("sub-level");
				}
				const itemContent = this.factory(item);
				const slot = itemContainer.querySelector("slot");
				slot.name = `item-slot-${controlData.fillSequenceIndex}-${index}`;
				itemContent.slot = slot.name;
				this.appendChild(itemContent);
				// itemContainer.appendChild(itemContent);
				target.appendChild(itemContainer);
				itemContainer.addEventListener("click", async() => {
					if (item.subLevel) {
						this.$.back.setAttribute("target", controlData.activePaletteRoot || "root");
						controlData.path.push({
							target: controlData.activePaletteRoot || "root",
							scrollOffset: (this.horizontal) ? this.$.itemsContainer.scrollLeft : this.$.itemsContainer.scrollTop,
						});
						controlData.activePaletteRoot = item.path;
						await this.#fillPaletteItems(this.$.nextItemsContainer);
						this.$.containersContainer.classList.add("animate");
						this.$.nextItemsContainer.scrollLeft = this.$.nextItemsContainer.scrollTop = 0;

						if (this.horizontal) {
							this.$.containersContainer.style.top = `${-this.paletteSize * 2}px`;
						} else {
							this.$.containersContainer.style.left = `${-this.paletteSize * 2}px`;
						}
					} else if (this.onClick) {
						this.onClick(item);
					}
				});
			});
		}
		this.#updateScrollButtons();
	}

	static get template() {
		return `
			<style>
				:host {
					display: block;
					box-sizing: border-box;
				}
		
				#container {
					position: relative;
					height: 100%;
					width: 100%;
					overflow: hidden;
				}
		
				#container,
				#containers-container,
				.items-container {
					display: flex;
					flex-direction: column;
					align-items: stretch;
				}
		
				#containers-container {
					position: relative;
					flex: 1 1 auto;
					display: flex;
					flex-direction: row;
					align-items: stretch;
					overflow: hidden;
				}

				.items-container {
					flex: 0 0 33%;
					overflow: hidden;
				}
		
				:host([horizontal]) #containers-container {
					flex-direction: column;
				}
		
				:host([horizontal]) #container,
				:host([horizontal]) .items-container {
					flex-direction: row;
					overflow: hidden;
				}
				#move-to-start,
				#move-to-end {
					flex: 0 0 auto;
				}

				:host(:not([horizontal])) #move-to-start slot > div,
				:host(:not([horizontal])) #move-to-end slot > div {
					transform: rotate(90deg);
				}

				div[name="item-container"] {
					position: relative;
					box-sizing: border-box;
					cursor: pointer;
					flex: 0 0 auto;
					user-select: none;
					overflow: hidden;
				}

				.button {
					position: relative;
					box-sizing: border-box;
					border-bottom: var(--vicowa-hierarchical-palette-button-border, 1px solid grey);
					text-align: center;
					cursor: pointer;
					user-select: none;
					display: flex;
					align-items: center;
					justify-content: center;
				}

				:host([horizontal]) .button {
					border-bottom: 0;
					border-top: 0;
					border-right: var(--vicowa-hierarchical-palette-button-border, 1px solid grey);
				}

				.button:last-child {
					border-top: var(--vicowa-hierarchical-palette-button-border, 1px solid grey);
					border-bottom: 0;
				}
				:host([horizontal]) .button:last-child {
					border-left: var(--vicowa-hierarchical-palette-button-border, 1px solid grey);
					border-right: 0;
				}

				:host(:not([search])) #search {
					display: none;
				}
		
				div[name="item-container"]:hover {
					background: var(--vicowa-hierarchical-palette-hover-background, #8888ff);
					color: var(--vicowa-hierarchical-palette-hover-color, white);
				}
				div[name="item-container"].active {
					background: var(--vicowa-hierarchical-palette-active-background, #8888ff);
					color: var(--vicowa-hierarchical-palette-active-color, white);
				}
		
				#containers-container.animate {
					transition: left var(--vicowa-hierarchical-palette-transition-time, .5s), top var(--vicowa-hierarchical-palette-transition-time, .5s);
				}
		
				.button.disabled {
					opacity: 0.5;
					pointer-events: none;
				}
		
				#move-to-end:not(.disabled) {
					box-shadow: 0 -2px 4px grey;
				}
				#move-to-start:not(.disabled) {
					box-shadow: 0 2px 4px grey;
				}
		
				:host([horizontal]) #move-to-end:not(.disabled) {
					box-shadow: -2px 0 4px grey;
				}
				:host([horizontal]) #move-to-start:not(.disabled) {
					box-shadow: 2px 0 4px grey;
				}
			</style>
			<template id="item-template">
				<div name="item-container"><slot></slot></div>
			</template>
			<div id="container">
				<vicowa-resize-detector id="resize-detector"></vicowa-resize-detector>
				<div class="button" id="search">Search<vicowa-input id="search"></vicowa-input></div>
				<div class="button" id="back"><slot name="back-button"><div>Back</div></slot></div>
				<div class="button" id="move-to-start"><slot name="move-to-start"><div>&lt;</div></slot></div>
				<div id="containers-container"><div class="items-container" id="prev-items-container"></div><div class="items-container" id="items-container"></div><div class="items-container" id="next-items-container"></div></div>
				<div class="button" id="move-to-end"><slot name="move-to-end"><div>&gt;</div></slot></div>
			</div>
		`;
	}
}

window.customElements.define("vicowa-hierarchical-palette", VicowaHierarchicalPalette);
