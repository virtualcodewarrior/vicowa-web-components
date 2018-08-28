import { webComponentBaseClass } from '../third_party/web-component-base-class/dist/webComponentBaseClass.js';
import observerFactory from '../utilities/observerFactory.js';

const componentName = 'vicowa-resize-detector';
let resizeHandlerCounter = 1;

/**
 * Class to represent the vicowa-resize-detector custom element
 * @extends webComponentBaseClass
 */
class VicowaResizeDetector extends webComponentBaseClass {
	static get is() { return componentName; }
	constructor() {
		super();
		this._handlers = observerFactory();
		this._id = resizeHandlerCounter;
		this._rect = {};
		resizeHandlerCounter++;
	}

	static get properties() {
		return {};
	}

	attached() {
		const resizeDetect = '<!DOCTYPE html>\n' +
			'<html>\n' +
			'	<body>\n' +
			'	<script>\n' +
			"	function ready(fn){ if (document.readyState !== 'loading'){ fn(); } else { document.addEventListener('DOMContentLoaded', fn); } }\n" +
			`	const handleResize = function(){ window.parent.postMessage({ message: 'resize', target: ${this._id} },'*'); }\n` +
			'	window.addEventListener(\'resize\', handleResize);\n' +
			'	ready(handleResize);\n' +
			'	window.oncontextmenu = function() { return false; };\n' +
			'	</script>\n' +
			'	</body>\n' +
			'</html>';

		const computedStyle = (this.parentElement) ? getComputedStyle(this.parentElement, null) : null;
		if (!computedStyle || !computedStyle.position || computedStyle.position === 'static') {
			throw new Error('make sure this element is contained within a positioned element, e.g. position: absolute, position: relative');
		}
		this.$.detector.src = `data:text/html;charset=utf-8,${escape(resizeDetect)}`;

		this.addAutoEventListener(window, 'message', (p_Message) => {
			if (p_Message.data && p_Message.data.message && p_Message.data.message === 'resize' && p_Message.data.target === this._id) {
				const newRect = this.getBoundingClientRect();
				this._handlers.notify('resize', { oldRect: this._rect, newRect });
				this._rect = newRect;
			}
		});

		this._rect = this.getBoundingClientRect();
	}

	addObserver(p_Handler, p_Owner) {
		this._handlers.addObserver('resize', p_Handler, p_Owner);
	}

	removeObserver(p_Handler) {
		this._handlers.removeObserver('resize', p_Handler);
	}

	removeOwner(p_Owner) {
		this._handlers.removeOwner(p_Owner);
	}
}

window.customElements.define(componentName, VicowaResizeDetector);