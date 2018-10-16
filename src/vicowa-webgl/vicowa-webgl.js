/* eslint new-cap: ["off"] */
/* switching this off for this file because babylon uses almost all uppercase starting function names */
import { webComponentBaseClass } from "../third_party/web-component-base-class/src/webComponentBaseClass.js";
import { CAMERA_TYPES, MANIPULATOR_TYPES } from "./vicowa-webgl-definitions.js";
import { toRadians } from "../utilities/mathHelpers.js";

const privateData = Symbol["privateData"];

const babylon = window.BABYLON;
const componentName = "vicowa-webgl";

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

function addShadowCaster(p_WebGLControl, p_MeshObject) {
	const controlData = p_WebGLControl[privateData];
	Object.keys(controlData.lights).forEach((p_Light) => {
		const light = controlData.lights[p_Light];
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

function addMesh(p_WebGLControl, p_Name, p_MeshObject, p_Settings) {
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
		if (p_Settings.material) {
			if (typeof p_Settings.material === "string") {
				const material = controlData.materials[p_Settings.material];
				if (material) {
					p_MeshObject.material = material;
				}
			} else {
				if (p_Settings.material.name) {
					const material = p_WebGLControl.addMaterial(p_Settings.material.name, p_Settings.material);
					if (material) {
						p_MeshObject.material = material;
					}
				}
			}
		}

		// do shadows either if explicit shadows option is set to true in the settings or when defaultShadows is set to true and the shadows property is undefined
		if (p_Settings.shadows || (p_WebGLControl.defaultShadows && p_Settings.castShadows === undefined)) {
			addShadowCaster(p_WebGLControl, p_MeshObject);
			p_MeshObject.receiveShadows = true;
		}
		p_MeshObject.renderingGroupId = 1;
		applyRecursive(p_MeshObject, "checkCollisions", (p_Settings.collisions === undefined) ? controlData.allObjectCollisions : p_Settings.collisions);
		controlData.meshes[p_Name] = p_MeshObject;

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
			addShadowCaster(p_WebGLControl, p_MeshObject);
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

function createMoveMesh(p_Name, p_ControlData) {
	const mesh = new babylon.Mesh(p_Name, p_ControlData.scene);
	const sphere = babylon.MeshBuilder.CreateSphere(`${p_Name}-sphere`, { diameter: 2 }, p_ControlData.scene);
	setRotation(sphere, { x: 90, y: 0, z: 0 });
	sphere.material = p_ControlData.materials["manipulator-unselected"].clone();
	mesh.addChild(sphere);
	const arrow1Cylinder = babylon.MeshBuilder.CreateCylinder(`${p_Name}-left`, { diameter: 0.5, height: 1.5 }, p_ControlData.scene);
	const arrow1Cone = babylon.MeshBuilder.CreateCylinder(`${p_Name}-left`, { diameterTop: 0, diameterBottom: 1, height: 1 }, p_ControlData.scene);
	mesh.addChild(arrow1Cylinder);
	mesh.addChild(arrow1Cone);
	const arrow2Cylinder = babylon.MeshBuilder.CreateCylinder(`${p_Name}-right`, { diameter: 0.5, height: 1.5 }, p_ControlData.scene);
	const arrow2Cone = babylon.MeshBuilder.CreateCylinder(`${p_Name}-right`, { diameterTop: 0, diameterBottom: 1, height: 1 }, p_ControlData.scene);
	mesh.addChild(arrow2Cylinder);
	mesh.addChild(arrow2Cone);
	setPosition(arrow1Cylinder, { y: -2 }, 1);
	setPosition(arrow2Cylinder, { y: 2 }, 1);
	setPosition(arrow1Cone, { y: -3 }, 1);
	setRotation(arrow1Cone, { x: 0, y: 0, z: 180 });
	setPosition(arrow2Cone, { y: 3 }, 1);
	setVisibility(mesh, false);
	applyRecursive(mesh, "renderingGroupId", 1);

	return mesh;
}

function createScaleMesh(p_Name, p_ControlData) {
	const mesh = new babylon.Mesh(p_Name, p_ControlData.scene);
	const sphere = babylon.MeshBuilder.CreateSphere(`${p_Name}-sphere`, { diameter: 2 }, p_ControlData.scene);
	setRotation(sphere, { x: 90, y: 0, z: 0 });
	sphere.material = p_ControlData.materials["manipulator-unselected"].clone();
	mesh.addChild(sphere);
	const arrow1Cylinder = babylon.MeshBuilder.CreateCylinder(`${p_Name}-left`, { diameter: 0.5, height: 1.5 }, p_ControlData.scene);
	const arrow1Cone = babylon.MeshBuilder.CreateCylinder(`${p_Name}-left`, { diameterTop: 0, diameterBottom: 1, height: 1 }, p_ControlData.scene);
	mesh.addChild(arrow1Cylinder);
	mesh.addChild(arrow1Cone);
	const arrow2Cylinder = babylon.MeshBuilder.CreateCylinder(`${p_Name}-right`, { diameter: 0.5, height: 1.5 }, p_ControlData.scene);
	const arrow2Cone = babylon.MeshBuilder.CreateCylinder(`${p_Name}-right`, { diameterTop: 0, diameterBottom: 1, height: 1 }, p_ControlData.scene);
	mesh.addChild(arrow2Cylinder);
	mesh.addChild(arrow2Cone);
	setPosition(arrow1Cylinder, { y: -2 }, 1);
	setPosition(arrow2Cylinder, { y: 2 }, 1);
	setPosition(arrow1Cone, { y: -3 }, 1);
	setRotation(arrow1Cone, { x: 0, y: 0, z: 180 });
	setPosition(arrow2Cone, { y: 3 }, 1);
	setVisibility(mesh, false);
	applyRecursive(mesh, "renderingGroupId", 1);

	return mesh;
}

function createRotateMesh(p_Name, p_ControlData) {
	const mesh = new babylon.Mesh(p_Name, p_ControlData.scene);
	const sphere = babylon.MeshBuilder.CreateSphere(`${p_Name}-sphere`, { diameter: 2 }, p_ControlData.scene);
	setRotation(sphere, { x: 90, y: 0, z: 0 });
	sphere.material = p_ControlData.materials["manipulator-unselected"].clone();
	mesh.addChild(sphere);
	const arrow1Cylinder = babylon.MeshBuilder.CreateCylinder(`${p_Name}-left`, { diameter: 0.5, height: 1.5 }, p_ControlData.scene);
	const arrow1Cone = babylon.MeshBuilder.CreateCylinder(`${p_Name}-left`, { diameterTop: 0, diameterBottom: 1, height: 1 }, p_ControlData.scene);
	mesh.addChild(arrow1Cylinder);
	mesh.addChild(arrow1Cone);
	const arrow2Cylinder = babylon.MeshBuilder.CreateCylinder(`${p_Name}-right`, { diameter: 0.5, height: 1.5 }, p_ControlData.scene);
	const arrow2Cone = babylon.MeshBuilder.CreateCylinder(`${p_Name}-right`, { diameterTop: 0, diameterBottom: 1, height: 1 }, p_ControlData.scene);
	mesh.addChild(arrow2Cylinder);
	mesh.addChild(arrow2Cone);
	setPosition(arrow1Cylinder, { y: -2 }, 1);
	setPosition(arrow2Cylinder, { y: 2 }, 1);
	setPosition(arrow1Cone, { y: -3 }, 1);
	setRotation(arrow1Cone, { x: 0, y: 0, z: 180 });
	setPosition(arrow2Cone, { y: 3 }, 1);
	setVisibility(mesh, false);
	applyRecursive(mesh, "renderingGroupId", 1);

	return mesh;
}

function createManipulatorTemplates(p_WebGLControl) {
	const controlData = p_WebGLControl[privateData];
	controlData.manipulators[MANIPULATOR_TYPES.MOVE_X] = controlData.manipulators[MANIPULATOR_TYPES.MOVE_Y] = controlData.manipulators[MANIPULATOR_TYPES.MOVE_Z] = createMoveMesh("move-manipulator", controlData);
	controlData.manipulators[MANIPULATOR_TYPES.SCALE_X] = controlData.manipulators[MANIPULATOR_TYPES.SCALE_Y] = controlData.manipulators[MANIPULATOR_TYPES.SCALE_Z] = controlData.manipulators[MANIPULATOR_TYPES.SCALE] = createScaleMesh("scale-manipulator", controlData);
	controlData.manipulators[MANIPULATOR_TYPES.ROTATE_X] = controlData.manipulators[MANIPULATOR_TYPES.ROTATE_Y] = controlData.manipulators[MANIPULATOR_TYPES.ROTATE_Z] = createRotateMesh("rotate-manipulator", controlData);
}

function createMeshInstance(p_Mesh, p_Name) {
	const instance = p_Mesh.createInstance(p_Name);
	p_Mesh.getChildren().forEach((p_Child) => instance.addChild(createMeshInstance(p_Child, `${p_Name}-${p_Child.name}`)));
	return instance;
}

function createAndAttachManipulatorInstance(p_ManipulatorName, p_WebGLControl, p_Mesh, p_Settings) {
	const controlData = p_WebGLControl[privateData];
	const name = `${p_ManipulatorName}-${p_Mesh.name}`;
	p_Mesh.getChildMeshes(true, (p_ChildMesh) => p_ChildMesh.name === name).forEach((p_ChildMesh) => p_Mesh.removeChild(p_ChildMesh));
	const clonedMesh = controlData.manipulators[p_ManipulatorName].clone(name);
	clonedMesh.manipulatorType = p_ManipulatorName;
	p_Mesh.addChild(clonedMesh);
	if (p_Settings.position) {
		setPosition(clonedMesh, p_Settings.position, 1);
	}
	if (p_Settings.rotation) {
		setRotation(clonedMesh, p_Settings.rotation);
	}
	if (p_Settings.scale) {
		setScale(clonedMesh, p_Settings.scale);
	}
	applyRecursive(clonedMesh, "checkCollisions", true);
	applyRecursive(clonedMesh, "isVisible", true);
}

function attachMoveXManipulator(p_WebGLControl, p_Mesh, p_Settings) {
	createAndAttachManipulatorInstance(MANIPULATOR_TYPES.MOVE_X, p_WebGLControl, p_Mesh, p_Settings);
}
function attachMoveYManipulator(p_WebGLControl, p_Mesh, p_Settings) {
	createAndAttachManipulatorInstance(MANIPULATOR_TYPES.MOVE_Y, p_WebGLControl, p_Mesh, p_Settings);
}
function attachMoveZManipulator(p_WebGLControl, p_Mesh, p_Settings) {
	createAndAttachManipulatorInstance(MANIPULATOR_TYPES.MOVE_Z, p_WebGLControl, p_Mesh, p_Settings);
}
function attachScaleXManipulator(p_WebGLControl, p_Mesh, p_Settings) {
	createAndAttachManipulatorInstance(MANIPULATOR_TYPES.SCALE_X, p_WebGLControl, p_Mesh, p_Settings);
}
function attachScaleYManipulator(p_WebGLControl, p_Mesh, p_Settings) {
	createAndAttachManipulatorInstance(MANIPULATOR_TYPES.SCALE_Y, p_WebGLControl, p_Mesh, p_Settings);
}
function attachScaleZManipulator(p_WebGLControl, p_Mesh, p_Settings) {
	createAndAttachManipulatorInstance(MANIPULATOR_TYPES.SCALE_Z, p_WebGLControl, p_Mesh, p_Settings);
}
function attachScaleManipulator(p_WebGLControl, p_Mesh, p_Settings) {
	createAndAttachManipulatorInstance(MANIPULATOR_TYPES.SCALE, p_WebGLControl, p_Mesh, p_Settings);
}
function attachRotateAroundXManipulator(p_WebGLControl, p_Mesh, p_Settings) {
	createAndAttachManipulatorInstance(MANIPULATOR_TYPES.ROTATE_X, p_WebGLControl, p_Mesh, p_Settings);
}
function attachRotateAroundYManipulator(p_WebGLControl, p_Mesh, p_Settings) {
	createAndAttachManipulatorInstance(MANIPULATOR_TYPES.ROTATE_Y, p_WebGLControl, p_Mesh, p_Settings);
}
function attachRotateAroundZManipulator(p_WebGLControl, p_Mesh, p_Settings) {
	createAndAttachManipulatorInstance(MANIPULATOR_TYPES.ROTATE_Z, p_WebGLControl, p_Mesh, p_Settings);
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
			manipulators: {},
			activeManipulationObjects: {},
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

	async addObjectResource(p_Name, p_MeshName, p_FileName, p_Settings) {
		const controlData = this[privateData];
		const meshTask = controlData.assetsManager.addMeshTask(p_Name, p_MeshName, `${p_FileName.split("/").slice(0, -1).join("/")}/`, p_FileName.split("/").slice(-1)[0]);
		return await new Promise((resolve, reject) => {
			meshTask.onSuccess = (task) => {
				if (!p_Settings.position) {
					p_Settings.position = { x: 0, y: 0, z: 0 };
				}
				if (task.loadedMeshes.length === 1) {
					addMesh(this, p_Name, task.loadedMeshes[0], p_Settings);
				} else {
					const mesh = new babylon.Mesh(p_Name, controlData.scene);
					task.loadedMeshes.forEach((p_Mesh) => {
						p_Mesh.renderingGroupId = 1;
						mesh.addChild(p_Mesh);
					});
					addMesh(this, p_Name, mesh, p_Settings);
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

	addSphere(p_Name, p_Settings) {
		const sphere = babylon.MeshBuilder.CreateSphere(p_Name, { segments: p_Settings.segments || 16, diameter: (p_Settings.diameter || 1) * this.unitMultiplier, diameterX: (p_Settings.diameterX || p_Settings.diameter || 1) * this.unitMultiplier, diameterY: (p_Settings.diameterY || p_Settings.diameter || 1) * this.unitMultiplier, diameterZ: (p_Settings.diameterZ || p_Settings.diameter || 1) * this.unitMultiplier, arc: p_Settings.arc || 1, slice: p_Settings.slice || 1, sideOrientation: p_Settings.sideOrientation }, this[privateData].scene);
		addMesh(this, p_Name, sphere, p_Settings);
		return sphere;
	}

	addBox(p_Name, p_Settings) {
		const box = babylon.MeshBuilder.CreateBox(p_Name, { width: (p_Settings.width || 1) * this.unitMultiplier, height: (p_Settings.height || 1) * this.unitMultiplier, depth: (p_Settings.depth || 1) * this.unitMultiplier, sideOrientation: p_Settings.sideOrientation }, this[privateData].scene);
		addMesh(this, p_Name, box, p_Settings);
		return box;
	}

	addPlane(p_Name, p_Settings) {
		const plane = babylon.MeshBuilder.CreatePlane(p_Name, { width: (p_Settings.width || 1) * this.unitMultiplier, height: (p_Settings.height || 1) * this.unitMultiplier, sideOrientation: p_Settings.sideOrientation }, this[privateData].scene);
		addMesh(this, p_Name, plane, p_Settings);
		return plane;
	}

	addGround(p_Name, p_Settings) {
		const controlData = this[privateData];
		const ground = babylon.MeshBuilder.CreateGround(p_Name, { width: (p_Settings.width || 1) * this.unitMultiplier, height: (p_Settings.height || 1) * this.unitMultiplier, subdivisions: p_Settings.subdivisions || 1 }, controlData.scene);
		controlData.meshes[p_Name] = ground;
		ground.receiveShadows = true;
		ground.checkCollisions = controlData.allObjectCollisions;
		return ground;
	}

	addPolyline(p_Name, p_Settings) {
		const linePoints = p_Settings.points.map((p_Point) => new babylon.Vector3(p_Point.x * this.unitMultiplier, p_Point.y * this.unitMultiplier, p_Point.z * this.unitMultiplier));
		const polyLine = (linePoints.length > 1) ? babylon.MeshBuilder.CreateLines(p_Name, { points: linePoints }, this[privateData].scene) : null;
		addMesh(this, p_Name, polyLine, p_Settings);
		return polyLine;
	}

	addExtrudedPolygon(p_Name, p_Settings) {
		const shape = (p_Settings.outline || []).map((p_Point) => convertToVector3(multiplyVector(convertToVectorObject(p_Point), this.unitMultiplier)));
		const holes = (p_Settings.holes || []).map((p_Hole) => p_Hole.map((p_Point) => convertToVector3(multiplyVector(convertToVectorObject(p_Point), this.unitMultiplier))));
		if (shape.length) {
			const polygon = babylon.MeshBuilder.ExtrudePolygon(p_Name, {
				shape,
				depth: (p_Settings.depth || 0) * this.unitMultiplier,
				holes,
			}, this[privateData].scene);
			addMesh(this, p_Name, polygon, p_Settings);
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

	addMaterial(p_MaterialName, p_Settings) {
		const controlData = this[privateData];
		const material = controlData.materials[p_MaterialName] || new babylon.StandardMaterial(p_MaterialName, controlData.scene);
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
				material.diffuseTexture = new babylon.Texture(p_Settings.texture.src, controlData.scene);
				material.diffuseTexture.hasAlpha = p_Settings.texture.alpha || false;
			}
			if (p_Settings.texture.bumpSrc) {
				material.bumpTexture = new babylon.Texture(p_Settings.texture.bumpSrc, controlData.scene);
			}
			if (p_Settings.texture.opacitySrc) {
				material.opacityTexture = new babylon.Texture(p_Settings.texture.opacitySrc, controlData.scene);
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
		controlData.materials[p_MaterialName] = material;
		return material;
	}

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

	static getAllManipulatorsAllowed() {
		return Object.keys(MANIPULATOR_TYPES).reduce((p_Previous, p_Option) => { p_Previous[p_Option] = true; return p_Previous; }, {});
	}

	setAllowedManipulators(p_ObjectName, p_Settings) {
		const mesh = getMeshObject(this, p_ObjectName);
		mesh.manipulation = mesh.manipulation || {};
		Object.keys(p_Settings).forEach((p_Key) => {
			if (MANIPULATOR_TYPES[p_Key]) {
				mesh.manipulation[p_Key] = p_Settings[p_Key];
			}
		});
	}

	removeManipulators(p_ObjectName) {
		const controlData = this[privateData];
		const manipulatorName = `manipulator-for-${p_ObjectName}`;
		if (controlData.activeManipulationObjects[manipulatorName]) {
			controlData.activeManipulationObjects[manipulatorName].dispose();
			delete controlData.activeManipulationObjects[manipulatorName];
		}
	}

	attachManipulators(p_ObjectName) {
		const controlData = this[privateData];
		const mesh = getMeshObject(this, p_ObjectName);
		if (mesh) {
			const bounding = mesh.getBoundingInfo();
			const maxVector = bounding.boundingBox.maximum;
			const minVector = bounding.boundingBox.minimum;
			const center = bounding.boundingBox.centerWorld;
			if (mesh && mesh.manipulation && Object.keys(mesh.manipulation).find((p_Key) => MANIPULATOR_TYPES[p_Key] && mesh.manipulation[p_Key])) {
				const manipulatorMesh = new babylon.Mesh(`manipulator-for-${p_ObjectName}`, controlData.scene);
				controlData.activeManipulationObjects[`manipulator-for-${p_ObjectName}`] = manipulatorMesh;
				manipulatorMesh.manipulatedMesh = mesh;
				const manipulation = mesh.manipulation;
				if (manipulation[MANIPULATOR_TYPES.MOVE_X]) {
					attachMoveXManipulator(this, manipulatorMesh, { position: { x: maxVector.x + center.x + 4, y: minVector.y + center.y - 1, z: minVector.z + center.z - 1 }, rotation: { x: 0, y: 0, z: 90 } });
				}
				if (manipulation[MANIPULATOR_TYPES.MOVE_Y]) {
					attachMoveYManipulator(this, manipulatorMesh, { position: { x: minVector.x + center.x - 1, y: maxVector.y + center.y + 4, z: minVector.z + center.z - 1 }, rotation: { x: 0, y: 0, z: 0 } });
				}
				if (manipulation[MANIPULATOR_TYPES.MOVE_Z]) {
					attachMoveZManipulator(this, manipulatorMesh, { position: { x: minVector.x + center.x - 1, y: minVector.y + center.y + 1, z: minVector.z + center.z - 4 }, rotation: { x: 90, y: 0, z: 0 } });
				}
				if (manipulation[MANIPULATOR_TYPES.SCALE]) {
					attachScaleManipulator(this, manipulatorMesh, { position: { x: maxVector.x + center.x + 4, y: maxVector.y + center.y + 4, z: minVector.z + center.z - 4 }, rotation: { x: -45, y: -45, z: 0 } });
				} else {
					if (manipulation[MANIPULATOR_TYPES.SCALE_X]) {
						attachScaleXManipulator(this, manipulatorMesh, { position: { x: maxVector.x + center.x + 4, y: minVector.y + center.y - 1, z: minVector.z + center.z - 1 }, rotation: { x: 0, y: 0, z: 90 } });
					}
					if (manipulation[MANIPULATOR_TYPES.SCALE_Y]) {
						attachScaleYManipulator(this, manipulatorMesh, { position: { x: minVector.x + center.x - 1, y: maxVector.y + center.y + 4, z: minVector.z + center.z - 1 }, rotation: { x: 0, y: 0, z: 0 } });
					}
					if (manipulation[MANIPULATOR_TYPES.SCALE_Z]) {
						attachScaleZManipulator(this, manipulatorMesh, { position: { x: minVector.x + center.x - 1, y: minVector.y + center.y + 1, z: minVector.z + center.z - 4 }, rotation: { x: 90, y: 0, z: 0 } });
					}
				}
				if (manipulation[MANIPULATOR_TYPES.ROTATE_X]) {
					attachRotateAroundXManipulator(this, manipulatorMesh, { position: { x: minVector.x + center.x - 1, y: minVector.y + center.y + 1, z: minVector.z + center.z - 4 }, rotation: { x: 90, y: 0, z: 0 } });
				}
				if (manipulation[MANIPULATOR_TYPES.ROTATE_Y]) {
					attachRotateAroundYManipulator(this, manipulatorMesh, { position: { x: minVector.x + center.x - 1, y: minVector.y + center.y + 1, z: minVector.z + center.z - 4 }, rotation: { x: 90, y: 0, z: 0 } });
				}
				if (manipulation[MANIPULATOR_TYPES.ROTATE_Z]) {
					attachRotateAroundZManipulator(this, manipulatorMesh, { position: { x: maxVector.x + center.x + 4, y: minVector.y + center.y - 1, z: minVector.z + center.z - 1 }, rotation: { x: 0, y: 0, z: 90 } });
				}
			}
		}
	}

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
			this.addMaterial("manipulator-unselected", { diffuse: { r: 0.6, g: 0.6, b: 1 } });
			this.addMaterial("manipulator-selected", { diffuse: { r: 0, g: 0, b: 1 } });

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

		const getPlanePosition = () => {
			const pickInfo = controlData.scene.pick(controlData.scene.pointerX, controlData.scene.pointerY, (p_Mesh) => controlData.draggingManipulator && p_Mesh === controlData.draggingManipulator.manipulatorPlane);
			return (pickInfo.hit) ? pickInfo.pickedPoint : null;
		};

		controlData.scene.onPointerObservable.add((p_Event) => {
			if (p_Event.pickInfo.hit) {
				let mesh = p_Event.pickInfo.pickedMesh;
				while (mesh && !MANIPULATOR_TYPES[mesh.manipulatorType]) {
					mesh = mesh.parent;
				}
				if (mesh) {
					controlData.draggingManipulator = { manipulatorType: mesh.manipulatorType, activeManipulator: mesh };
					let meshManipulator = mesh;
					while (meshManipulator && !meshManipulator.manipulatedMesh) {
						meshManipulator = meshManipulator.parent;
					}
					if (meshManipulator) {
						const bounding = mesh.getBoundingInfo();
						const center = bounding.boundingBox.centerWorld;
						switch (mesh.manipulatorType) {
							case MANIPULATOR_TYPES.MOVE_X:
							case MANIPULATOR_TYPES.SCALE_X:
							case MANIPULATOR_TYPES.ROTATE_Z:
								controlData.draggingManipulator.manipulatorPlane = babylon.MeshBuilder.CreatePlane(`manipulatorXPlane-for-${meshManipulator.manipulatedMesh.name}`, { width: 10000, height: 10000 }, this[privateData].scene);
								controlData.draggingManipulator.manipulatorPlane.position.z = center.z;
								controlData.draggingManipulator.manipulatorPlane.renderingGroupId = 1;
								controlData.draggingManipulator.manipulatorPlane.checkCollisions = true;
								controlData.draggingManipulator.manipulatorPlane.computeWorldMatrix(true);
								controlData.draggingManipulator.manipulatorPlane.isVisible = false;
								break;
							case MANIPULATOR_TYPES.SCALE:
								controlData.draggingManipulator.manipulatorPlane = babylon.MeshBuilder.CreatePlane(`manipulatorXPlane-for-${meshManipulator.manipulatedMesh.name}`, { width: 10000, height: 10000 }, this[privateData].scene);
								controlData.draggingManipulator.manipulatorPlane.position.z = center.z;
								controlData.draggingManipulator.manipulatorPlane.position.x = center.x;
								controlData.draggingManipulator.manipulatorPlane.position.y = center.y;
								controlData.draggingManipulator.manipulatorPlane.rotation.y = toRadians(45);
								controlData.draggingManipulator.manipulatorPlane.renderingGroupId = 1;
								controlData.draggingManipulator.manipulatorPlane.checkCollisions = true;
								controlData.draggingManipulator.manipulatorPlane.computeWorldMatrix(true);
								controlData.draggingManipulator.manipulatorPlane.isVisible = false;
								break;
							case MANIPULATOR_TYPES.MOVE_Y:
							case MANIPULATOR_TYPES.SCALE_Y:
								controlData.draggingManipulator.manipulatorPlane = babylon.MeshBuilder.CreatePlane(`manipulatorYPlane-for-${meshManipulator.manipulatedMesh.name}`, { width: 10000, height: 10000 }, this[privateData].scene);
								controlData.draggingManipulator.manipulatorPlane.position.z = center.z;
								controlData.draggingManipulator.manipulatorPlane.renderingGroupId = 1;
								controlData.draggingManipulator.manipulatorPlane.checkCollisions = true;
								controlData.draggingManipulator.manipulatorPlane.computeWorldMatrix(true);
								controlData.draggingManipulator.manipulatorPlane.isVisible = false;
								break;
							case MANIPULATOR_TYPES.ROTATE_X:
								controlData.draggingManipulator.manipulatorPlane = babylon.MeshBuilder.CreatePlane(`manipulatorYPlane-for-${meshManipulator.manipulatedMesh.name}`, { width: 10000, height: 10000 }, this[privateData].scene);
								controlData.draggingManipulator.manipulatorPlane.position.z = center.z;
								controlData.draggingManipulator.manipulatorPlane.rotation.y = toRadians(90);
								controlData.draggingManipulator.manipulatorPlane.renderingGroupId = 1;
								controlData.draggingManipulator.manipulatorPlane.checkCollisions = true;
								controlData.draggingManipulator.manipulatorPlane.computeWorldMatrix(true);
								controlData.draggingManipulator.manipulatorPlane.isVisible = false;
								break;
							case MANIPULATOR_TYPES.MOVE_Z:
							case MANIPULATOR_TYPES.SCALE_Z:
							case MANIPULATOR_TYPES.ROTATE_Y:
								controlData.draggingManipulator.manipulatorPlane = babylon.MeshBuilder.CreatePlane(`manipulatorZPlane-for-${meshManipulator.manipulatedMesh.name}`, { width: 10000, height: 10000 }, this[privateData].scene);
								controlData.draggingManipulator.manipulatorPlane.position.y = center.y;
								controlData.draggingManipulator.manipulatorPlane.rotation.x = toRadians(90);
								controlData.draggingManipulator.manipulatorPlane.renderingGroupId = 1;
								controlData.draggingManipulator.manipulatorPlane.checkCollisions = true;
								controlData.draggingManipulator.manipulatorPlane.computeWorldMatrix(true);
								controlData.draggingManipulator.manipulatorPlane.isVisible = false;
								break;
							case MANIPULATOR_TYPES.MOVE_PLANE:
								controlData.draggingManipulator.manipulatorPlane = mesh.manipulatorPlane;
								break;
						}

						controlData.draggingManipulator.startPoint = getPlanePosition();
						if (controlData.draggingManipulator.startPoint) {
							controlData.draggingManipulator.manipulatorsMesh = meshManipulator;
							controlData.draggingManipulator.activeManipulator.getChildren()[0].material = controlData.materials["manipulator-selected"].clone();
							controlData.camera.detachControl(this.$.canvas);
						} else {
							if (controlData.draggingManipulator.manipulatorType !== MANIPULATOR_TYPES.MOVE_PLANE) {
								controlData.draggingManipulator.manipulatorPlane.dispose();
							}
							controlData.draggingManipulator = null;
						}
					} else {
						controlData.draggingManipulator.manipulatorPlane.dispose();
						controlData.draggingManipulator = null;
					}
				}
			}
		}, babylon.PointerEventTypes.POINTERDOWN);

		controlData.scene.onPointerObservable.add(() => {
			if (controlData.draggingManipulator) {
				if (controlData.draggingManipulator.manipulatorType !== MANIPULATOR_TYPES.MOVE_PLANE) {
					controlData.draggingManipulator.manipulatorPlane.dispose();
				}
				controlData.draggingManipulator.activeManipulator.getChildren()[0].material = controlData.materials["manipulator-unselected"].clone();
				controlData.draggingManipulator = null;
			}
			controlData.camera.attachControl(this.$.canvas, !(controlData.preventDefault || false));
		}, babylon.PointerEventTypes.POINTERUP);

		controlData.scene.onPointerObservable.add(() => {
			if (controlData.draggingManipulator && controlData.draggingManipulator.startPoint) {
				const currentPoint = getPlanePosition();
				if (currentPoint) {
					const targetObjectCenter = controlData.draggingManipulator.manipulatorsMesh.manipulatedMesh.getBoundingInfo().boundingBox.centerWorld;
					const diff = currentPoint.subtract(controlData.draggingManipulator.startPoint);
					diff.x = Math.round(diff.x * 1000) / 1000;
					diff.y = Math.round(diff.y * 1000) / 1000;
					diff.z = Math.round(diff.z * 1000) / 1000;
					switch (controlData.draggingManipulator.manipulatorType) {
						case MANIPULATOR_TYPES.MOVE_X:
							diff.y = 0;
							diff.z = 0;
							controlData.draggingManipulator.manipulatorsMesh.position.addInPlace(diff);
							controlData.draggingManipulator.manipulatorsMesh.manipulatedMesh.position.addInPlace(diff);
							controlData.draggingManipulator.startPoint = currentPoint;
							break;
						case MANIPULATOR_TYPES.MOVE_Y:
							diff.x = 0;
							diff.z = 0;
							controlData.draggingManipulator.manipulatorsMesh.position.addInPlace(diff);
							controlData.draggingManipulator.manipulatorsMesh.manipulatedMesh.position.addInPlace(diff);
							controlData.draggingManipulator.startPoint = currentPoint;
							break;
						case MANIPULATOR_TYPES.MOVE_Z:
							diff.x = 0;
							diff.y = 0;
							controlData.draggingManipulator.manipulatorsMesh.position.addInPlace(diff);
							controlData.draggingManipulator.manipulatorsMesh.manipulatedMesh.position.addInPlace(diff);
							controlData.draggingManipulator.startPoint = currentPoint;
							break;
						case MANIPULATOR_TYPES.MOVE_PLANE:
							controlData.draggingManipulator.manipulatorsMesh.position.addInPlace(diff);
							controlData.draggingManipulator.manipulatorsMesh.manipulatedMesh.position.addInPlace(diff);
							controlData.draggingManipulator.startPoint = currentPoint;
							break;
						case MANIPULATOR_TYPES.SCALE: {
							const oldDistance = controlData.draggingManipulator.startPoint.subtract(targetObjectCenter).length();
							const newDistance = currentPoint.subtract(targetObjectCenter).length();
							controlData.draggingManipulator.manipulatorsMesh.scaling.x = newDistance / oldDistance;
							controlData.draggingManipulator.manipulatorsMesh.scaling.y = newDistance / oldDistance;
							controlData.draggingManipulator.manipulatorsMesh.scaling.z = newDistance / oldDistance;
							controlData.draggingManipulator.manipulatorsMesh.manipulatedMesh.scaling.x = newDistance / oldDistance;
							controlData.draggingManipulator.manipulatorsMesh.manipulatedMesh.scaling.y = newDistance / oldDistance;
							controlData.draggingManipulator.manipulatorsMesh.manipulatedMesh.scaling.z = newDistance / oldDistance;
						}
							break;
						case MANIPULATOR_TYPES.SCALE_X:
							break;
						case MANIPULATOR_TYPES.SCALE_Y:
							break;
						case MANIPULATOR_TYPES.SCALE_Z:
							break;
						case MANIPULATOR_TYPES.ROTATE_X:
							break;
						case MANIPULATOR_TYPES.ROTATE_Y:
							break;
						case MANIPULATOR_TYPES.ROTATE_Z:
							break;
					}
				}
			}
		}, babylon.PointerEventTypes.POINTERMOVE);

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
		createManipulatorTemplates(this);
	}
}

window.customElements.define(componentName, VicowaWebgl);
