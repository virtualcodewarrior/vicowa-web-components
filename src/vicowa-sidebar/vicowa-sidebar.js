import { WebComponentBaseClass } from "/third_party/web-component-base-class/src/web-component-base-class.js";

/**
 * Class that represents the vicowa-sidebar custom element
 * @extends WebComponentBaseClass
 * @property {string} location The location where the expandable bar is located.This can be one of left,right,top,bottom
 * @property {boolean} expanded Indicate if the bar should be expanded or not
 * @property {boolean} resizeable Indicate if the bar is user resizeable
 * @property {boolean} floating Indicate if the bar if in floating (on top) mode
 * @property {boolean} forceNonFloating Indicate that the bar will not switch automatically to floating when running in a small size (like mobile phone)
 */
class VicowaSideBar extends WebComponentBaseClass {
	constructor() {
		super();
	}

	static get properties() {
		return {
			location: {
				type: String,
				value: "left",
				reflectToAttribute: true,
			},
			expanded: {
				type: Boolean,
				value: true,
				reflectToAttribute: true,
			},
			resizeable: {
				type: Boolean,
				value: false,
				reflectToAttribute: true,
			},
			floating: {
				type: Boolean,
				value: false,
				reflectToAttribute: true,
			},
			forceNonFloating: {
				type: Boolean,
				value: false,
				reflectToAttribute: true,
			},
		};
	}

	attached() {
		let startPos = 0;
		let startSize = 0;
		let vertical = false;
		let invertFactor = 1;
		let maxSize = 0;
		const handleDrag = (event) => {
			const dragPos = (vertical) ? event.clientY : event.clientX;
			const delta = startPos - dragPos;
			const newSize = startSize - (invertFactor * delta);
			this.$.sideContent.style.flexBasis = `${Math.min(maxSize, Math.max(0, newSize))}px`;
			if (vertical) {
				const resizerSize = this.$.resizeHandle.getBoundingClientRect().height;
				this.$.innerContainer.style.minHeight = `${Math.min(maxSize, Math.max(0, newSize - resizerSize))}px`;
				this.$.sideContent.style.height = `${Math.min(maxSize, Math.max(0, newSize))}px`;
			} else {
				const resizerSize = this.$.resizeHandle.getBoundingClientRect().width;
				this.$.innerContainer.style.minWidth = `${Math.min(maxSize, Math.max(0, newSize - resizerSize))}px`;
				this.$.sideContent.style.width = `${Math.min(maxSize, Math.max(0, newSize))}px`;
			}
		};
		const handleTouchDrag = (event) => {
			event.clientX = event.touches[0].clientX;
			event.clientY = event.touches[0].clientY;
			handleDrag(event);
		};

		const handleDragEnd = () => {
			this.classList.toggle("resizing", false);
			this.removeAutoEventListener(window, "mouseup", handleDragEnd);
			this.removeAutoEventListener(window, "touchend", handleDragEnd);
			this.removeAutoEventListener(window, "mousemove", handleDrag);
			this.removeAutoEventListener(window, "touchmove", handleTouchDrag);
		};

		const handleDragStart = (event) => {
			vertical = this.location === "top" || this.location === "bottom";
			invertFactor = (this.location === "bottom" || this.location === "right") ? -1 : 1;
			maxSize = (vertical) ? this.$.main.getBoundingClientRect().height : this.getBoundingClientRect().width;
			startSize = (vertical) ? this.$.sideContent.getBoundingClientRect().height : this.$.sideContent.getBoundingClientRect().width;
			this.addAutoEventListener(window, "mouseup", handleDragEnd);
			this.addAutoEventListener(window, "touchend", handleDragEnd);
			this.addAutoEventListener(window, "mousemove", handleDrag);
			this.addAutoEventListener(window, "touchmove", handleTouchDrag);
			this.classList.toggle("resizing", true);
			startPos = (vertical) ? event.clientY : event.clientX;
			console.log(`start ${startPos}`);
		};
		const handleTouchDragStart = (event) => {
			event.clientX = event.touches[0].clientX;
			event.clientY = event.touches[0].clientY;
			handleDragStart(event);
		};

		this.addAutoEventListener(this.$.resizeHandle, "mousedown", handleDragStart);
		this.addAutoEventListener(this.$.resizeHandle, "touchstart", handleTouchDragStart);
	}

	static get template() {
		return `
			<style>
				:host {
					display: block;
				}
		
				#main {
					position: relative;
					width: 100%;
					height: 100%;
					display: flex;
					flex-direction: row;
					align-items: stretch;
					align-content: stretch;
					box-sizing: border-box;
				}
		
				:host([location="top"]) #main,
				:host([location="bottom"]) #main,
				:host([location="top"]) #side-content,
				:host([location="bottom"]) #side-content {
					flex-direction: column;
				}
		
				#side-content {
					position: relative;
					display: flex;
					flex-direction: row;
					align-items: stretch;
					align-content: stretch;
					justify-content: flex-end;
					flex: 0 0 var(--vicowa-sidebar-size, 300px);
					order: 0;
				}
		
				:host([location="right"]) #side-content,
				:host([location="bottom"]) #side-content {
					justify-content: flex-start;
				}
		
				:host([location="left"]) #side-content,
				:host([location="right"]) #side-content {
					height: 100%;
				}
		
				:host([location="top"]) #side-content,
				:host([location="bottom"]) #side-content {
					width: 100%;
				}
		
				:host([expanded][location="left"]) #side-content,
				:host([expanded][location="right"]) #side-content {
					max-width: 100%;
					width: var(--vicowa-sidebar-size, 300px);
					transition: max-width 0.5s cubic-bezier(1,0,1,0);
				}
		
				:host([expanded][location="top"]) #side-content,
				:host([expanded][location="bottom"]) #side-content {
					transition: max-height 0.5s cubic-bezier(1,0,1,0);
					height: var(--vicowa-sidebar-size, 300px);
					max-height: 100%;
				}
		
				:host([location="left"]) #side-content,
				:host([location="right"]) #side-content {
					transition: max-width 0.75s cubic-bezier(0,1,0,1);
					max-width: 0;
				}
		
				:host([location="top"]) #side-content,
				:host([location="bottom"]) #side-content {
					transition: max-height 0.75s cubic-bezier(0,1,0,1);
					max-height: 0;
				}
		
				#innerContainer {
					display: block;
					position: relative;
					flex: 1 1 auto;
					box-sizing: border-box;
					min-width: calc(var(--vicowa-sidebar-size, 300px) - var(--vicowa-sidebar-resizer-size, 5px));
					height: 100%;
					order: 1;
					overflow: hidden;
				}
		
				:host([location="top"]) #innerContainer,
				:host([location="bottom"]) #innerContainer {
					width: 100%;
					height: calc(var(--vicowa-sidebar-size, 300px) - var(--vicowa-sidebar-resizer-size, 5px));
				}
		
				#main-content {
					position: relative;
					flex: 1 1 auto;
					order: 2;
					overflow: hidden;
				}
		
				:host([location="right"]) #side-content,
				:host([location="bottom"]) #side-content {
					order: 2;
				}
		
				:host([location="right"]) #resize-handle,
				:host([location="bottom"]) #resize-handle {
					order: 0;
				}
		
				:host([location="right"]) #main-content,
				:host([location="bottom"]) #main-content {
					order: 0;
				}
		
				#resize-handle {
					position: relative;
					display: none;
					cursor: col-resize;
					flex: 0 0 var(--vicowa-sidebar-resizer-size, 5px);
					order: 2;
					background: white;
					overflow: visible;
				}
		
				#hitarea {
					background: transparent;
					position: absolute;
					width: var(--vicowa-sidebar-min-hit-area, 7px);
					left: var(--vicowa-sidebar-min-hit-area-start, -3px);
					top: 0;
					height: 100%;
				}
		
				:host([location="top"]) #hitarea,
				:host([location="bottom"]) #hitarea {
					width: 100%;
					left: 0;
					top: var(--vicowa-sidebar-min-hit-area-start, -3px);
					height: var(--vicowa-sidebar-min-hit-area, 7px);
				}
		
				.dragarea {
					display: none;
					position: fixed;
					left: 0;
					top: 0;
					right: 0;
					bottom: 0;
					background: transparent;
				}
		
				:host(.resizing) .dragarea {
					display: block;
					z-index: 10;
				}
		
				:host([location="top"]) #resize-handle,
				:host([location="bottom"]) #resize-handle {
					cursor: row-resize;
				}
		
				:host([resizeable]) #resize-handle {
					display: block;
				}
		
				:host([floating]) main {
					display: block;
				}
		
				:host([floating]) #side-content {
					box-shadow: 0 0 12px gray;
				}
		
				:host([floating][location="left"]) #side-content {
					position: absolute;
					left: 0;
				}
		
				:host([floating][location="top"]) #side-content {
					position: absolute;
					top: 0;
				}
		
				:host([floating][location="right"]) #side-content {
					position: absolute;
					right: 0;
				}
		
				:host([floating][location="bottom"]) #side-content {
					position: absolute;
					bottom: 0;
				}
		
				@media screen and (max-width: 600px) {
					:host(:not([force-non-floating])[location="left"]) #side-content,
					:host(:not([force-non-floating])[location="right"]) #side-content {
						box-shadow: 0 0 12px gray;
					}
			
					:host(:not([force-non-floating])[location="left"]) main,
					:host(:not([force-non-floating])[location="right"]) main {
						display: block;
					}
			
					:host(:not([force-non-floating])[location="left"]) #side-content {
						position: absolute;
						left: 0;
					}
			
					:host(:not([force-non-floating])[location="right"]) #side-content {
						position: absolute;
						right: 0;
					}
				}
				@media screen and (max-height: 500px) {
					:host(:not([force-non-floating])[location="top"]) #side-content,
					:host(:not([force-non-floating])[location="bottom"]) #side-content {
						box-shadow: 0 0 12px gray;
					}
			
					:host(:not([force-non-floating])[location="top"]) main,
					:host(:not([force-non-floating])[location="bottom"]) main {
						display: block;
					}
			
					:host(:not([force-non-floating])[location="top"]) #side-content {
						position: absolute;
						top: 0;
					}
			
					:host(:not([force-non-floating])[location="bottom"]) #side-content {
						position: absolute;
						bottom: 0;
					}
				}
			</style>
			<div id="main">
				<div id="main-content"><slot name="main-content"></slot></div>
				<div id="side-content"><div id="innerContainer"><slot name="side-content"></slot></div><div id="resize-handle"><div id="hitarea"></div><slot name="hitarea-content"></slot><div class="dragarea"></div></div></div>
			</div>
		`;
	}
}

window.customElements.define("vicowa-sidebar", VicowaSideBar);
