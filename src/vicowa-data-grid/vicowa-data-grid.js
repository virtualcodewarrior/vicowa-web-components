import { webComponentBaseClass } from "../third_party/web-component-base-class/src/webComponentBaseClass.js";
import "../vicowa-resize-detector/vicowa-resize-detector.js";

const componentName = "vicowa-data-grid";

function updateSizes(p_Control) {
	if (p_Control._dataInfo.length) {
		const rect = p_Control.$.verMain.getBoundingClientRect();

		const totalWidth = p_Control._dataInfo[0].subData.reduce((p_Previous, p_Data) => p_Previous + (p_Data.width || p_Control.defaultWidth), 0);
		const totalHeight = p_Control._dataInfo.reduce((p_Previous, p_Data) => p_Previous + (p_Data.height || p_Control.defaultHeight), 0);

		p_Control.$.hscrollcontent.style.width = `${totalWidth}px`;
		p_Control.$.vscrollcontent.style.height = `${totalHeight}px`;

		const hScrollActive = p_Control.$.hscrollcontent.getBoundingClientRect().width > rect.width;
		const vScrollActive = p_Control.$.vscrollcontent.getBoundingClientRect().height > rect.height;

		p_Control.$.hscrollarea.style.flexBasis = (hScrollActive) ? "10px" : "0";
		p_Control.$.vscrollarea.style.flexBasis = (vScrollActive) ? "15px" : "0";
	}
}

function updateData(p_Control, p_StartRow, p_StartColumn) {
	const rows = p_Control.$$$("#rows > .row");
	rows.forEach((p_Row, p_RowIndex) => {
		const rowOffset = (p_RowIndex < p_Control.fixedHeaderRows) ? 0 : p_StartRow;
		const data = p_Control._dataInfo[Math.min(p_RowIndex + rowOffset, p_Control._dataInfo.length - 1)];
		p_Row.querySelector(".force-height").style.maxHeight = p_Row.style.minHeight = `${data.height | p_Control.defaultHeight}px`;
		p_Row.classList.toggle("fixed", p_RowIndex < p_Control.fixedHeaderRows);
		Array.from(p_Row.querySelectorAll(".cell")).forEach((p_Cell, p_CellIndex) => {
			const columnOffset = (p_CellIndex < p_Control.fixedStartColumns) ? 0 : p_StartColumn;
			p_Cell.querySelector(".cell-content").innerHTML = data.subData[Math.min(p_CellIndex + columnOffset, data.subData.length - 1)].value;
			p_Cell.classList.toggle("fixed", p_CellIndex < p_Control.fixedStartColumns);
			if (p_RowIndex === 0) {
				p_Cell.style.minWidth = p_Cell.style.maxWidth = `${p_Control._dataInfo[0].subData[p_CellIndex].width || p_Control.defaultWidth}px`;
			}
		});
	});
	p_Control._startRowIndex = p_StartRow;
	p_Control._startColumnIndex = p_StartColumn;
}

function updateVScroll(p_Control, p_ScrollArea) {
	let dist = 0;
	let startIndex = 0;
	for (let index = 0; index < p_Control._dataInfo.length; index++) {
		const newDist = dist + (p_Control._dataInfo[index].height || p_Control.defaultHeight);
		if (newDist > p_ScrollArea.scrollTop) {
			break;
		}
		dist = newDist;
		startIndex = index + 1;
	}

	updateData(p_Control, startIndex, p_Control._startColumnIndex);

	p_Control.$.contentMain.style.top = (p_Control.snapToCellBoundaries) ? "0" : `-${(dist) ? p_ScrollArea.scrollTop % dist : p_ScrollArea.scrollTop}px`;
}

function updateHScroll(p_Control, p_ScrollArea) {
	let dist = 0;
	let startIndex = 0;
	for (let index = 0; index < p_Control._dataInfo[0].subData.length; index++) {
		const newDist = dist + (p_Control._dataInfo[0].subData[index].width || p_Control.defaultWidth);
		if (newDist > p_ScrollArea.scrollLeft) {
			break;
		}
		dist = newDist;
		startIndex = index + 1;
	}

	updateData(p_Control, p_Control._startRowIndex, startIndex);

	p_Control.$.contentMain.style.left = (p_Control.snapToCellBoundaries) ? "0" : `-${(dist) ? p_ScrollArea.scrollLeft % dist : p_ScrollArea.scrollLeft}px`;
}

export function nestedArrayToDataInfo(p_Data) {
	return {
		subData: p_Data.map((p_DataValue) => ({ value: p_DataValue })),
	};
}

export function arrayToDataInfo(p_Data) {
	return {
		subData: [{ value: p_Data }],
	};
}

function dataChanged(p_Control) {
	const controlRect = p_Control.$.verMain.getBoundingClientRect();
	p_Control.$.rows.innerHTML = "";

	p_Control._dataInfo = p_Control.data.map(p_Control.dataToDataInfo);
	let totalHeight = 0;
	let first = true;
	let maxColumns = 0;

	for (let index = 0; index < p_Control._dataInfo.length && totalHeight < controlRect.height; index++) {
		const rowInfo = p_Control._dataInfo[index];
		const rowTemplate = document.importNode(p_Control.$.row.content, true);
		const row = rowTemplate.querySelector(".row");
		const forceHeight = rowTemplate.querySelector(".force-height");
		const height = rowInfo.height || p_Control.defaultHeight;
		totalHeight += height;
		forceHeight.style.minHeight = forceHeight.style.maxHeight = `${height}px`;
		let totalWidth = 0;
		for (let columnIndex = 0; columnIndex < rowInfo.subData.length && ((!first && columnIndex <= maxColumns) || (first && totalWidth < controlRect.width + p_Control.defaultWidth)); columnIndex++) { /* eslint-disable-line */
			const cellInfo = rowInfo.subData[columnIndex];
			const cellTemplate = document.importNode(p_Control.$.cell.content, true);
			const cell = cellTemplate.querySelector(".cell");

			if (first) {
				const width = cellInfo.width || p_Control.defaultWidth;
				totalWidth += width;
				cell.style.minWidth = cell.style.maxWidth = `${width}px`;
				maxColumns = columnIndex;
			}
			row.appendChild(cell);
		}

		p_Control.$.rows.appendChild(rowTemplate);
		first = false;
	}

	updateSizes(p_Control);
	updateData(p_Control, 0, 0);
}

/**
 * Class to represent the vicowa-data-grid custom element
 * @extends webComponentBaseClass
 * @property {array} data The data that will be displayed in the grid
 */
class VicowaDataGrid extends webComponentBaseClass {
	static get is() { return componentName; }
	constructor() {
		super();
		this._dataInfo = [];
		this._columns = [];
		this._startColumnIndex = 0;
		this._startRowIndex = 0;
		this.dataToDataInfo = nestedArrayToDataInfo;
		this.onGetColumnInfo = (p_StartColumn, p_EndColumn) => new Promise((resolve) => {
			// optional value items to provide
			// headingKey: key to a translatable string
			// heading: non translatable string
			// width: width of the column
			const lastItem = Math.min(this.columns, p_EndColumn);
			const result = [];
			for (let index = p_StartColumn; index < lastItem; index++) {
				result.push({});
			}
			resolve(result);
		});
		this._onGetDataRange = null;

		/*	(p_StartRow, p_EndRow, p_StartColumn, p_EndColumn, p_Callback) => new Promise((resolve, reject) => {
			reject(new Error('No implementation for onGetDataRange\n' +
				'You should implement an onGetDataRange function with the following signature: \n' +
				'onGetDataRange(p_StartRow, p_EndRow, p_StartColumn, p_EndColumn, p_Callback), where: \n' +
				'p_StartRow is the index of the first row that should be returned\n' +
				'p_EndRow is the index of the last row to be returned' +
				'p_StartColumn is the index of the first column to be returned' +
				'p_EndColumn is the index of the last column to be returned' +
				'p_Callback is a callback to call with the result of the data retrieval' +
				'The data should be in the format: ' +
				'[{ subData: [{ value: <cell value html>}, ...], height: <optional height of a data row>}, ...]'));
		});*/
	}

	static get properties() {
		return {
			data: {
				type: Array,
				value: [],
				observer: dataChanged,
			},
			defaultHeight: {
				type: Number,
				value: 15,
				reflectToAttribute: true,
				observer: dataChanged,
			},
			defaultWidth: {
				type: Number,
				value: 50,
				reflectToAttribute: true,
				observer: dataChanged,
			},
			snapToCellBoundaries: {
				type: Boolean,
				value: false,
				reflectToAttribute: true,
				observer: dataChanged,
			},
			fixedHeaderRows: {
				type: Number,
				value: 0,
				reflectToAttribute: true,
				observer: dataChanged,
			},
			fixedStartColumns: {
				type: Number,
				value: 0,
				reflectToAttribute: true,
				observer: dataChanged,
			},
		};
	}

	attached() {
		this.$.resizeDetector.addObserver((p_ResizeResult) => {
			updateSizes(this, p_ResizeResult.newRect);
		}, this);
		this.addAutoEventListener(this.$.vscrollarea, "scroll", () => { updateVScroll(this, this.$.vscrollarea); });
		this.addAutoEventListener(this.$.hscrollarea, "scroll", () => { updateHScroll(this, this.$.hscrollarea); });
	}

	detached() {
		this.$.resizeDetector.removeOwner(this);
	}

	static get template() {
		return  `
			<template>
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
			</template>
		`;
	}
}

window.customElements.define(componentName, VicowaDataGrid);
