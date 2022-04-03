import { WebComponentBaseClass } from "/third_party/web-component-base-class/src/web-component-base-class.js";
import "../vicowa-string/vicowa-string.js";
import "../vicowa-icon/vicowa-icon.js";

/**
 * @extends WebComponentBaseClass
 * @property {string} header The header text
 * @property {boolean} collapsible Indicates if the control is collapsible
 * @property {boolean} expanded Indicates if the panel is expanded
 * @property {string} expandControlAnimation Type of animation to use on the collapse control. Defaults to rotate
 */
class VicowaPanel extends WebComponentBaseClass {
	constructor() {
		super();
	}

	static get properties() {
		return {
			header: { type: String, value: "", reflectToAttribute: true, observer: (inst) => { inst.$.title = inst.header; } },
			collapsible: { type: Boolean, value: false, reflectToAttribute: true },
			expanded: { type: Boolean, value: true, reflectToAttribute: true },
			expandControlAnimation: { type: String, value: "rotate", reflectToAttribute: true },
		};
	}

	attached() {
		this.addAutoEventListener(this.$.collapseControl, "click", () => {
			this.expanded = !this.expanded;
		});
	}

	static get template() {
		return `
			<style>
				:host {
					display: block;
					box-sizing: border-box;
				}
		
				#main,
					#content {
					display: flex;
					flex-direction: column;
					align-items: stretch;
				}
		
				#header,
				#footer-content {
					display: flex;
					flex-direction: row;
					flex-wrap: nowrap;
					align-items: center;
				}
		
				#collapse-control {
					display: none;
					cursor: pointer;
				}
		
				:host([collapsible]) #collapse-control {
					display: block;
				}
		
				#collapse-control {
					margin: var(--vicowa-panel-collapse-control-margin, 0 5px 0 3px);
					transform: rotate(0);
				}
		
				:host([expand-control-animation="rotate"]) #collapse-control {
					transition: transform .5s;
				}
		
				:host([expand-control-animation="rotate"][expanded]) #collapse-control {
					transform: rotate(90deg);
				}
		
				#header,
				#footer-content {
					box-sizing: border-box;
					flex: 0 0 auto;
				}
		
				#content {
					flex: 0 0 auto;
					max-height: 0;
					overflow: hidden;
					transition: max-height .75s cubic-bezier(0,1,0,1);
				}
		
				:host(:not([collapsible])) #content,
				:host([collapsible][expanded]) #content {
					transition: max-height .5s cubic-bezier(1,0,1,0);
					max-height: 10000px;
				}
		
				#main-content {
					overflow: hidden;
				}
		
				slot[name="header-content"] {
					flex: 1 1 auto;
				}
		
				#header {
					padding: var(--vicow-panel-header-padding, 0 0 0 5px);
					position: relative;
		
					height: var(--vicowa-panel-header-height, auto);
					background: var(--vicowa-panel-header-background, transparent);
					border-top: var(--vicowa-panel-header-border-top, 1px solid #ddd);
					border-right: var(--vicowa-panel-header-border-right, 1px solid #ddd);
					border-bottom: var(--vicowa-panel-header-border-bottom, 1px solid #ddd);
					border-left: var(--vicowa-panel-header-border-left, 1px solid #ddd);
				}
		
				#main-content {
					position: relative;
					height: var(--vicowa-panel-main-height, auto);
					background: var(--vicowa-panel-main-background, transparent);
					border-top: var(--vicowa-panel-main-border-top, none);
					border-right: var(--vicowa-panel-main-border-right, 1px solid #ddd);
					border-bottom: var(--vicowa-panel-main-border-bottom, none);
					border-left: var(--vicowa-panel-main-border-left, 1px solid #ddd);
				}
		
				#footer-content {
					position: relative;
					height: var(--vicowa-panel-footer-height, auto);
					background: var(--vicowa-panel-footer-background, transparent);
					border-top: var(--vicowa-panel-footer-border-top, 1px solid #ddd);
					border-right: var(--vicowa-panel-footer-border-right, 1px solid #ddd);
					border-bottom: var(--vicowa-panel-footer-border-bottom, 1px solid #ddd);
					border-left: var(--vicowa-panel-footer-border-left, 1px solid #ddd);
				}
		
				vicowa-icon {
					position: relative;
					display: none;
					width: 24px;
				}
		
				:host('collapsible') vicowa-icon:not([icon=""]) {
					display: block;
				}
			</style>
			<div id="main">
				<div id="header"><div id="collapse-control"><vicowa-icon icon=""></vicowa-icon><span id="text">&gt;</span></div><vicowa-string id="title"></vicowa-string><slot name="header-content"></slot></div>
				<div id="content"><div id="main-content"><slot name="main-content"></slot></div><div id="footer-content"><slot name="footer-content"></slot></div></div>
			</div>
		`;
	}
}

window.customElements.define("vicowa-panel", VicowaPanel);
