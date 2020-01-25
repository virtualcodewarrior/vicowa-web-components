import { webComponentBaseClass } from "../third_party/web-component-base-class/src/webComponentBaseClass.js";
import "../vicowa-input/vicowa-input.js";

function updateFirst(p_Control) {
	const regExp = (p_Control.$.firstFilter.value.trim()) ? new RegExp(p_Control.$.firstFilter.value.trim()) : null;
	p_Control.$.firstList.innerHTML = "";
	p_Control.first.filter((p_Item) => !regExp || regExp.test(p_Item.displayName)).sort().forEach((p_Item) => {
		const option = document.createElement("option");
		option.item = p_Item;
		option.textContent = p_Item.displayName;
		p_Control.$.firstList.appendChild(option);
	});
}
function updateSecond(p_Control) {
	const regExp = (p_Control.$.secondFilter.value.trim()) ? new RegExp(p_Control.$.secondFilter.value.trim()) : null;
	p_Control.$.secondList.innerHTML = "";
	p_Control.second.filter((p_Item) => !regExp || regExp.test(p_Item.displayName)).sort().forEach((p_Item) => {
		const option = document.createElement("option");
		option.item = p_Item;
		option.textContent = p_Item.displayName;
		p_Control.$.secondList.appendChild(option);
	});
}

function titleUpdated(p_Control) {
	p_Control.$.firstTitle.string = p_Control.firstTitle;
	p_Control.$.secondTitle.string = p_Control.secondTitle;
}

const customElementName = "vicowa-move-between-lists";
class VicowaMoveBetweenLists extends webComponentBaseClass {
	static get is() { return customElementName; }
	constructor() { super(); }
	static get properties() {
		return {
			firstTitle: {
				type: String,
				value: "",
				reflectToAttribute: true,
				observer: titleUpdated,
			},
			secondTitle: {
				type: String,
				value: "",
				reflectToAttribute: true,
				observer: titleUpdated,
			},
			first: {
				type: Array,
				value: [],
				observer: updateFirst,
			},
			second: {
				type: Array,
				value: [],
				observer: updateSecond,
			},
		};
	}

	attached() {
		this.$.firstFilter.onChange = () => { updateFirst(this); };
		this.$.secondFilter.onChange = () => { updateSecond(this); };

		const updateStates = () => {
			this.$.secondToFirst.classList.toggle("disabled", !this.$.secondList.selectedOptions.length);
			this.$.firstToSecond.classList.toggle("disabled", !this.$.firstList.selectedOptions.length);
		}

		this.addAutoEventListener(this.$.secondList, "change", updateStates);
		this.addAutoEventListener(this.$.firstList, "change", updateStates);

		updateStates();

		this.addAutoEventListener(this.$.firstToSecond, "click", () => {
			const selected = Array.from(this.$.firstList.selectedOptions);
			this.second = this.second.concat(selected.map((p_Option) => p_Option.item));
			this.first = this.first.filter((p_Item) => !selected.find((p_Option) => p_Option.item === p_Item));

			updateStates();
			if (this.onChange) {
				this.onChange();
			}
		});
		this.addAutoEventListener(this.$.secondToFirst, "click", () => {
			const selected = Array.from(this.$.secondList.selectedOptions);
			this.first = this.first.concat(selected.map((p_Option) => p_Option.item));
			this.second = this.second.filter((p_Item) => !selected.find((p_Option) => p_Option.item === p_Item));

			updateStates();
			if (this.onChange) {
				this.onChange();
			}
		});
	}

	static get template() {
		return `
			<style>
				.list-container {
					justify-content: stretch;
					--vicowa-input-control-width: 200px;
				}
				.swap-button-container {
					justify-content: center;
				}
		
				.swap-button-container button {
					margin: 3px 2px;
				}
		
				.list-container,
				.swap-button-container {
					display: flex;
					flex-direction: column;
				}
		
				select {
					width: var(--vicowa-input-control-width);
					height: 200px;
				}
		
				label {
					margin: .2em 0;
				}
		
				.side-by-side {
					display: flex;
				}
		
				.move {
					cursor: pointer;
				}
		
				.disabled {
					pointer-events: none;
					opacity: 0.5;
					cursor: default;
				}
			</style>
			<div class="side-by-side">
				<div class="list-container">
					<label for="first-list"><vicowa-string id="first-title"></vicowa-string></label>
					<vicowa-input id="first-filter" placeholder="Filter" hide-label></vicowa-input>
					<select id="first-list" multiple>
					</select>
				</div>
				<div class="swap-button-container">
					<div class="move" id="first-to-second"><slot name="first-to-second-button"><button >-></button></slot></div>
					<div class="move" id="second-to-first"><slot name="second-to-first-button"><button ><-</button></slot></div>
				</div>
				<div class="list-container">
					<label for="second-list"><vicowa-string id="second-title"></vicowa-string></label>
					<vicowa-input id="second-filter" placeholder="Filter" hide-label></vicowa-input>
					<select id="second-list" multiple>
					</select>
				</div>
			</div>
		`;
	}
}

window.customElements.define(customElementName, VicowaMoveBetweenLists);
