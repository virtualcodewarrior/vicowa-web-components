import { webComponentBaseClass } from '../third_party/web-component-base-class/src/webComponentBaseClass.js';

const babylon = window.BABYLON;
const componentName = 'vicowa-babylon';

/**
 * Class to represent the vicowa-icon custom element
 * @extends webComponentBaseClass
 * @property {boolean} open Set to true to open the modal or false the close it
 */
class VicowaBabylon extends webComponentBaseClass {
	static get is() { return componentName; }
	constructor() {
		super();
		this._activeTranslator = null;
	}

	static get properties() {
		return {};
	}

	attached() {
		const engine = new babylon.Engine(this.$.canvas, true, { preserveDrawingBuffer: true, stencil: true });
		const createScene = () => {
			// Create a basic BJS Scene object
			const scene = new babylon.Scene(engine);
			// Create a FreeCamera, and set its position to {x: 0, y: 5, z: -10}
			const camera = new babylon.FreeCamera('camera1', new babylon.Vector3(0, 5, -10), scene);
			// Target the camera to scene origin
			camera.setTarget(babylon.Vector3.Zero());
			// Attach the camera to the canvas
			camera.attachControl(this.$.canvas, false);
			// Create a basic light, aiming 0, 1, 0 - meaning, to the sky
			const light = new babylon.HemisphericLight('light1', new babylon.Vector3(0, 1, 0), scene);
			// Create a built-in "sphere" shape; its constructor takes 6 params: name, segment, diameter, scene, updatable, sideOrientation
			const sphere = babylon.Mesh.CreateSphere('sphere1', 16, 2, scene, false, babylon.Mesh.FRONTSIDE);
			// Move the sphere upward 1/2 of its height
			sphere.position.y = 1;
			// Create a built-in "ground" shape; its constructor takes 6 params : name, width, height, subdivision, scene, updatable
			const ground = babylon.Mesh.CreateGround('ground1', 6, 6, 2, scene, false);
			// Return the created scene
			return scene;
		};

		const scene = createScene();
		engine.runRenderLoop(() => { scene.render(); });

		const resizeDetector = this.$.resizeDetector;
		resizeDetector.addObserver(() => {
			engine.resize();
		}, this);
	}
}

window.customElements.define(componentName, VicowaBabylon);
