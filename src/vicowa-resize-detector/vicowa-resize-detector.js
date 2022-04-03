import { WebComponentBaseClass } from "/third_party/web-component-base-class/src/web-component-base-class.js";
import observerFactory from "../utilities/observerFactory.js";

let resizeHandlerCounter = 1;

/**
 * Class to represent the vicowa-resize-detector custom element
 * @extends WebComponentBaseClass
 */
class VicowaResizeDetector extends WebComponentBaseClass {
	#handlers;
	#id;
	#rect;
	constructor() {
		super();
		this.#handlers = observerFactory();
		this.#id = resizeHandlerCounter;
		this.#rect = {};
		resizeHandlerCounter++;
	}

	static get properties() {
		return {};
	}

	attached() {
		const resizeDetect = "<!DOCTYPE html>\n" +
			"<html>\n" +
			"	<body>\n" +
			"	<script>\n" +
			"	function ready(fn){ if (document.readyState !== 'loading'){ fn(); } else { document.addEventListener('DOMContentLoaded', fn); } }\n" +
			`	const handleResize = function(){ window.parent.postMessage({ message: 'resize', target: ${this.#id} },'*'); }\n` +
			"	window.addEventListener('resize', handleResize);\n" +
			"	ready(handleResize);\n" +
			"	window.oncontextmenu = function() { return false; };\n" +
			"	</script>\n" +
			"	</body>\n" +
			"</html>";

		const computedStyle = (this.parentElement) ? getComputedStyle(this.parentElement, null) : null;
		if (!computedStyle || !computedStyle.position || computedStyle.position === "static") {
			throw new Error("make sure this element is contained within a positioned element, e.g. position: absolute, position: relative");
		}
		this.$.detector.src = `data:text/html;charset=utf-8,${escape(resizeDetect)}`;

		this.addAutoEventListener(window, "message", (message) => {
			if (message.data && message.data.message && message.data.message === "resize" && message.data.target === this.#id) {
				const newRect = this.getBoundingClientRect();
				this.#handlers.notify("resize", { oldRect: this.#rect, newRect });
				this.#rect = newRect;
			}
		});

		this.#rect = this.getBoundingClientRect();
	}

	addObserver(handler, owner) {
		this.#handlers.addObserver("resize", handler, owner);
	}

	removeObserver(handler) {
		this.#handlers.removeObserver("resize", handler);
	}

	removeOwner(owner) {
		this.#handlers.removeOwner(owner);
	}

	static get template() {
		return `
			<style>
				:host,
					iframe {
					display: block;
					position: absolute;
					top: 0;
					right: 0;
					bottom: 0;
					left: 0;
					pointer-events: none;
					opacity: 0;
					border: none;
					width: 100%;
					height: 100%;
					background: transparent;
				}
			</style>
			<iframe id="detector"></iframe>
		`;
	}
}

window.customElements.define("vicowa-resize-detector", VicowaResizeDetector);
