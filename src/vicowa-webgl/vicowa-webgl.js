/* eslint new-cap: ["off"] */
/* switching this off for this file because babylon uses almost all uppercase starting function names */
import { webComponentBaseClass } from "../third_party/web-component-base-class/src/webComponentBaseClass.js";
import { CAMERA_TYPES/* , MANIPULATOR_TYPES*/ } from "./vicowa-webgl-definitions.js";
import { toRadians } from "../utilities/mathHelpers.js";
import debug from "../utilities/debug.js";

const privateData = Symbol["privateData"];

const babylon = window.BABYLON;
const componentName = "vicowa-webgl";

let nameID = 0;
// validate the name or create a name when none is specified
function ensureName(p_Name) {
	debug.assert(!p_Name || !/--/.test(p_Name), "names containing a double dash '--' are reserved for internal use only");
	if (!p_Name) {
		nameID++;
		p_Name = `objectID--${nameID}`;
	}
	return p_Name;
}

function handleLoadingScreenChange(p_WebGLControl) {
	const controlData = p_WebGLControl[privateData];
	if (controlData.assetsManager) {
		controlData.assetsManager.useDefaultLoadingScreen = p_WebGLControl.loadingScreen;
	}
}

function multiplyObject(p_Object, p_Multiplier, p_KeysToMultiply) {
	Object.keys(p_Object).filter((p_Key) => p_KeysToMultiply.indexOf(p_Key) !== -1).forEach((p_Key) => { p_Object[p_Key] = (p_Object[p_Key] || 0) * p_Multiplier; });
	return p_Object;
}

function setVisibility(p_Mesh, p_Visibility) {
	p_Mesh.isVisible = p_Visibility;
	p_Mesh.getChildren().forEach((p_Child) => setVisibility(p_Child, p_Visibility));
}

function multiplyVector(p_Vector, p_Multiplier) {
	return multiplyObject(p_Vector, p_Multiplier, ["x", "y", "z"]);
}

function convertToVectorObject(p_Vector) {
	return (Array.isArray(p_Vector)) ? { x: p_Vector[0], y: p_Vector[1], z: p_Vector[2] } : p_Vector;
}

function convertToVector3(p_Vector) {
	return new babylon.Vector3(p_Vector.x, p_Vector.y, p_Vector.z);
}

function flattenMeshes(p_Mesh) {
	return [p_Mesh].concat(p_Mesh.getChildMeshes(false));
}

function getMeshObject(p_WebGLControl, p_MeshNameOrPath) {
	const controlData = p_WebGLControl[privateData];
	let mesh = null;
	if (Array.isArray(p_MeshNameOrPath)) {
		// this is a path to the mesh, maybe because we clicked a child mesh
		mesh = controlData.meshes[p_MeshNameOrPath[0]] || controlData.clones[p_MeshNameOrPath[0]];
		p_MeshNameOrPath.slice(1).forEach((p_Name) => {
			if (mesh) {
				mesh = mesh.getChildMeshes(true, (p_ChildMesh) => p_ChildMesh.name === p_Name)[0];
			}
		});
	} else {
		mesh = controlData.meshes[p_MeshNameOrPath] || controlData.clones[p_MeshNameOrPath];
	}
	return mesh;
}

function createShadowGenerator(p_WebGLControl, p_Light) {
	const shadowGenerator = new babylon.ShadowGenerator(1024, p_Light);
	shadowGenerator.getShadowMap().refreshRate = babylon.RenderTargetTexture.REFRESHRATE_RENDER_ONCE;
	shadowGenerator.bias = 0.0001;
	shadowGenerator.forceBackFacesOnly = true;
	shadowGenerator.normalBias = 0.02;
	p_Light.shadowMaxZ = 1000;
	p_Light.shadowMinZ = -1000;
	// remark for now for performance
	shadowGenerator.useContactHardeningShadow = true;
	shadowGenerator.contactHardeningLightSizeUVRatio = 0.05;
	shadowGenerator.setDarkness(0.2);

	return shadowGenerator;
}

function addShadowCaster(p_ControlData, p_MeshObject) {
	Object.keys(p_ControlData.lights).forEach((p_Light) => {
		const light = p_ControlData.lights[p_Light];
		if (light.shadowGenerator) {
			light.shadowGenerator.addShadowCaster(p_MeshObject);
		}
	});
}

function applyRecursive(p_Mesh, p_PropertyName, p_PropertyValue) {
	p_Mesh[p_PropertyName] = p_PropertyValue;
	p_Mesh.getChildMeshes(false).forEach((p_Child) => { p_Child[p_PropertyName] = p_PropertyValue; });
}

function applyAllMeshes(p_Meshes, p_ExludedNames, p_PropertyName, p_PropertyValue) {
	Object.keys(p_Meshes).forEach((p_Key) => { if (p_ExludedNames.indexOf(p_Key) === -1) { applyRecursive(p_Meshes[p_Key], p_PropertyName, p_PropertyValue); } });
}

function setPosition(p_Mesh, p_Position, p_UnitMultiplier) {
	Object.assign(p_Mesh.position, multiplyVector(p_Position, p_UnitMultiplier));
}

function setRotation(p_Mesh, p_Rotation) {
	Object.assign(p_Mesh.rotation, { x: toRadians(p_Rotation.x), y: toRadians(p_Rotation.y), z: toRadians(p_Rotation.z) });
}

function setScale(p_Mesh, p_Scale) {
	Object.assign(p_Mesh.scaling, p_Scale);
}

function addDefaultSettings(p_WebGLControl, p_Settings) {
	const controlData = p_WebGLControl[privateData];
	return Object.assign({
		collisions: controlData.allObjectCollisions,
		shadows: p_WebGLControl.defaultShadows,
	}, p_Settings);
}

function addMaterial(p_ControlData, p_MaterialName, p_Settings) {
	const material = p_ControlData.materials[p_MaterialName] || new babylon.StandardMaterial(p_MaterialName, p_ControlData.scene);
	if (p_Settings.diffuse) {
		Object.assign(material.diffuseColor, p_Settings.diffuse);
	}
	if (p_Settings.specular) {
		Object.assign(material.specularColor, p_Settings.specular);
	}
	if (p_Settings.emissive) {
		Object.assign(material.emissiveColor, p_Settings.emissive);
	}
	if (p_Settings.ambient) {
		Object.assign(material.ambientColor, p_Settings.ambient);
	}
	if (p_Settings.alpha !== undefined) {
		material.alpha = p_Settings.alpha;
	}
	if (p_Settings.texture && p_Settings.texture.src) {
		material.invertNormalMapY = material.invertNormalMapX = p_Settings.texture.invertBump || false;
		if (p_Settings.texture.src) {
			material.diffuseTexture = new babylon.Texture(p_Settings.texture.src, p_ControlData.scene);
			material.diffuseTexture.hasAlpha = p_Settings.texture.alpha || false;
		}
		if (p_Settings.texture.bumpSrc) {
			material.bumpTexture = new babylon.Texture(p_Settings.texture.bumpSrc, p_ControlData.scene);
		}
		if (p_Settings.texture.opacitySrc) {
			material.opacityTexture = new babylon.Texture(p_Settings.texture.opacitySrc, p_ControlData.scene);
		}
		if (p_Settings.texture.xScale) {
			if (material.diffuseTexture) {
				material.diffuseTexture.uScale = p_Settings.texture.xScale;
			}
			if (material.bumpTexture) {
				material.bumpTexture.uScale = p_Settings.texture.xScale;
			}
			if (material.opacityTexture) {
				material.opacityTexture.uScale = p_Settings.texture.xScale;
			}
		}
		if (p_Settings.texture.yScale) {
			if (material.diffuseTexture) {
				material.diffuseTexture.vScale = p_Settings.texture.yScale;
			}
			if (material.bumpTexture) {
				material.bumpTexture.vScale = p_Settings.texture.yScale;
			}
			if (material.opacityTexture) {
				material.opacityTexture.vScale = p_Settings.texture.yScale;
			}
		}
	}
	p_ControlData.materials[p_MaterialName] = material;
	return material;
}

function applySettings(p_ControlData, p_MeshObject, p_Settings) {
	p_Settings = p_Settings || {};
	if (p_MeshObject) {
		if (p_Settings.position) {
			setPosition(p_MeshObject, p_Settings.position, p_ControlData.multiplier);
		}
		if (p_Settings.rotation) {
			setRotation(p_MeshObject, p_Settings.rotation);
		}
		if (p_Settings.scale) {
			setScale(p_MeshObject, p_Settings.scale);
		}
		if (p_Settings.visible !== undefined) {
			applyRecursive(p_MeshObject, "isVisible", p_Settings.visible);
		}
		if (p_Settings.material) {
			if (typeof p_Settings.material === "string") {
				const material = p_ControlData.materials[p_Settings.material];
				if (material) {
					p_MeshObject.material = material;
				}
			} else {
				if (p_Settings.material.name) {
					const material = addMaterial(p_ControlData, p_Settings.material.name, p_Settings.material);
					if (material) {
						p_MeshObject.material = material;
					}
				}
			}
		}
		p_MeshObject.renderingGroupId = (p_Settings.renderingGroupId === undefined) ? 1 : p_Settings.renderingGroupId;
		applyRecursive(p_MeshObject, "checkCollisions", p_Settings.collisions);

		// do shadows
		if (p_Settings.shadows) {
			addShadowCaster(p_ControlData, p_MeshObject);
			p_MeshObject.receiveShadows = true;
		}
	}

	return p_MeshObject;
}

function addMesh(p_WebGLControl, p_MeshObject) {
	const controlData = p_WebGLControl[privateData];
	if (p_MeshObject) {
		controlData.meshes[p_MeshObject.name] = p_MeshObject;

		Object.keys(controlData.lights).forEach((p_Key) => {
			if (controlData.lights[p_Key].shadowGenerator) {
				controlData.lights[p_Key].shadowGenerator.recreateShadowMap();
			}
		});
	}
}

function addClone(p_WebGLControl, p_Name, p_MeshObject, p_Settings) {
	const controlData = p_WebGLControl[privateData];
	p_Settings = p_Settings || {};
	if (p_MeshObject) {
		if (p_Settings.position) {
			setPosition(p_MeshObject, p_Settings.position, p_WebGLControl.unitMultiplier);
		}
		if (p_Settings.rotation) {
			setRotation(p_MeshObject, p_Settings.rotation);
		}
		if (p_Settings.scale) {
			setScale(p_MeshObject, p_Settings.scale);
		}
		if (p_Settings.visible !== undefined) {
			p_MeshObject.isVisible = p_Settings.visible;
		}
		// do shadows either if explicit shadows option is set to true in the settings or when defaultShadows is set to true and the shadows property is undefined
		if (p_Settings.shadows || (p_WebGLControl.defaultShadows && p_Settings.castShadows === undefined)) {
			addShadowCaster(controlData, p_MeshObject);
		}
		applyRecursive(p_MeshObject, "checkCollisions", (p_Settings.collisions === undefined) ? controlData.allObjectCollisions : p_Settings.collisions);
		controlData.clones[p_Name] = p_MeshObject;
	}
}

function handleSelectionBoundingBoxChange(p_WebGLControl) {
	const controlData = p_WebGLControl[privateData];
	const updateBoundingBox = (p_Key) => {
		const mesh = getMeshObject(p_WebGLControl, p_Key);
		if (mesh.selected) {
			mesh.showBoundingBox = p_WebGLControl.selectionBoundingBox;
		}
	};
	Object.keys(controlData.meshes).forEach(updateBoundingBox);
	Object.keys(controlData.clones).forEach(updateBoundingBox);
}

function createMeshInstance(p_Mesh, p_Name) {
	const instance = p_Mesh.createInstance(p_Name);
	p_Mesh.getChildren().forEach((p_Child) => instance.addChild(createMeshInstance(p_Child, `${p_Name}-${p_Child.name}`)));
	return instance;
}

function createSphere(p_ControlData, p_Settings, p_Name) {
	return applySettings(p_ControlData, babylon.MeshBuilder.CreateSphere(ensureName(p_Name), { segments: p_Settings.segments || 16, diameter: (p_Settings.diameter || 1) * p_ControlData.multiplier, diameterX: (p_Settings.diameterX || p_Settings.diameter || 1) * p_ControlData.multiplier, diameterY: (p_Settings.diameterY || p_Settings.diameter || 1) * p_ControlData.multiplier, diameterZ: (p_Settings.diameterZ || p_Settings.diameter || 1) * p_ControlData.multiplier, arc: p_Settings.arc || 1, slice: p_Settings.slice || 1, sideOrientation: p_Settings.sideOrientation }, p_ControlData.scene), p_Settings);
}

function createBox(p_ControlData, p_Settings, p_Name) {
	return applySettings(p_ControlData, babylon.MeshBuilder.CreateBox(ensureName(p_Name), { width: (p_Settings.width || 1) * p_ControlData.multiplier, height: (p_Settings.height || 1) * p_ControlData.multiplier, depth: (p_Settings.depth || 1) * p_ControlData.multiplier, sideOrientation: p_Settings.sideOrientation }, p_ControlData.scene), p_Settings);
}

function createPlane(p_ControlData, p_Settings, p_Name) {
	return applySettings(p_ControlData, babylon.MeshBuilder.CreatePlane(ensureName(p_Name), { width: (p_Settings.width || 1) * p_ControlData.multiplier, height: (p_Settings.height || 1) * p_ControlData.multiplier, sideOrientation: p_Settings.sideOrientation }, p_ControlData.scene), p_Settings);
}

function createPolyline(p_ControlData, p_Settings, p_Name) {
	const linePoints = p_Settings.points.map((p_Point) => new babylon.Vector3(p_Point.x * p_ControlData.multiplier, p_Point.y * p_ControlData.multiplier, p_Point.z * p_ControlData.multiplier));
	const polyLine = (linePoints.length > 1) ? babylon.MeshBuilder.CreateLines(ensureName(p_Name), { points: linePoints }, p_ControlData.scene) : null;
	return (polyLine) ? applySettings(p_ControlData, polyLine, p_Settings) : null;
}

function createExtrudedPolygon(p_ControlData, p_Settings, p_Name) {
	const shape = (p_Settings.outline || []).map((p_Point) => convertToVector3(multiplyVector(convertToVectorObject(p_Point), p_ControlData.multiplier)));
	const holes = (p_Settings.holes || []).map((p_Hole) => p_Hole.map((p_Point) => convertToVector3(multiplyVector(convertToVectorObject(p_Point), p_ControlData.multiplier))));
	return (shape.length) ? applySettings(p_ControlData, babylon.MeshBuilder.ExtrudePolygon(ensureName(p_Name), {
		shape,
		depth: (p_Settings.depth || 0) * p_ControlData.multiplier,
		holes,
	}, p_ControlData.scene), p_Settings) : null;
}

function createCylinder(p_ControlData, p_Settings, p_Name) {
	return applySettings(p_ControlData, babylon.MeshBuilder.CreateCylinder(ensureName(p_Name), { height: (p_Settings.height || 1) * p_ControlData.multiplier, diameter: (p_Settings.diameter === undefined) ? p_Settings.diameter : (p_Settings.diameter || 1) * p_ControlData.multiplier, diameterTop: ((p_Settings.diameterTop === undefined) ? (p_Settings.diameter || 1) : p_Settings.diameterTop) * p_ControlData.multiplier, diameterBottom: ((p_Settings.diameterBottom === undefined) ? (p_Settings.diameter || 1) : p_Settings.diameterBottom) * p_ControlData.multiplier, tessellation: p_Settings.segments || 16, arc: p_Settings.arc || 1, enclose: p_Settings.enclose || false }, p_ControlData.scene), p_Settings);
}

const meshContainer = Symbol("meshContainer");
const wrapReference = Symbol("wrapReference");
const originalDispose = Symbol("originalDispose");

function unWrap(p_Wrapped) { return p_Wrapped[meshContainer]; }

function wrap(p_ControlData, p_Mesh) {
	let wrapped = p_Mesh ? p_Mesh[wrapReference] : null;
	if (!wrapped && p_Mesh) {
		wrapped = {
			get visible() { return this[meshContainer].isVisible; },
			set visible(p_Visible) { setVisibility(this[meshContainer], p_Visible); },
			get parent() { return wrap(p_ControlData, this[meshContainer].parent); },
			get center() { const bounding = this[meshContainer].getBoundingInfo(); const center = (bounding && bounding.boundingBox) ? bounding.boundingBox.centerWorld : null; return { x: center.x / p_ControlData.multiplier, y: center.y / p_ControlData.multiplier, z: center.z / p_ControlData.multiplier }; },
			get maximum() { const bounding = this[meshContainer].getBoundingInfo(); const maximum = (bounding && bounding.boundingBox) ? bounding.boundingBox.maximumWorld : null; return { x: maximum.x / p_ControlData.multiplier, y: maximum.y / p_ControlData.multiplier, z: maximum.z / p_ControlData.multiplier }; },
			get minimum() { const bounding = this[meshContainer].getBoundingInfo(); const minimum = (bounding && bounding.boundingBox) ? bounding.boundingBox.minimumWorld : null; return { x: minimum.x / p_ControlData.multiplier, y: minimum.y / p_ControlData.multiplier, z: minimum.z / p_ControlData.multiplier }; },
			get name() { return this[meshContainer].name; },
			clone(p_Name) { return wrap(p_ControlData, this[meshContainer].clone(ensureName(p_Name))); },
			updateCoordinates() { this[meshContainer].computeWorldMatrix(true); },
			remove() { this[meshContainer].dispose(); },
			applySettings(p_Settings) { applySettings(p_ControlData, this[meshContainer], p_Settings); },
			offset(p_Offset) { this[meshContainer].position.addInPlace({ x: p_Offset.x * p_ControlData.multiplier, y: p_Offset.y * p_ControlData.multiplier, z: p_Offset.z * p_ControlData.multiplier }); },
			scale(p_Scaling) { this[meshContainer].scaling.x = p_Scaling; this[meshContainer].scaling.y = p_Scaling; this[meshContainer].scaling.z = p_Scaling; },
		};
		wrapped[meshContainer] = p_Mesh;
		p_Mesh[wrapReference] = wrapped;
		p_Mesh[originalDispose] = p_Mesh.dispose;
		p_Mesh.dispose = function() {
			delete this[wrapReference][meshContainer];
			delete this[wrapReference];
			this.dispose = this[originalDispose];
			delete this[originalDispose];
			this.dispose();
		};
	}
	return wrapped;
}

function wrapGroup(p_ControlData, p_Mesh) {
	const wrapped = wrap(p_ControlData, p_Mesh);
	wrapped.addChild = function(p_Child) { this[meshContainer].addChild(unWrap(p_Child)); };
	wrapped.removeChild = function(p_Child) { this[meshContainer].removeChild(unWrap(p_Child)); };
	wrapped.addChildren = function(p_Children) { const mesh = this[meshContainer]; p_Children.forEach((p_Child) => mesh.addChild(unWrap(p_Child))); };
	wrapped.getChildren = function(p_Filter, p_Recursive) { return this[meshContainer].getChildMeshes(!p_Recursive, (p_ChildMesh) => !p_Filter || p_Filter(wrap(p_ControlData, p_ChildMesh))).map((p_Child) => wrap(p_ControlData, p_Child)); };
	wrapped.clone = function(p_Name) { return wrapGroup(p_ControlData, this[meshContainer].clone(ensureName(p_Name))); };
	return wrapped;
}

function wrapEvent(p_ControlData, p_Event) {
	return {
		event: p_Event.event,
		hitMesh: (p_Event.pickInfo.hit) ? wrap(p_ControlData, p_Event.pickInfo.pickedMesh) : null,
	};
}

function addPointerDownListener(p_ControlData, p_Callback) { p_ControlData.scene.onPointerObservable.add((p_Event) => { p_Callback(wrapEvent(p_ControlData, p_Event)); }, babylon.PointerEventTypes.POINTERDOWN); }
function addPointerUpListener(p_ControlData, p_Callback) { p_ControlData.scene.onPointerObservable.add((p_Event) => { p_Callback(wrapEvent(p_ControlData, p_Event)); }, babylon.PointerEventTypes.POINTERUP); }
function addPointerMoveListener(p_ControlData, p_Callback) { p_ControlData.scene.onPointerObservable.add((p_Event) => { p_Callback(wrapEvent(p_ControlData, p_Event)); }, babylon.PointerEventTypes.POINTERMOVE); }

function screenToObjectPoint(p_ControlData, p_Position, p_Mesh) {
	const pickInfo = p_ControlData.scene.pick(p_Position.x, p_Position.y, (p_TestMesh) => p_Mesh === p_TestMesh);
	return (pickInfo.hit) ? { x: pickInfo.pickedPoint.x / p_ControlData.multiplier, y: pickInfo.pickedPoint.y / p_ControlData.multiplier, z: pickInfo.pickedPoint.z / p_ControlData.multiplier } : null;
}

function attachExtension(p_WebGLControl, p_ExtensionObject) {
	const controlData = p_WebGLControl[privateData];
	p_ExtensionObject.attach(p_WebGLControl, {
		// get a named mesh
		getMeshObject(p_MeshNameOrPath) { return wrap(controlData, getMeshObject(p_WebGLControl, p_MeshNameOrPath)); },
		// mesh creation
		createMeshGroup(p_Name) { return wrapGroup(controlData, new babylon.Mesh(ensureName(p_Name), controlData.scene)); },
		createSphere(p_Settings, p_Name) { return wrap(controlData, createSphere(controlData, p_Settings, p_Name)); },
		createBox(p_Settings, p_Name) { return wrap(controlData, createBox(controlData, p_Settings, p_Name)); },
		createPlane(p_Settings, p_Name) { return wrap(controlData, createPlane(controlData, p_Settings, p_Name)); },
		createPolyline(p_Settings, p_Name) { return wrap(controlData, createPolyline(controlData, p_Settings, p_Name)); },
		createExtrudedPolygon(p_Settings, p_Name) { return wrap(controlData, createExtrudedPolygon(controlData, p_Settings, p_Name)); },
		createCylinder(p_Settings, p_Name) { return wrap(controlData, createCylinder(controlData, p_Settings, p_Name)); },
		// settings
		applySettings(p_Settings, p_Mesh) { applySettings(controlData, unWrap(p_Mesh), p_Settings); },
		// event handling
		addPointerDownListener(p_Callback) { addPointerDownListener(controlData, p_Callback); },
		addPointerUpListener(p_Callback) { addPointerUpListener(controlData, p_Callback); },
		addPointerMoveListener(p_Callback) { addPointerMoveListener(controlData, p_Callback); },
		// utility
		screenToObjectPoint(p_ScreenPoint, p_Wrapped) { return screenToObjectPoint(controlData, p_ScreenPoint, unWrap(p_Wrapped)); },
		get pointerPos() { return { x: controlData.scene.pointerX, y: controlData.scene.pointerY }; },
		// camera
		detachCameraControl() { controlData.camera.detachControl(p_WebGLControl.$.canvas); },
		attachCameraControl() { controlData.camera.attachControl(p_WebGLControl.$.canvas, !(controlData.preventDefault || false)); },
	});
}

/**
 * Class to represent the vicowa-webgl custom element
 * @extends webComponentBaseClass
 * @property {boolean} loadingScreen Set to true to show a loading screen or false for no loading screen
 * @property {boolean} selectionBoundingBox Set to true to show a bounding box when an object is selected or false to not show this box
 */
export class VicowaWebgl extends webComponentBaseClass {
	static get is() { return componentName; }
	constructor() {
		super();
		this[privateData] = {
			lights: {},
			meshes: {},
			clones: {},
			materials: {},
			allObjectCollisions: true, // by default, all objects will do collision checking
			defaultShadows: true, // by default all objects cast shadows, this can be changed either per object or as a global setting
			multiplier: 10,
			assetsManager: null,
			scene: null,
			extensions: [],
		};
	}

	static get properties() {
		return {
			loadingScreen: {
				type: Boolean,
				value: false,
				reflectToAttribute: true,
				observer: handleLoadingScreenChange,
			},
			selectionBoundingBox: {
				type: Boolean,
				value: false,
				reflectToAttribute: true,
				observer: handleSelectionBoundingBoxChange,
			},
		};
	}

	addExtension(p_ExtensionObject) {
		const controlData = this[privateData];
		if (controlData.extensions.indexOf(p_ExtensionObject) === -1) {
			controlData.extensions.push(p_ExtensionObject);
			// make sure the scene has been created before attaching this
			if (controlData.scene) {
				attachExtension(this, p_ExtensionObject);
			}
		}
	}

	async addObjectResource(p_Name, p_MeshName, p_FileName, p_Settings) {
		const controlData = this[privateData];
		const meshTask = controlData.assetsManager.addMeshTask(p_Name, p_MeshName, `${p_FileName.split("/").slice(0, -1).join("/")}/`, p_FileName.split("/").slice(-1)[0]);
		return await new Promise((resolve, reject) => {
			meshTask.onSuccess = (task) => {
				if (!p_Settings.position) {
					p_Settings.position = { x: 0, y: 0, z: 0 };
				}
				if (task.loadedMeshes.length === 1) {
					addMesh(this, task.loadedMeshes[0], p_Settings);
				} else {
					const mesh = new babylon.Mesh(p_Name, controlData.scene);
					task.loadedMeshes.forEach((p_Mesh) => {
						p_Mesh.renderingGroupId = 1;
						mesh.addChild(p_Mesh);
					});
					addMesh(this, mesh, p_Settings);
				}
				resolve();
			};
			meshTask.onError = (p_Task, p_Message, pException) => {
				reject({ message: p_Message, exception: pException });
			};
			controlData.assetsManager.load();
		});
	}

	set unitMultiplier(p_Multiplier) { this[privateData].multiplier = p_Multiplier; }
	get unitMultiplier() { return this[privateData].multiplier; }

	setBackgroundColor(p_Red, p_Green, p_Blue) { this[privateData].scene.clearColor = new babylon.Color3(p_Red, p_Green, p_Blue); }
	setAmbientColor(p_Red, p_Green, p_Blue) { this[privateData].scene.ambientColor = new babylon.Color3(p_Red, p_Green, p_Blue); }

	createSkyBox(p_SkyBoxImageDirectory) {
		const controlData = this[privateData];
		// using the "old" way of creating skybox, because the helper function makes it very very slow
		const skybox = babylon.MeshBuilder.CreateBox("skyBox", { size: 10000.0, sideOrientation: babylon.Mesh.BACKSIDE }, controlData.scene);
		const skyboxMaterial = new babylon.StandardMaterial("skyBox", controlData.scene);
		skyboxMaterial.backFaceCulling = true;
		skyboxMaterial.reflectionTexture = new babylon.CubeTexture(p_SkyBoxImageDirectory, controlData.scene);
		skyboxMaterial.reflectionTexture.coordinatesMode = babylon.Texture.SKYBOX_MODE;
		skyboxMaterial.diffuseColor = new babylon.Color3(0, 0, 0);
		skyboxMaterial.specularColor = new babylon.Color3(0, 0, 0);
		skyboxMaterial.disableLighting = true;
		skybox.material = skyboxMaterial;
		skybox.infiniteDistance = true;
		skybox.renderingGroupId = 0;
	}

	addSphere(p_Settings, p_Name) { addMesh(this, createSphere(this[privateData], addDefaultSettings(this, p_Settings), p_Name)); }
	addBox(p_Settings, p_Name) { addMesh(this, createBox(this[privateData], addDefaultSettings(this, p_Settings), p_Name)); }
	addPlane(p_Settings, p_Name) { addMesh(this, createPlane(this[privateData], addDefaultSettings(this, p_Settings), p_Name)); }

	addGround(p_Name, p_Settings) {
		const controlData = this[privateData];
		const ground = babylon.MeshBuilder.CreateGround(p_Name, { width: (p_Settings.width || 1) * this.unitMultiplier, height: (p_Settings.height || 1) * this.unitMultiplier, subdivisions: p_Settings.subdivisions || 1 }, controlData.scene);
		controlData.meshes[p_Name] = ground;
		ground.receiveShadows = true;
		ground.checkCollisions = controlData.allObjectCollisions;
	}

	addPolyline(p_Name, p_Settings) {
		const polyLine = createPolyline(this[privateData], addDefaultSettings(this, p_Settings), p_Name);
		if (polyLine) {
			addMesh(this, polyLine, p_Settings);
		}
	}

	addExtrudedPolygon(p_Name, p_Settings) {
		const polygon = createExtrudedPolygon(this[privateData], addDefaultSettings(this, p_Settings), p_Name);
		if (polygon) {
			addMesh(this, polygon, p_Settings);
		}
	}

	cloneObject(p_ObjectNamePrefix, p_SourceName, p_Copies, p_Settings) {
		const mesh = this[privateData].meshes[p_SourceName];
		if (mesh) {
			const copies = p_Copies || 1;
			for (let index = 0; index < copies; index++) {
				const cloneName = p_ObjectNamePrefix + index;
				addClone(this, cloneName, createMeshInstance(mesh.createInstance, cloneName), p_Settings);
			}
		}
	}

	startRendering() {
		const controlData = this[privateData];
		controlData.engine.runRenderLoop(() => { controlData.scene.render(); });
	}

	stopRendering() {
		this[privateData].engine.stopRenderLoop();
	}

	addDirectionalLight(p_Name, p_Settings) {
		const controlData = this[privateData];
		const light = new babylon.DirectionalLight(p_Name, new babylon.Vector3(p_Settings.x || 0, p_Settings.y || 0, p_Settings.z || 0), controlData.scene);
		controlData.lights[p_Name] = { light };
		if (p_Settings.generateShadows) {
			controlData.lights[p_Name].shadowGenerator = createShadowGenerator(this, light);
		}
	}

	addEnviromentalLight(p_Name, p_Settings) {
		const controlData = this[privateData];
		controlData.lights[p_Name] = new babylon.HemisphericLight(p_Name, new babylon.Vector3(p_Settings.x || 0, p_Settings.y || 0, p_Settings.z || 0), controlData.scene);
	}

	addPointLight(p_Name, p_Settings) {
		const controlData = this[privateData];
		const light = new babylon.PointLight(p_Name, new babylon.Vector3(p_Settings.x * this.unitMultiplier || 0, p_Settings.y * this.unitMultiplier || 0, p_Settings.z * this.unitMultiplier || 0), controlData.scene);
		controlData.lights[p_Name] = light;
		if (p_Settings.generateShadows) {
			controlData.lights[p_Name].shadowGenerator = createShadowGenerator(this, light);
		}
	}

	addSpotLight(p_Name, p_Settings) {
		const controlData = this[privateData];
		const light = new babylon.SpotLight(p_Name, new babylon.Vector3(p_Settings.x * this.unitMultiplier || 0, p_Settings.y * this.unitMultiplier || 0, p_Settings.z * this.unitMultiplier || 0), new babylon.Vector3(p_Settings.direction.x || 0, p_Settings.direction.y || 0, p_Settings.direction.z || 0), p_Settings.angle || 0, (p_Settings.reach || 100) * this.unitMultiplier, controlData.scene);
		controlData.lights[p_Name] = light;
		if (p_Settings.generateShadows) {
			controlData.lights[p_Name].shadowGenerator = createShadowGenerator(this, light);
		}
	}

	setLightColors(p_Name, p_Colors) {
		const light = this[privateData].lights[p_Name];
		if (light) {
			if (p_Colors.diffuse) {
				Object.assign(light.diffuse, p_Colors.diffuse);
			}
			if (p_Colors.specular) {
				Object.assign(light.specular, p_Colors.specular);
			}
		}
	}

	setObjectPosition(p_Name, p_Position) {
		const controlData = this[privateData];
		const mesh = controlData.meshes[p_Name] || controlData.clones[p_Name];
		if (mesh) {
			setPosition(mesh, p_Position, this.unitMultiplier);
		}
	}

	setObjectRotation(p_Name, p_Rotation) {
		const controlData = this[privateData];
		const mesh = controlData.meshes[p_Name] || controlData.clones[p_Name];
		if (mesh) {
			setRotation(mesh, p_Rotation);
		}
	}

	setObjectScale(p_Name, p_Scale) {
		const controlData = this[privateData];
		const mesh = controlData.meshes[p_Name] || controlData.clones[p_Name];
		if (mesh) {
			setScale(mesh, p_Scale);
		}
	}

	setGroundLightColor(p_Name, p_Color) {
		const light = this[privateData].lights[p_Name];
		if (light && light instanceof babylon.HemisphericLight) {
			Object.assign(light.groundColor, p_Color);
		}
	}

	setCameraTarget(p_ObjectName) {
		const controlData = this[privateData];
		const mesh = controlData.meshes[p_ObjectName];
		if (mesh) {
			controlData.camera.lockedTarget = mesh;
		}
	}

	addMaterial(p_MaterialName, p_Settings) { return addMaterial(this[privateData], p_MaterialName, p_Settings); }

	setObjectMaterial(p_ObjectNames, p_Material) {
		const controlData = this[privateData];
		if (typeof p_Material === "string") {
			const meshNames = Array.isArray(p_ObjectNames) ? p_ObjectNames : [p_ObjectNames];
			meshNames.forEach((p_MeshName) => {
				const mesh = controlData.meshes[p_MeshName];
				const material = controlData.materials[p_Material];
				if (mesh && material) {
					mesh.material = material;
				}
			});
		}
	}

	setGravity(p_Settings) {
		Object.assign(this[privateData].scene.gravity, p_Settings);
	}

	set defaultShadows(p_Shadows) { this[privateData].defaultShadows = p_Shadows; }
	get defaultShadows() { return this[privateData].defaultShadows; }

	set cameraGravity(p_Gravity) { this[privateData].camera.applyGravity = p_Gravity; }
	get cameraGravity() { return this[privateData].camera.applyGravity; }

	set cameraCollisions(p_Collisions) { this[privateData].camera.checkCollisions = p_Collisions; }
	get cameraCollisions() { return this[privateData].camera.checkCollisions; }

	setObjectVisibility(p_ObjectName, p_Visible) {
		const mesh = this[privateData].meshes[p_ObjectName];
		if (mesh) {
			setVisibility(mesh, p_Visible || false);
		}
	}

	isObjectVisible(p_ObjectName) {
		const mesh = this[privateData].meshes[p_ObjectName];
		return (mesh) ? mesh.isVisible : undefined;
	}

	setVirtualBody(p_Settings) {
		const controlData = this[privateData];
		if (controlData.camera) {
			if (controlData.camera instanceof babylon.ArcRotateCamera) {
				Object.assign(controlData.camera.collisionRadius, multiplyVector(p_Settings.bodySize || {}, this.unitMultiplier));
			} else {
				Object.assign(controlData.camera.ellipsoid, multiplyVector(p_Settings.bodySize || {}, this.unitMultiplier));
				Object.assign(controlData.camera.ellipsoidOffset, multiplyVector(p_Settings.eyeOffset || {}, this.unitMultiplier));
			}
		} else {
			throw new Error("make sure to set a camera before calling this function");
		}
	}

	enableAllObjectCollisions(p_ExcludedNames) {
		const controlData = this[privateData];
		controlData.allObjectCollisions = true;
		applyAllMeshes(controlData.meshes, p_ExcludedNames || [], "checkCollisions", true);
		applyAllMeshes(controlData.clones, p_ExcludedNames || [], "checkCollisions", true);
	}

	disableAllObjectCollisions(p_ExcludedNames) {
		const controlData = this[privateData];
		controlData.allObjectCollisions = false;
		applyAllMeshes(controlData.meshes, p_ExcludedNames || [], "checkCollisions", false);
		applyAllMeshes(controlData.clones, p_ExcludedNames || [], "checkCollisions", false);
	}

	setCheckCollisionForObject(p_ObjectName, p_Enabled) {
		const mesh = this[privateData].meshes[p_ObjectName];
		if (mesh) {
			applyRecursive(mesh, "checkCollisions", p_Enabled);
		}
	}

	getCheckCollisionForObject(p_ObjectName) {
		const mesh = this[privateData].meshes[p_ObjectName];
		return (mesh) ? mesh.checkCollisions : undefined;
	}

	setFog(p_Enabled, p_Settings) {
		const controlData = this[privateData];
		// fog
		controlData.scene.fogEnabled = p_Enabled;
		controlData.scene.fogMode = babylon.Scene.FOGMODE_EXP;
		if (p_Settings.density) {
			controlData.scene.fogDensity = p_Settings.density;
		}
		if (p_Settings.color) {
			controlData.scene.fogColor = new babylon.Color3(p_Settings.color.r, p_Settings.color.g, p_Settings.color.b);
		}
	}

	/**
	 * Set the camera to use
	 * @param {CAMERA_TYPES} p_Type The type of camera to create
	 * @param {object} p_Settings The settings for creating the camera
	 */
	setCamera(p_Type, p_Settings) {
		const controlData = this[privateData];
		controlData.preventDefault = p_Settings.preventDefault;
		p_Settings = p_Settings || {};
		if (controlData.camera) {
			controlData.camera.dispose();
		}
		switch (p_Type) {
			case CAMERA_TYPES.ORBITAL: {
				// if no positions are specified, the camera will be positioned at a distance of 10 a longitude of 0 and a latitude of 45 degrees and point at 0, 0, 0
				const position = Object.assign({}, { longitude: 0, latitude: 45, distance: 10 }, p_Settings.position);
				const target = Object.assign({}, { x: 0, y: 0, z: 0 }, p_Settings.target || {});
				controlData.camera = new babylon[(p_Settings.vrEnabled) ? "VRDeviceOrientationArcRotateCamera" : "ArcRotateCamera"]("camera", toRadians(position.longitude), toRadians(position.latitude), position.distance * this.unitMultiplier, new babylon.Vector3(target.x * this.unitMultiplier, target.y * this.unitMultiplier, target.z * this.unitMultiplier), controlData.scene);
				controlData.camera.attachControl(this.$.canvas, !(controlData.preventDefault || false));
				if (p_Settings.minLongitude) {
					controlData.camera.lowerAlphaLimit = toRadians(p_Settings.minLongitude);
				}
				if (p_Settings.maxLongitude) {
					controlData.camera.upperAlphaLimit = toRadians(p_Settings.maxLongitude);
				}
				if (p_Settings.minLatitude) {
					controlData.camera.lowerBetaLimit = toRadians(p_Settings.minLatitude);
				}
				if (p_Settings.maxLatitude) {
					controlData.camera.upperBetaLimit = toRadians(p_Settings.maxLatitude);
				}
				if (p_Settings.minDistance) {
					controlData.camera.lowerRadiusLimit = p_Settings.minDistance * this.unitMultiplier;
				}
				if (p_Settings.maxDistance) {
					controlData.camera.upperRadiusLimit = p_Settings.maxDistance * this.unitMultiplier;
				}
				if (p_Settings.targetMesh) {
					controlData.camera.lockedTarget = p_Settings.targetMesh;
				}
				break;
			}
			case CAMERA_TYPES.FREE: {
				// if no positions are specified, the camera will be positioned at 0 0 -10 and will be pointing at 0, 0, 0
				const position = Object.assign({}, { x: 0, y: 0, z: -10 }, p_Settings.position || {});
				const target = Object.assign({}, { x: 0, y: 0, z: 0 }, p_Settings.target || {});
				controlData.camera = new babylon[(p_Settings.vrEnabled) ? ((p_Settings.mobile) ? "VRDeviceOrientationFreeCamera" : "WebVRFreeCamera") : "UniversalCamera"]("camera", new babylon.Vector3(position.x * this.unitMultiplier, position.y * this.unitMultiplier, position.z * this.unitMultiplier), controlData.scene);
				controlData.camera.attachControl(this.$.canvas, !(controlData.preventDefault || false));
				controlData.camera.setTarget(new babylon.Vector3(target.x * this.unitMultiplier, target.y * this.unitMultiplier, target.z * this.unitMultiplier));
				break;
			}
			case CAMERA_TYPES.FOLLOW: {
				const position = Object.assign({}, { x: 0, y: 0, z: -10 }, p_Settings.position || {});
				// if no positions are specified, the camera will be positioned at 0 0 -10 and will be pointing at 0, 0, 0
				controlData.camera = new babylon.FollowCamera("camera", new babylon.Vector3(position.x * this.unitMultiplier, position.y * this.unitMultiplier, position.z * this.unitMultiplier), controlData.scene);
				controlData.camera.attachControl(this.$.canvas, !(controlData.preventDefault || false));
				if (p_Settings.targetMesh) {
					controlData.camera.lockedTarget = p_Settings.targetMesh;
				}
				const follow = Object.assign({}, {
					radius: controlData.camera.radius,
					heightAbove: controlData.camera.heightOffset,
					rotation: controlData.camera.rotationOffset,
					acceleration: controlData.camera.cameraAcceleration,
					maxSpeed: controlData.camera.maxCameraSpeed,
				}, multiplyObject(p_Settings.follow, this.unitMultiplier, ["radius", "heightAbove"]));
				controlData.camera.radius = follow.radius;
				controlData.camera.heightOffset = follow.heightAbove;
				controlData.camera.rotationOffset = toRadians(follow.rotation);
				controlData.camera.cameraAcceleration = follow.acceleration;
				controlData.camera.maxCameraSpeed = follow.maxSpeed;
				break;
			}
			default:
				throw new Error(`Unknown camera type ${p_Type}`);
		}
	}

	removeObject(p_ObjectName) {
		const controlData = this[privateData];
		this.removeManipulators(p_ObjectName);
		let mesh = controlData.meshes[p_ObjectName];
		if (mesh) {
			mesh.dispose();
			delete controlData.meshes[p_ObjectName];
		} else {
			mesh = controlData.clones[p_ObjectName];
			if (mesh) {
				mesh.dispose();
				delete controlData.clones[p_ObjectName];
			}
		}
	}

	ungroupObject(p_ObjectName) {
		const controlData = this[privateData];
		const mesh = controlData.meshes[p_ObjectName];
		const newObjects = [];
		const childMeshes = (mesh) ? mesh.getChildMeshes(true) : [];
		childMeshes.forEach((p_Mesh) => {
			mesh.removeChild(p_Mesh);
			newObjects.push(p_Mesh.name);
			controlData.meshes[p_Mesh.name] = p_Mesh;
		});
		return newObjects;
	}

	groupObjects(p_ObjectNames, p_NewName) {
		const controlData = this[privateData];
		const meshes = [];
		let newMesh = null;
		p_ObjectNames.forEach((p_Name) => { const mesh = controlData.meshes[p_Name]; if (mesh) { meshes.push(mesh); } });
		if (meshes.length) {
			newMesh = new babylon.Mesh(p_NewName, controlData.scene);
			meshes.forEach((p_NewChild) => { newMesh.addChild(p_NewChild); delete controlData.meshes[p_NewChild.name]; });
			controlData.meshes[p_NewName] = newMesh;
		}
		return (newMesh) ? newMesh.name : null;
	}

	selectObject(p_ObjectName) {
		const controlData = this[privateData];
		const mesh = getMeshObject(this, p_ObjectName);
		if (mesh) {
			const allMeshes = flattenMeshes(mesh);
			allMeshes.forEach((p_Mesh) => {
				p_Mesh.selected = true;
				p_Mesh.showBoundingBox = this.selectionBoundingBox;
				p_Mesh.notSelectMaterial = p_Mesh.material;
				if (p_Mesh.material && p_Mesh.material.hasOwnProperty("diffuseColor")) {
					p_Mesh.material = p_Mesh.material.clone("temp");
					p_Mesh.material.diffuseColor = controlData.materials["selected"].diffuseColor;
					p_Mesh.material.alpha = Math.max(0.5, p_Mesh.material.alpha);
				} else {
					p_Mesh.material = controlData.materials["selected"].clone();
				}
			});
		}
	}

	unselectObject(p_ObjectName) {
		const mesh = getMeshObject(this, p_ObjectName);
		if (mesh) {
			const allMeshes = flattenMeshes(mesh);
			allMeshes.forEach((p_Mesh) => {
				if (p_Mesh.selected) {
					p_Mesh.selected = false;
					p_Mesh.showBoundingBox = false;
					p_Mesh.material.dispose();
					p_Mesh.material = p_Mesh.notSelectMaterial;
					delete p_Mesh.notSelectMaterial;
				}
			});
		}
	}

	getSelectedObjects() {
		const controlData = this[privateData];
		return Object.keys(controlData.meshes).filter((p_Key) => getMeshObject(this, p_Key).selected).concat(Object.keys(controlData.clones).filter((p_Key) => getMeshObject(this, p_Key).selected));
	}

	unselectAll() {
		const controlData = this[privateData];
		Object.keys(controlData.meshes).forEach((p_Key) => this.unselectObject(p_Key));
		Object.keys(controlData.clones).forEach((p_Key) => this.unselectObject(p_Key));
	}

	isObjectSelected(p_ObjectName) {
		const mesh = getMeshObject(this, p_ObjectName);
		return mesh && mesh.selected;
	}

	set selectColor(p_Color) { Object.assign(this[privateData].materials["selected"].diffuseColor, p_Color); }
	get selectColor() { const color = (this[privateData].materials["selected"] || {}).diffuseColor; return { r: color.r || 1, g: color.g || 0, b: color.b || 0 }; }

	attached() {
		const controlData = this[privateData];
		// create the engine
		controlData.engine = new babylon.Engine(this.$.canvas, true, { preserveDrawingBuffer: true, stencil: true });
		const createScene = () => {
			// Create a Scene object
			controlData.scene = new babylon.Scene(controlData.engine);
			controlData.scene.collisionsEnabled = true;
			controlData.scene.workerCollisions = true; // use web workers for collisions

			this.addMaterial("selected", { diffuse: { r: 1, g: 0, b: 0 } });

			controlData.assetsManager = new babylon.AssetsManager(controlData.scene);
			controlData.assetsManager.useDefaultLoadingScreen = this.loadingScreen;

			const options = new babylon.SceneOptimizerOptions();
			options.addOptimization(new babylon.HardwareScalingOptimization(0, 1));

			// Optimizer
			this.optimizer = new babylon.SceneOptimizer(controlData.scene, options);

			controlData.assetsManager.onFinish = () => {
				this.stopRendering();
				this.startRendering();
			};
		};

		createScene();

		controlData.scene.onPointerObservable.add((p_Event) => {
			if (p_Event.pickInfo.hit) {
				if (this.onObjectClicked) {
					const path = [p_Event.pickInfo.pickedMesh.name];
					let parent = p_Event.pickInfo.pickedMesh.parent;
					while (parent) {
						path.unshift(parent.name);
						parent = parent.parent;
					}
					this.onObjectClicked({
						distance: p_Event.pickInfo.distance / this.unitMultiplier,
						object: p_Event.pickInfo.pickedMesh.name,
						mainObject: path[0],
						parent: path[path.length - 2] || null,
						path,
						location: { x: p_Event.pickInfo.pickedPoint.x / this.unitMultiplier, y: p_Event.pickInfo.pickedPoint.y / this.unitMultiplier, z: p_Event.pickInfo.pickedPoint.z / this.unitMultiplier },
					});
				}
			}
		}, babylon.PointerEventTypes.POINTERPICK);

		const resizeDetector = this.$.resizeDetector;
		resizeDetector.addObserver(() => {
			controlData.engine.resize();
		}, this);

		// attach all extensions now
		controlData.extensions.forEach((p_ExtensionObject) => attachExtension(this, p_ExtensionObject));
	}
}

window.customElements.define(componentName, VicowaWebgl);
