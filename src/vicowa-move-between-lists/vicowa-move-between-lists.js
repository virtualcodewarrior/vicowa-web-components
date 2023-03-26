import { WebComponentBaseClass } from '/third_party/web-component-base-class/src/web-component-base-class.js';
import '../vicowa-input/vicowa-input.js';

class VicowaMoveBetweenLists extends WebComponentBaseClass {
	constructor() { super(); }
	static get properties() {
		return {
			firstTitle: {
				type: String,
				value: '',
				reflectToAttribute: true,
				observer: (control) => control.#titleUpdated(),
			},
			secondTitle: {
				type: String,
				value: '',
				reflectToAttribute: true,
				observer: (control) => control.#titleUpdated(),
			},
			first: {
				type: Array,
				value: [],
				observer: (control) => control.#updateFirst(),
			},
			second: {
				type: Array,
				value: [],
				observer: (control) => control.#updateSecond(),
			},
		};
	}

	attached() {
		this.$.firstFilter.onChange = () => { this.#updateFirst(); };
		this.$.secondFilter.onChange = () => { this.#updateSecond(); };

		const updateStates = () => {
			this.$.secondToFirst.classList.toggle('disabled', !this.$.secondList.selectedOptions.length);
			this.$.firstToSecond.classList.toggle('disabled', !this.$.firstList.selectedOptions.length);
		};

		this.addAutoEventListener(this.$.secondList, 'change', updateStates);
		this.addAutoEventListener(this.$.firstList, 'change', updateStates);

		updateStates();

		this.addAutoEventListener(this.$.firstToSecond, 'click', () => {
			const selected = Array.from(this.$.firstList.selectedOptions);
			this.second = this.second.concat(selected.map((option) => option.item));
			this.first = this.first.filter((item) => !selected.find((option) => option.item === item));

			updateStates();
			if (this.onChange) {
				this.onChange();
			}
		});
		this.addAutoEventListener(this.$.secondToFirst, 'click', () => {
			const selected = Array.from(this.$.secondList.selectedOptions);
			this.first = this.first.concat(selected.map((option) => option.item));
			this.second = this.second.filter((item) => !selected.find((option) => option.item === item));

			updateStates();
			if (this.onChange) {
				this.onChange();
			}
		});
	}

	#updateFirst() {
		const regExp = (this.$.firstFilter.value.trim()) ? new RegExp(this.$.firstFilter.value.trim()) : null;
		this.$.firstList.innerHTML = '';
		this.first.filter((item) => !regExp || regExp.test(item.displayName)).sort().forEach((item) => {
			const option = document.createElement('option');
			option.item = item;
			option.textContent = item.displayName;
			this.$.firstList.appendChild(option);
		});
	}
	#updateSecond() {
		const regExp = (this.$.secondFilter.value.trim()) ? new RegExp(this.$.secondFilter.value.trim()) : null;
		this.$.secondList.innerHTML = '';
		this.second.filter((item) => !regExp || regExp.test(item.displayName)).sort().forEach((item) => {
			const option = document.createElement('option');
			option.item = item;
			option.textContent = item.displayName;
			this.$.secondList.appendChild(option);
		});
	}

	#titleUpdated() {
		this.$.firstTitle.string = this.firstTitle;
		this.$.secondTitle.string = this.secondTitle;
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

window.customElements.define('vicowa-move-between-lists', VicowaMoveBetweenLists);
