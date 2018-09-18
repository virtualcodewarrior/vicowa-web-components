/* eslint new-cap: ["off"] */
/* switching this off for this file because babylon uses almost all uppercase starting function names */
import { webComponentBaseClass } from "../third_party/web-component-base-class/src/webComponentBaseClass.js";

const babylon = window.BABYLON;
const componentName = "vicowa-webgl";

function handleLoadingScreenChange(p_WebGLControl) {
	if (p_WebGLControl._assetsManager) {
		p_WebGLControl._assetsManager.useDefaultLoadingScreen = p_WebGLControl.loadingScreen;
	}
}

function createShadowGenerator(p_WebGLControl, p_Light) {
	const shadowGenerator = new babylon.ShadowGenerator(1024, p_Light);
	shadowGenerator.bias = 0.0001;
	shadowGenerator.forceBackFacesOnly = true;
	shadowGenerator.bias = 0.001;
	shadowGenerator.normalBias = 0.02;
	p_Light.shadowMaxZ = 100;
	p_Light.shadowMinZ = 10;
	// remark for now for performance
	// shadowGenerator.useContactHardeningShadow = true;
	// shadowGenerator.contactHardeningLightSizeUVRatio = 0.05;
	shadowGenerator.setDarkness(0.2);

	return shadowGenerator;
}

function addShadowCaster(p_WebGLControl, p_MeshObject) {
	Object.keys(p_WebGLControl._lights).forEach((p_Light) => {
		const light = p_WebGLControl._lights[p_Light];
		if (light.shadowGenerator) {
			light.shadowGenerator.addShadowCaster(p_MeshObject);
		}
	});
}
/**
 * Class to represent the vicowa-icon custom element
 * @extends webComponentBaseClass
 * @property {boolean} open Set to true to open the modal or false the close it
 */
class VicowaWebgl extends webComponentBaseClass {
	static get is() { return componentName; }
	constructor() {
		super();
		this._lights = {};
		this._meshes = {};
		this._materials = {};
	}

	static get properties() {
		return {
			loadingScreen: {
				type: Boolean,
				value: true,
				reflectToAttribute: true,
				observer: handleLoadingScreenChange,
			},
		};
	}

	async addMeshResource(p_Name, p_MeshName, p_FileName, p_NoShadows) {
		const meshTask = this._assetsManager.addMeshTask(p_Name, p_MeshName, `${p_FileName.split("/").slice(0, -1).join("/")}/`, p_FileName.split("/").slice(-1)[0]);
		return await new Promise((resolve, reject) => {
			meshTask.onSuccess = (task) => {
				task.loadedMeshes[0].position = babylon.Vector3.Zero();
				this._meshes[p_Name] = task.loadedMeshes[0];
				if (!p_NoShadows) {
					Object.keys(this._lights).forEach((p_LightKey) => {
						if (this._lights[p_LightKey].shadowGenerator) {
							this._lights[p_LightKey].shadowGenerator.addShadowCaster(task.loadedMeshes[0], true);
						}
					});
					task.loadedMeshes[0].receiveShadows = true;
				}
				resolve();
			};
			meshTask.onError = (p_Task, p_Message, pException) => {
				reject({ message: p_Message, exception: pException });
			};
			this._assetsManager.load();
		});
	}

	setBackgroundColor(p_Red, p_Green, p_Blue) { this._scene.clearColor = new babylon.Color3(p_Red, p_Green, p_Blue); }
	setAmbientColor(p_Red, p_Green, p_Blue) { this._scene.ambientColor = new babylon.Color3(p_Red, p_Green, p_Blue); }

	createSkyBox(p_SkyBoxImageDirectory) {
		// using the "old" way of creating skybox, bcause the helper function makes it very very slow
		const skybox = babylon.MeshBuilder.CreateBox("skyBox", { size: 1000.0, sideOrientation: babylon.Mesh.BACKSIDE }, this._scene);
		const skyboxMaterial = new babylon.StandardMaterial("skyBox", this._scene);
		skyboxMaterial.backFaceCulling = true;
		skyboxMaterial.reflectionTexture = new babylon.CubeTexture(p_SkyBoxImageDirectory, this._scene);
		skyboxMaterial.reflectionTexture.coordinatesMode = babylon.Texture.SKYBOX_MODE;
		skyboxMaterial.diffuseColor = new babylon.Color3(0, 0, 0);
		skyboxMaterial.specularColor = new babylon.Color3(0, 0, 0);
		skybox.material = skyboxMaterial;
	}

	addSphere(p_Name, p_Settings) {
		const sphere = babylon.MeshBuilder.CreateSphere(p_Name, { segments: p_Settings.segments || 16, diameter: p_Settings.diameter || 1, diameterX: p_Settings.diameterX || p_Settings.diameter || 1, diameterY: p_Settings.diameterY || p_Settings.diameter || 1, diameterZ: p_Settings.diameterZ || p_Settings.diameter || 1, arc: p_Settings.arc || 1, slice: p_Settings.slice || 1, sideOrientation: p_Settings.sideOrientation }, this._scene);
		if (p_Settings.castShadows) {
			addShadowCaster(this, sphere);
			sphere.receiveShadows = true;
		}
		this._meshes[p_Name] = sphere;
		return sphere;
	}

	addBox(p_Name, p_Settings) {
		const box = babylon.MeshBuilder.CreateBox(p_Name, { width: p_Settings.width || 1, height: p_Settings.height || 1, depth: p_Settings.depth || 1, sideOrientation: p_Settings.sideOrientation }, this._scene);
		if (p_Settings.castShadows) {
			addShadowCaster(this, box);
			box.receiveShadows = true;
		}
		this._meshes[p_Name] = box;
		return box;
	}

	addPlane(p_Name, p_Settings) {
		const plane = babylon.MeshBuilder.CreatePlane(p_Name, { width: p_Settings.width || 1, height: p_Settings.height || 1, sideOrientation: p_Settings.sideOrientation }, this._scene);
		if (p_Settings.castShadows) {
			addShadowCaster(this, plane);
			plane.receiveShadows = true;
		}
		this._meshes[p_Name] = plane;
		return plane;
	}

	addGround(p_Name, p_Settings) {
		const ground = babylon.MeshBuilder.CreateGround(p_Name, { width: p_Settings.width || 1, height: p_Settings.height || 1, subdivisions: p_Settings.subdivisions || 1 }, this._scene);
		this._meshes[p_Name] = ground;
		ground.receiveShadows = true;
		return ground;
	}

	addPolyline(p_Name, p_Points, p_CastShadows) {
		const linePoints = p_Points.map((p_Point) => new babylon.Vector3(p_Point.x, p_Point.y, p_Point.z));
		const polyLine = (linePoints.length > 1) ? babylon.MeshBuilder.CreateLines(p_Name, { points: linePoints }, this._scene) : null;
		if (polyLine && p_CastShadows) {
			addShadowCaster(this, polyLine);
			polyLine.receiveShadows = true;
		}
		this._meshes[p_Name] = polyLine;
		return polyLine;
	}

	startRendering() {
		this._engine.runRenderLoop(() => { this._scene.render(); });
	}

	stopRendering() {
		this._engine.stopRenderLoop();
	}

	addDirectionalLight(p_Name, p_Settings) {
		const light = new babylon.DirectionalLight(p_Name, new babylon.Vector3(p_Settings.x || 0, p_Settings.y || 0, p_Settings.z || 0), this._scene);
		this._lights[p_Name] = { light };
		if (p_Settings.generateShadows) {
			this._lights[p_Name].shadowGenerator = createShadowGenerator(this, light);
		}
	}

	addEnviromentalLight(p_Name, p_Settings) {
		this._lights[p_Name] = new babylon.HemisphericLight(p_Name, new babylon.Vector3(p_Settings.x || 0, p_Settings.y || 0, p_Settings.z || 0), this._scene);
	}

	addPointLight(p_Name, p_Settings) {
		const light = new babylon.PointLight(p_Name, new babylon.Vector3(p_Settings.x || 0, p_Settings.y || 0, p_Settings.z || 0), this._scene);
		this._lights[p_Name] = light;
		if (p_Settings.generateShadows) {
			this._lights[p_Name].shadowGenerator = createShadowGenerator(this, light);
		}
	}

	addSpotLight(p_Name, p_Settings) {
		const light = new babylon.SpotLight(p_Name, new babylon.Vector3(p_Settings.x || 0, p_Settings.y || 0, p_Settings.z || 0), new babylon.Vector3(p_Settings.direction.x || 0, p_Settings.direction.y || 0, p_Settings.direction.z || 0), p_Settings.angle || 0, p_Settings.reach || 100, this._scene);
		this._lights[p_Name] = light;
		if (p_Settings.generateShadows) {
			this._lights[p_Name].shadowGenerator = createShadowGenerator(this, light);
		}
	}

	setLightColors(p_Name, p_Colors) {
		const light = this._lights[p_Name];
		if (light) {
			if (p_Colors.diffuse) {
				Object.assign(light.diffuse, p_Colors.diffuse);
			}
			if (p_Colors.specular) {
				Object.assign(light.specular, p_Colors.specular);
			}
		}
	}

	setMeshPosition(p_Name, p_Position) {
		const mesh = this._meshes[p_Name];
		if (mesh) {
			Object.assign(mesh.position, p_Position);
		}
	}

	setGroundLightColor(p_Name, p_Color) {
		const light = this._lights[p_Name];
		if (light && light instanceof babylon.HemisphericLight) {
			Object.assign(light.groundColor, p_Color);
		}
	}

	setCameraTarget(p_MeshName) {
		const mesh = this._meshes[p_MeshName];
		if (mesh) {
			this._camera.setTarget(mesh);
		}
	}

	addMaterial(p_MaterialName, p_Colors) {
		const material = this._materials[p_MaterialName] = new babylon.StandardMaterial(p_MaterialName, this._scene);
		if (p_Colors.diffuse) {
			Object.assign(material.diffuseColor, p_Colors.diffuse);
		}
		if (p_Colors.specular) {
			Object.assign(material.specularColor, p_Colors.specular);
		}
		if (p_Colors.emissive) {
			Object.assign(material.emissiveColor, p_Colors.emissive);
		}
		if (p_Colors.ambient) {
			Object.assign(material.ambientColor, p_Colors.ambient);
		}
		if (p_Colors.alpha !== undefined) {
			material.alpha = p_Colors.alpha;
		}
	}

	setMeshMaterial(p_MeshName, p_MaterialName) {
		const mesh = this._meshes[p_MeshName];
		const material = this._materials[p_MaterialName];
		if (mesh && material) {
			mesh.material = material;
		}
	}

	attached() {
		// create the engine
		this._engine = new babylon.Engine(this.$.canvas, true, { preserveDrawingBuffer: true, stencil: true });
		const createScene = () => {
			// Create a Scene object
			this._scene = new babylon.Scene(this._engine);

			this._camera = new babylon.ArcRotateCamera("camera1", 3 * Math.PI / 2, -Math.PI / 2, 50, babylon.Vector3.Zero(), this._scene);
			this._camera.useFramingBehavior = true;
			// Attach the camera to the canvas
			this._camera.attachControl(this.$.canvas, false);

			this._assetsManager = new babylon.AssetsManager(this._scene);
			this._assetsManager.useDefaultLoadingScreen = this.loadingScreen;

			// Target the camera to scene origin initially
			this._camera.setTarget(babylon.Vector3.Zero());

			this._assetsManager.onFinish = () => {
				this.startRendering();
			};
		};

		createScene();

		const resizeDetector = this.$.resizeDetector;
		resizeDetector.addObserver(() => {
			this._engine.resize();
		}, this);
	}
}

window.customElements.define(componentName, VicowaWebgl);
