import { WebComponentBaseClass } from "/third_party/web-component-base-class/src/web-component-base-class.js";
import "../vicowa-resize-detector/vicowa-resize-detector.js";

export function nestedArrayToDataInfo(data) {
	return {
		subData: data.map((dataValue) => ({ value: dataValue })),
	};
}

export function arrayToDataInfo(data) {
	return {
		subData: [{ value: data }],
	};
}

/**
 * Class to represent the vicowa-data-grid custom element
 * @extends WebComponentBaseClass
 * @property {array} data The data that will be displayed in the grid
 */
class VicowaDataGrid extends WebComponentBaseClass {
	#dataInfo;
	#columns;
	#startColumnIndex;
	#startRowIndex;
	#onGetDataRange;

	constructor() {
		super();
		this.#dataInfo = [];
		this.#columns = [];
		this.#startColumnIndex = 0;
		this.#startRowIndex = 0;
		this.dataToDataInfo = nestedArrayToDataInfo;
		this.onGetColumnInfo = (startColumn, endColumn) => new Promise((resolve) => {
			// optional value items to provide
			// headingKey: key to a translatable string
			// heading: non translatable string
			// width: width of the column
			const lastItem = Math.min(this.columns, endColumn);
			const result = [];
			for (let index = startColumn; index < lastItem; index++) {
				result.push({});
			}
			resolve(result);
		});
		this.#onGetDataRange = null;

		/*	(startRow, endRow, startColumn, endColumn, callback) => new Promise((resolve, reject) => {
			reject(new Error('No implementation for onGetDataRange\n' +
				'You should implement an onGetDataRange function with the following signature: \n' +
				'onGetDataRange(startRow, endRow, startColumn, endColumn, callback), where: \n' +
				'startRow is the index of the first row that should be returned\n' +
				'endRow is the index of the last row to be returned' +
				'startColumn is the index of the first column to be returned' +
				'endColumn is the index of the last column to be returned' +
				'callback is a callback to call with the result of the data retrieval' +
				'The data should be in the format: ' +
				'[{ subData: [{ value: <cell value html>}, ...], height: <optional height of a data row>}, ...]'));
		});*/
	}

	static get properties() {
		return {
			data: {
				type: Array,
				value: [],
				observer: (control) => control.#dataChanged(),
			},
			defaultHeight: {
				type: Number,
				value: 15,
				reflectToAttribute: true,
				observer: (control) => control.#dataChanged(),
			},
			defaultWidth: {
				type: Number,
				value: 50,
				reflectToAttribute: true,
				observer: (control) => control.#dataChanged(),
			},
			snapToCellBoundaries: {
				type: Boolean,
				value: false,
				reflectToAttribute: true,
				observer: (control) => control.#dataChanged(),
			},
			fixedHeaderRows: {
				type: Number,
				value: 0,
				reflectToAttribute: true,
				observer: (control) => control.#dataChanged(),
			},
			fixedStartColumns: {
				type: Number,
				value: 0,
				reflectToAttribute: true,
				observer: (control) => control.#dataChanged(),
			},
		};
	}

	attached() {
		this.$.resizeDetector.addObserver((resizeResult) => {
			this.#updateSizes(resizeResult.newRect);
		}, this);
		this.addAutoEventListener(this.$.vscrollarea, "scroll", () => { this.#updateVScroll(this.$.vscrollarea); });
		this.addAutoEventListener(this.$.hscrollarea, "scroll", () => { this.#updateHScroll(this.$.hscrollarea); });
	}

	detached() {
		this.$.resizeDetector.removeOwner(this);
	}

	#dataChanged() {
		const controlRect = this.$.verMain.getBoundingClientRect();
		this.$.rows.innerHTML = "";

		this.#dataInfo = this.data.map(this.dataToDataInfo);
		let totalHeight = 0;
		let first = true;
		let maxColumns = 0;

		for (let index = 0; index < this.#dataInfo.length && totalHeight < controlRect.height; index++) {
			const rowInfo = this.#dataInfo[index];
			const rowTemplate = document.importNode(this.$.row.content, true);
			const row = rowTemplate.querySelector(".row");
			const forceHeight = rowTemplate.querySelector(".force-height");
			const height = rowInfo.height || this.defaultHeight;
			totalHeight += height;
			forceHeight.style.minHeight = forceHeight.style.maxHeight = `${height}px`;
			let totalWidth = 0;
			for (let columnIndex = 0; columnIndex < rowInfo.subData.length && ((!first && columnIndex <= maxColumns) || (first && totalWidth < controlRect.width + this.defaultWidth)); columnIndex++) { /* eslint-disable-line */
				const cellInfo = rowInfo.subData[columnIndex];
				const cellTemplate = document.importNode(this.$.cell.content, true);
				const cell = cellTemplate.querySelector(".cell");

				if (first) {
					const width = cellInfo.width || this.defaultWidth;
					totalWidth += width;
					cell.style.minWidth = cell.style.maxWidth = `${width}px`;
					maxColumns = columnIndex;
				}
				row.appendChild(cell);
			}

			this.$.rows.appendChild(rowTemplate);
			first = false;
		}

		this.#updateSizes();
		this.#updateData(0, 0);
	}

	#updateSizes() {
		if (this.#dataInfo.length) {
			const rect = this.$.verMain.getBoundingClientRect();

			const totalWidth = this.#dataInfo[0].subData.reduce((previous, data) => previous + (data.width || this.defaultWidth), 0);
			const totalHeight = this.#dataInfo.reduce((previous, data) => previous + (data.height || this.defaultHeight), 0);

			this.$.hscrollcontent.style.width = `${totalWidth}px`;
			this.$.vscrollcontent.style.height = `${totalHeight}px`;

			const hScrollActive = this.$.hscrollcontent.getBoundingClientRect().width > rect.width;
			const vScrollActive = this.$.vscrollcontent.getBoundingClientRect().height > rect.height;

			this.$.hscrollarea.style.flexBasis = (hScrollActive) ? "10px" : "0";
			this.$.vscrollarea.style.flexBasis = (vScrollActive) ? "15px" : "0";
		}
	}

	#updateData(startRow, startColumn) {
		const rows = this.$$$("#rows > .row");
		rows.forEach((row, rowIndex) => {
			const rowOffset = (rowIndex < this.fixedHeaderRows) ? 0 : startRow;
			const data = this.#dataInfo[Math.min(rowIndex + rowOffset, this.#dataInfo.length - 1)];
			row.querySelector(".force-height").style.maxHeight = row.style.minHeight = `${data.height | this.defaultHeight}px`;
			row.classList.toggle("fixed", rowIndex < this.fixedHeaderRows);
			Array.from(row.querySelectorAll(".cell")).forEach((cell, cellIndex) => {
				const columnOffset = (cellIndex < this.fixedStartColumns) ? 0 : startColumn;
				cell.querySelector(".cell-content").innerHTML = data.subData[Math.min(cellIndex + columnOffset, data.subData.length - 1)].value;
				cell.classList.toggle("fixed", cellIndex < this.fixedStartColumns);
				if (rowIndex === 0) {
					cell.style.minWidth = cell.style.maxWidth = `${this.#dataInfo[0].subData[cellIndex].width || this.defaultWidth}px`;
				}
			});
		});
		this.#startRowIndex = startRow;
		this.#startColumnIndex = startColumn;
	}

	#updateVScroll(scrollArea) {
		let dist = 0;
		let startIndex = 0;
		for (let index = 0; index < this.#dataInfo.length; index++) {
			const newDist = dist + (this.#dataInfo[index].height || this.defaultHeight);
			if (newDist > scrollArea.scrollTop) {
				break;
			}
			dist = newDist;
			startIndex = index + 1;
		}

		this.#updateData(startIndex, this.#startColumnIndex);

		this.$.contentMain.style.top = (this.snapToCellBoundaries) ? "0" : `-${(dist) ? scrollArea.scrollTop % dist : scrollArea.scrollTop}px`;
	}

	#updateHScroll(scrollArea) {
		let dist = 0;
		let startIndex = 0;
		for (let index = 0; index < this.#dataInfo[0].subData.length; index++) {
			const newDist = dist + (this.#dataInfo[0].subData[index].width || this.defaultWidth);
			if (newDist > scrollArea.scrollLeft) {
				break;
			}
			dist = newDist;
			startIndex = index + 1;
		}

		this.#updateData(this.#startRowIndex, startIndex);

		this.$.contentMain.style.left = (this.snapToCellBoundaries) ? "0" : `-${(dist) ? scrollArea.scrollLeft % dist : scrollArea.scrollLeft}px`;
	}

	static get template() {
		return `
			<style id="styles">
				:host {
					display: block;
					position: relative;
				}
				.column {
					box-sizing: border-box;
					display: table-column;
				}
				.row {
					box-sizing: border-box;
					display: table-row;
				}
				.cell {
					box-sizing: border-box;
					display: table-cell;
					position: relative;
					border-top: var(--vicowa-data-grid-cell-border-top, 0);
					border-left: var(--vicowa-data-grid-cell-border-left, 0);
					border-bottom: var(--vicowa-data-grid-cell-border-bottom, 0);
					border-right: var(--vicowa-data-grid-cell-border-right, 0);
				}
		
				#main {
					position: absolute;
					left: 0;
					top: 0;
					bottom: 0;
					right: 0;
					overflow: hidden;
				}
		
				#content-main {
					display: table;
					border-collapse: collapse;
					position: relative;
				}
		
				#main {
					display: flex;
					flex-direction: column;
					justify-items: stretch;
				}
		
				#hor-main {
					flex: 1 1 auto;
					display: flex;
					flex-direction: row;
				}
				#ver-main {
					flex: 1 1 auto;
				}
		
				#hor-main,
				#ver-main {
					overflow: hidden;
				}
		
				#hscrollarea,
					#vscrollarea {
					flex: 0 0 0;
				}
		
				#vscrollarea {
					overflow-y: auto;
					overflow-x: hidden;
				}
		
				#hscrollarea {
					overflow-x: auto;
					overflow-y: hidden;
				}
		
				#vscrollcontent {
					width: 10px;
				}
		
				#hscrollcontent {
					height: 10px;
				}
		
				.cell-content {
					overflow: hidden;
					position: absolute;
					left: 0;
					top: 0;
					right: 0;
					bottom: 0;
					text-overflow: ellipsis;
					white-space: nowrap;
				}
		
				.row.fixed {
					background: var(--vicowa-data-grid-fixed-row-background, inherit);
					color: var(--vicowa-data-grid-fixed-row-color, inherit);
					border-top: var(--vicowa-data-grid-fixed-row-border-top, 0);
					border-left: var(--vicowa-data-grid-fixed-row-border-left, 0);
					border-bottom: var(--vicowa-data-grid-fixed-row-border-bottom, 0);
					border-right: var(--vicowa-data-grid-fixed-row-border-right, 0);
				}
		
				.row.fixed .cell {
		
				}
		
				:not(.row) .cell.fixed {
					background: var(--vicowa-data-grid-fixed-column-background, inherit);
					color: var(--vicowa-data-grid-fixed-column-color, inherit);
					border-top: var(--vicowa-data-grid-fixed-column-border-top, 0);
					border-left: var(--vicowa-data-grid-fixed-column-border-left, 0);
					border-bottom: var(--vicowa-data-grid-fixed-column-border-bottom, 0);
					border-right: var(--vicowa-data-grid-fixed-column-border-right, 0);
				}
		
			</style>
			<div id="main">
				<vicowa-resize-detector id="resize-detector"></vicowa-resize-detector>
				<div id="hor-main">
				<div id="ver-main">
				<div id="content-main">
				<div id="content">
				<div id="rows">
	
				</div>
				</div>
				</div>
				</div>
				<div id="vscrollarea">
				<div id="vscrollcontent"></div>
				</div>
				</div>
				<div id="hscrollarea">
				<div id="hscrollcontent"></div>
				</div>
				</div>
				<template id="row">
				<div class="row"><div class="force-height"></div></div>
			</template>
			<template id="column">
				<div class="column"></div>
				</template>
				<template id="cell">
				<div class="cell"><div class="cell-content"></div></div>
			</template>
		`;
	}
}

window.customElements.define("vicowa-data-grid", VicowaDataGrid);
