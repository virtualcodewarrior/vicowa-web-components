/* eslint new-cap: ["off"] */
/* switching this off for this file because babylon uses almost all uppercase starting function names */
import '/third_party/earcut/dist/earcut.dev.js';
import '/third_party/babylonjs/babylon.max.js';
import '/third_party/babylonjs-loaders/babylonjs.loaders.js';
import { WebComponentBaseClass } from '/third_party/web-component-base-class/src/web-component-base-class.js';
import '../vicowa-resize-detector/vicowa-resize-detector.js';
import { CAMERA_TYPES, CAP_TYPES } from './vicowa-webgl-definitions.js';
import { intersectRayAndTriangle, toDegrees, toRadians, vectorLength } from '../utilities/mathHelpers.js';
import debug from '../utilities/debug.js';

const meshContainer = Symbol('meshContainer');
const wrapReference = Symbol('wrapReference');
const originalDispose = Symbol('originalDispose');

function unWrap(wrapped) { return wrapped[meshContainer]; }

const babylon = window.BABYLON;

let nameID = 0;
// validate the name or create a name when none is specified
function ensureName(name) {
	debug.assert(!name || !/--/.test(name), "names containing a double dash '--' are reserved for internal use only");
	return (!name) ? `objectID--${++nameID}` : name;
}

function multiplyObject(obj, multiplier, keysToMultiply) {
	Object.keys(obj).filter((key) => keysToMultiply.includes(key)).forEach((key) => { obj[key] = (obj[key] || 0) * multiplier; });
	return obj;
}

function multiplyVector(vector, multiplier) { return multiplyObject(vector, multiplier, ['x', 'y', 'z']); }
function convertToVectorObject(vector) { return (Array.isArray(vector)) ? { x: vector[0], y: vector[1], z: vector[2] } : vector; }
function convertToVector3(vector) { return new babylon.Vector3(vector.x, vector.y, vector.z); }
function flattenMeshes(mesh) { return [mesh].concat(mesh.getChildMeshes(false)); }

function getMeshObject(controlData, meshNamePathOrObject) {
	let mesh = null;
	if (Array.isArray(meshNamePathOrObject)) {
		// this is a path to the mesh, maybe because we clicked a child mesh
		mesh = controlData.meshes[meshNamePathOrObject[0]] || controlData.instances[meshNamePathOrObject[0]];
		meshNamePathOrObject.slice(1).forEach((name) => {
			if (mesh) {
				mesh = mesh.getChildMeshes(true, (childMesh) => childMesh.name === name)[0];
			}
		});
	} else if (typeof meshNamePathOrObject === 'string') {
		mesh = controlData.meshes[meshNamePathOrObject] || controlData.instances[meshNamePathOrObject];
	} else {
		mesh = unWrap(meshNamePathOrObject);
	}
	return mesh;
}

function getTopLevelMeshObject(controlData, meshNamePathOrObject) {
	let mesh = getMeshObject(controlData, meshNamePathOrObject);
	while (mesh && controlData.meshes[mesh.name] !== mesh) {
		mesh = mesh.parent;
	}
	return mesh;
}

function applyRecursive(mesh, propertyName, propertyValue) {
	mesh[propertyName] = propertyValue;
	mesh.getChildMeshes(false).forEach((child) => { child[propertyName] = propertyValue; });
}

function createShadowGenerator(light) {
	const shadowGenerator = new babylon.ShadowGenerator(1024, light);
	shadowGenerator.getShadowMap().refreshRate = babylon.RenderTargetTexture.REFRESHRATE_RENDER_ONCE;
	shadowGenerator.bias = 0.0001;
	shadowGenerator.forceBackFacesOnly = true;
	shadowGenerator.normalBias = 0.02;
	light.shadowMaxZ = 1000;
	light.shadowMinZ = -1000;
	shadowGenerator.useContactHardeningShadow = true;
	shadowGenerator.contactHardeningLightSizeUVRatio = 0.05;
	shadowGenerator.setDarkness(0.2);

	return shadowGenerator;
}

function addShadowCaster(controlData, meshObject) {
	Object.keys(controlData.lights).forEach((lightKey) => {
		const light = controlData.lights[lightKey];
		if (light.shadowGenerator) {
			light.shadowGenerator.addShadowCaster(meshObject);
		}
	});
}

function applyAllMeshes(meshes, excludedNames, propertyName, propertyValue) {
	Object.keys(meshes).forEach((key) => { if (!excludedNames.includes(key)) { applyRecursive(meshes[key], propertyName, propertyValue); } });
}

function setPosition(mesh, position, unitMultiplier) {
	Object.assign(mesh.position, multiplyVector(position, unitMultiplier));
}

function setRotation(mesh, rotation) {
	mesh.rotation.x = (rotation.x !== undefined) ? toRadians(rotation.x) : mesh.rotation.x;
	mesh.rotation.y = (rotation.y !== undefined) ? toRadians(rotation.y) : mesh.rotation.y;
	mesh.rotation.z = (rotation.z !== undefined) ? toRadians(rotation.z) : mesh.rotation.z;
}

function setScale(mesh, scale) {
	Object.assign(mesh.scaling, scale);
}

function addMaterial(controlData, materialName, settings) {
	const material = controlData.materials[materialName] || new babylon.StandardMaterial(materialName, controlData.scene);
	if (settings.diffuse) {
		Object.assign(material.diffuseColor, settings.diffuse);
	}
	if (settings.specular) {
		Object.assign(material.specularColor, settings.specular);
	}
	if (settings.emissive) {
		Object.assign(material.emissiveColor, settings.emissive);
	}
	if (settings.ambient) {
		Object.assign(material.ambientColor, settings.ambient);
	}

	if (settings.alpha !== undefined) {
		material.alpha = settings.alpha;
	}
	if (settings.texture && settings.texture.src) {
		material.invertNormalMapY = material.invertNormalMapX = settings.texture.invertBump || false;
		if (settings.texture.src) {
			material.diffuseTexture = new babylon.Texture(settings.texture.src, controlData.scene);
			material.diffuseTexture.hasAlpha = settings.texture.alpha || false;
		}
		if (settings.texture.bumpSrc) {
			material.bumpTexture = new babylon.Texture(settings.texture.bumpSrc, controlData.scene);
		}
		if (settings.texture.opacitySrc) {
			material.opacityTexture = new babylon.Texture(settings.texture.opacitySrc, controlData.scene);
		}
		if (settings.texture.xScale) {
			if (material.diffuseTexture) {
				material.diffuseTexture.uScale = settings.texture.xScale;
			}
			if (material.bumpTexture) {
				material.bumpTexture.uScale = settings.texture.xScale;
			}
			if (material.opacityTexture) {
				material.opacityTexture.uScale = settings.texture.xScale;
			}
		}
		if (settings.texture.yScale) {
			if (material.diffuseTexture) {
				material.diffuseTexture.vScale = settings.texture.yScale;
			}
			if (material.bumpTexture) {
				material.bumpTexture.vScale = settings.texture.yScale;
			}
			if (material.opacityTexture) {
				material.opacityTexture.vScale = settings.texture.yScale;
			}
		}
	}
	controlData.materials[materialName] = material;
	return material;
}

function applySettings(controlData, meshObject, settings) {
	if (meshObject && settings) {
		if (settings.position) {
			setPosition(meshObject, settings.position, controlData.multiplier);
		}
		if (settings.rotation) {
			setRotation(meshObject, settings.rotation);
		}
		if (settings.scale) {
			setScale(meshObject, settings.scale);
		}
		if (settings.visible !== undefined) {
			applyRecursive(meshObject, 'isVisible', settings.visible);
		}
		if (settings.collisions !== undefined) {
			applyRecursive(meshObject, 'checkCollisions', settings.collisions);
		}
		if (settings.material) {
			if (typeof settings.material === 'string') {
				const material = controlData.materials[settings.material];
				if (material) {
					meshObject.material = material;
				}
			} else {
				if (settings.material.name) {
					const material = addMaterial(controlData, settings.material.name, settings.material);
					if (material) {
						meshObject.material = material;
					}
				}
			}
		}
		meshObject.renderingGroupId = (settings.renderingGroupId === undefined) ? meshObject.renderingGroupId || 1 : settings.renderingGroupId;
		meshObject.outline = (settings.outline === undefined) ? meshObject.outline : settings.outline;

		// do shadows
		if (settings.shadows !== undefined) {
			if (settings.shadows) {
				addShadowCaster(controlData, meshObject);
				meshObject.receiveShadows = true;
			}
		}
	}

	return meshObject;
}

function createMeshInstance(mesh, name) {
	const instance = mesh.createInstance(name);
	mesh.getChildren().forEach((child) => instance.addChild(createMeshInstance(child, `${name}-${child.name}`)));
	return instance;
}

function createSphere(controlData, settings, name) {
	return applySettings(controlData, babylon.MeshBuilder.CreateSphere(ensureName(name), { segments: settings.segments || 16, diameter: (settings.diameter || 1) * controlData.multiplier, diameterX: (settings.diameterX || settings.diameter || 1) * controlData.multiplier, diameterY: (settings.diameterY || settings.diameter || 1) * controlData.multiplier, diameterZ: (settings.diameterZ || settings.diameter || 1) * controlData.multiplier, arc: settings.arc || 1, slice: settings.slice || 1, sideOrientation: settings.sideOrientation }, controlData.scene), settings);
}

function createBox(controlData, settings, name) {
	return applySettings(controlData, babylon.MeshBuilder.CreateBox(ensureName(name), { width: (settings.width || 1) * controlData.multiplier, height: (settings.height || 1) * controlData.multiplier, depth: (settings.depth || 1) * controlData.multiplier, sideOrientation: settings.sideOrientation }, controlData.scene), settings);
}

function createPlane(controlData, settings, name) {
	return applySettings(controlData, babylon.MeshBuilder.CreatePlane(ensureName(name), { width: (settings.width || 1) * controlData.multiplier, height: (settings.height || 1) * controlData.multiplier, sideOrientation: settings.sideOrientation }, controlData.scene), settings);
}

function createPolyLine(controlData, settings, name) {
	const linePoints = settings.points.map((point) => new babylon.Vector3(point.x * controlData.multiplier, point.y * controlData.multiplier, point.z * controlData.multiplier));
	const polyLine = (linePoints.length > 1) ? babylon.MeshBuilder.CreateLines(ensureName(name), { points: linePoints }, controlData.scene) : null;
	return (polyLine) ? applySettings(controlData, polyLine, settings) : null;
}

function createExtrudedPolygon(controlData, settings, name) {
	const shape = (settings.outline || []).map((point) => convertToVector3(multiplyVector(convertToVectorObject(point), controlData.multiplier)));
	const holes = (settings.holes || []).map((hole) => hole.map((point) => convertToVector3(multiplyVector(convertToVectorObject(point), controlData.multiplier))));
	return (shape.length) ? applySettings(controlData, babylon.MeshBuilder.ExtrudePolygon(ensureName(name), {
		shape,
		depth: (settings.depth || 0) * controlData.multiplier,
		holes,
	}, controlData.scene), settings) : null;
}

function createCylinder(controlData, settings, name) {
	return applySettings(controlData, babylon.MeshBuilder.CreateCylinder(ensureName(name), { height: (settings.height || 1) * controlData.multiplier, diameter: (settings.diameter === undefined) ? settings.diameter : (settings.diameter || 1) * controlData.multiplier, diameterTop: ((settings.diameterTop === undefined) ? (settings.diameter || 1) : settings.diameterTop) * controlData.multiplier, diameterBottom: ((settings.diameterBottom === undefined) ? (settings.diameter || 1) : settings.diameterBottom) * controlData.multiplier, tessellation: settings.segments || 16, arc: settings.arc || 1, enclose: settings.enclose || false }, controlData.scene), settings);
}

const capConvert = {};
capConvert[CAP_TYPES.NO_CAP] = babylon.Mesh.NO_CAP;
capConvert[CAP_TYPES.CAP_START] = babylon.Mesh.CAP_START;
capConvert[CAP_TYPES.CAP_END] = babylon.Mesh.CAP_END;
capConvert[CAP_TYPES.CAP_ALL] = babylon.Mesh.CAP_ALL;

function createTube(controlData, settings, name) {
	const path = (settings.path || []).map((point) => convertToVector3(multiplyVector(convertToVectorObject(point), controlData.multiplier)));
	return (path.length) ? applySettings(controlData, babylon.MeshBuilder.CreateTube(ensureName(name), {
		path,
		radius: (settings.radius || 1) * controlData.multiplier,
		tessellation: settings.segments || 16,
		arc: settings.arc || 1,
		cap: capConvert[settings.cap] || babylon.Mesh.NO_CAP,
	}, controlData.scene), settings) : null;
}

function createGround(controlData, newSettings, name) {
	const settings = Object.assign({}, newSettings, { shadows: false, collisions: false });
	const ground = applySettings(controlData, babylon.MeshBuilder.CreateGround(ensureName(name), { width: (settings.width || 1) * controlData.multiplier, height: (settings.height || 1) * controlData.multiplier, subdivisions: settings.subdivisions || 1 }, controlData.scene), settings);
	controlData.meshes[ground.name] = ground;
	ground.receiveShadows = true;
	ground.checkCollisions = controlData.allObjectCollisions;
}

function wrap(controlData, mesh) {
	let wrapped = mesh ? mesh[wrapReference] : null;
	if (!wrapped && mesh) {
		wrapped = {
			get visible() { return this[meshContainer].isVisible; },
			set visible(visible) { applyRecursive(this[meshContainer], 'isVisible', visible); },
			get parent() { return wrap(controlData, this[meshContainer].parent); },
			get center() { const bounding = this[meshContainer].getBoundingInfo(); const center = (bounding && bounding.boundingBox) ? bounding.boundingBox.centerWorld : null; return { x: center.x / controlData.multiplier, y: center.y / controlData.multiplier, z: center.z / controlData.multiplier }; },
			get maximum() { const bounding = this[meshContainer].getBoundingInfo(); const maximum = (bounding && bounding.boundingBox) ? bounding.boundingBox.maximumWorld : null; return { x: maximum.x / controlData.multiplier, y: maximum.y / controlData.multiplier, z: maximum.z / controlData.multiplier }; },
			get minimum() { const bounding = this[meshContainer].getBoundingInfo(); const minimum = (bounding && bounding.boundingBox) ? bounding.boundingBox.minimumWorld : null; return { x: minimum.x / controlData.multiplier, y: minimum.y / controlData.multiplier, z: minimum.z / controlData.multiplier }; },
			get boundingVectors() { const bounding = this[meshContainer].getBoundingInfo(); return (bounding && bounding.boundingBox) ? bounding.boundingBox.vectorsWorld.map((vector) => ({ x: vector.x / controlData.multiplier, y: vector.y / controlData.multiplier, z: vector.z / controlData.multiplier })) : null; },
			get name() { return this[meshContainer].name; },
			get position() { return { x: this[meshContainer].position.x / controlData.multiplier, y: this[meshContainer].position.y / controlData.multiplier, z: this[meshContainer].position.z / controlData.multiplier }; },
			set position(position) { setPosition(this[meshContainer], position, controlData.multiplier); },
			get scale() { return { x: this[meshContainer].scaling.x, y: this[meshContainer].scaling.y, z: this[meshContainer].scaling.z }; },
			set scale(scaling) { setScale(this[meshContainer], scaling); },
			get rotation() { return { x: toDegrees(this[meshContainer].rotation.x), y: toDegrees(this[meshContainer].rotation.y), z: toDegrees(this[meshContainer].rotation.z) }; },
			set rotation(rotation) { setRotation(this[meshContainer], rotation); },
			clone(name) { return wrap(controlData, this[meshContainer].clone(ensureName(name))); },
			updateCoordinates() { this[meshContainer].computeWorldMatrix(true); },
			remove() { this[meshContainer].dispose(); },
			applySettings(settings) { applySettings(controlData, this[meshContainer], settings); },
			offset(offset) { this[meshContainer].position.addInPlace({ x: offset.x * controlData.multiplier, y: offset.y * controlData.multiplier, z: offset.z * controlData.multiplier }); },
			isRemoved() { return this[meshContainer] === undefined; },
		};
		wrapped[meshContainer] = mesh;
		mesh[wrapReference] = wrapped;
		mesh[originalDispose] = mesh.dispose;
		mesh.dispose = function() {
			if (this[wrapReference].onRemove) {
				this[wrapReference].onRemove(this[wrapReference]);
			}

			delete controlData.meshes[this.name];
			delete controlData.instances[this.name];
			delete this[wrapReference][meshContainer];
			delete this[wrapReference];
			this.dispose = this[originalDispose];
			delete this[originalDispose];
			this.dispose();
		};
	}
	return wrapped;
}

function wrapGroup(controlData, mesh) {
	const wrapped = wrap(controlData, mesh);
	wrapped.addChild = function(child) { this[meshContainer].addChild(unWrap(child)); };
	wrapped.removeChild = function(child) { this[meshContainer].removeChild(unWrap(child)); };
	wrapped.addChildren = function(children) { const tempMesh = this[meshContainer]; children.forEach((child) => tempMesh.addChild(unWrap(child))); };
	wrapped.getChildren = function(filter, recursive) { return this[meshContainer].getChildMeshes(!recursive, (childMesh) => !filter || filter(wrap(controlData, childMesh))).map((child) => wrap(controlData, child)); };
	wrapped.clone = function(name) { return wrapGroup(controlData, this[meshContainer].clone(ensureName(name))); };
	return wrapped;
}

function wrapEvent(controlData, event) {
	return {
		event: event.event,
		hitObject: (event.pickInfo.hit) ? wrap(controlData, event.pickInfo.pickedMesh) : null,
	};
}

function addPointerDownListener(controlData, callback) { controlData.scene.onPointerObservable.add((event) => { callback(wrapEvent(controlData, event)); }, babylon.PointerEventTypes.POINTERDOWN); }
function addPointerUpListener(controlData, callback) { controlData.scene.onPointerObservable.add((event) => { callback(wrapEvent(controlData, event)); }, babylon.PointerEventTypes.POINTERUP); }
function addPointerMoveListener(controlData, callback) { controlData.scene.onPointerObservable.add((event) => { callback(wrapEvent(controlData, event)); }, babylon.PointerEventTypes.POINTERMOVE); }
function addPointerClickListener(controlData, callback) { controlData.scene.onPointerObservable.add((event) => { callback(wrapEvent(controlData, event)); }, babylon.PointerEventTypes.POINTERPICK); }

function screenToObjectPoint(controlData, position, mesh, boundingBoxCheck) {
	const childMeshes = flattenMeshes(mesh);
	const pickInfo = controlData.scene.pick(position.x, position.y, (testMesh) => childMeshes.includes(testMesh), boundingBoxCheck || false);
	return (pickInfo.hit) ? { x: pickInfo.pickedPoint.x / controlData.multiplier, y: pickInfo.pickedPoint.y / controlData.multiplier, z: pickInfo.pickedPoint.z / controlData.multiplier } : null;
}

function pointToScreenPoint(controlData, point) {
	return babylon.Vector3.Project(new babylon.Vector3(point.x * controlData.multiplier, point.y * controlData.multiplier, point.z * controlData.multiplier), babylon.Matrix.Identity(), controlData.scene.getTransformMatrix(), controlData.camera.viewport.toGlobal(controlData.engine));
}

function screenPointToBoundingProjection(controlData, point, mesh) {
	const ray = controlData.scene.createPickingRay(point.x, point.y, babylon.Matrix.Identity(), controlData.camera, false);
	const boxVectors = mesh.getBoundingInfo().boundingBox.vectorsWorld;
	const triangleIndexes = [[0, 3, 5], [0, 5, 2], [0, 4, 6], [0, 6, 3], [0, 2, 7], [0, 7, 4], [1, 7, 2], [1, 2, 5], [1, 6, 3], [1, 3, 5], [1, 6, 4], [1, 4, 7]];
	let distance = -1;
	let intersection = null;
	triangleIndexes.forEach((triangleIndexSet) => {
		const is = intersectRayAndTriangle(ray.origin, ray.direction, boxVectors[triangleIndexSet[0]], boxVectors[triangleIndexSet[1]], boxVectors[triangleIndexSet[2]]);
		if (is) {
			const dist = vectorLength(is, ray.origin);
			if (distance < 0 || distance > dist) {
				distance = dist;
				intersection = is;
			}
		}
	});

	return (intersection) ? { start: { x: ray.origin.x / controlData.multiplier, y: ray.origin.y / controlData.multiplier, z: ray.origin.z / controlData.multiplier }, intersection: { x: intersection.x / controlData.multiplier, y: intersection.y / controlData.multiplier, z: intersection.z / controlData.multiplier } } : null;
}

/**
 * Class to represent the vicowa-webgl custom element
 * @extends WebComponentBaseClass
 * @property {boolean} loadingScreen Set to true to show a loading screen or false for no loading screen
 * @property {boolean} selectionBoundingBox Set to true to show a bounding box when an object is selected or false to not show this box
 */
export class VicowaWebgl extends WebComponentBaseClass {
	#privateData;
	constructor() {
		super();
		this.#privateData = {
			lights: {},
			meshes: {},
			instances: {},
			materials: {},
			allObjectCollisions: true, // by default, all objects will do collision checking
			defaultShadows: true, // by default all objects cast shadows, this can be changed either per object or as a global setting
			multiplier: 10,
			assetsManager: null,
			scene: null,
			engine: null,
			extensions: [],
		};
	}

	static get properties() {
		return {
			loadingScreen: {
				type: Boolean,
				value: false,
				reflectToAttribute: true,
				observer: (control) => control.#handleLoadingScreenChange(),
			},
			selectionBoundingBox: {
				type: Boolean,
				value: false,
				reflectToAttribute: true,
				observer: (control) => control.#handleSelectionBoundingBoxChange(),
			},
		};
	}

	addExtension(extensionObject) {
		const controlData = this.#privateData;
		if (controlData.extensions.indexOf(extensionObject) === -1) {
			controlData.extensions.push(extensionObject);
			// make sure the scene has been created before attaching this
			if (controlData.scene) {
				this.#attachExtension(extensionObject);
			}
		}
	}

	async addObjectResource(name, objectName, fileName, settings) {
		const controlData = this.#privateData;
		const meshTask = controlData.assetsManager.addMeshTask(name, objectName, `${fileName.split('/').slice(0, -1).join('/')}/`, fileName.split('/').slice(-1)[0]);
		return await new Promise((resolve, reject) => {
			meshTask.onSuccess = (task) => {
				let newMesh = null;
				if (!settings.position) {
					settings.position = { x: 0, y: 0, z: 0 };
				}
				if (task.loadedMeshes.length === 1) {
					newMesh = this.#addMesh(applySettings(controlData, task.loadedMeshes[0], settings));
				} else {
					const mesh = new babylon.Mesh(name, controlData.scene);
					task.loadedMeshes.forEach((loadedMesh) => {
						loadedMesh.renderingGroupId = 1;
						loadedMesh.addChild(loadedMesh);
					});
					newMesh = this.#addMesh(applySettings(controlData, mesh, settings));
				}
				resolve(wrap(controlData, newMesh));
			};
			meshTask.onError = (task, message, pException) => {
				reject({ message, exception: pException });
			};
			controlData.assetsManager.load();
		});
	}

	set unitMultiplier(multiplier) { this.#privateData.multiplier = multiplier; }
	get unitMultiplier() { return this.#privateData.multiplier; }

	setBackgroundColor(red, green, blue) { this.#privateData.scene.clearColor = new babylon.Color3(red, green, blue); }
	setAmbientColor(red, green, blue) { this.#privateData.scene.ambientColor = new babylon.Color3(red, green, blue); }

	createSkyBox(skyBoxImageDirectory) {
		const controlData = this.#privateData;
		// using the "old" way of creating a sky box, because the helper function makes it very very slow
		const skyBox = babylon.MeshBuilder.CreateBox('skyBox', { size: 10000.0, sideOrientation: babylon.Mesh.BACKSIDE }, controlData.scene);
		const skyBoxMaterial = new babylon.StandardMaterial('skyBox', controlData.scene);
		skyBoxMaterial.backFaceCulling = true;
		skyBoxMaterial.reflectionTexture = new babylon.CubeTexture(skyBoxImageDirectory, controlData.scene);
		skyBoxMaterial.reflectionTexture.coordinatesMode = babylon.Texture.SKYBOX_MODE;
		skyBoxMaterial.diffuseColor = new babylon.Color3(0, 0, 0);
		skyBoxMaterial.specularColor = new babylon.Color3(0, 0, 0);
		skyBoxMaterial.disableLighting = true;
		skyBox.material = skyBoxMaterial;
		skyBox.infiniteDistance = true;
		skyBox.renderingGroupId = 0;
	}

	// basic objects
	addSphere(settings, name) { return wrap(this.#privateData, this.#addMesh(createSphere(this.#privateData, this.#addDefaultSettings(settings), name))); }
	addBox(settings, name) { return wrap(this.#privateData, this.#addMesh(createBox(this.#privateData, this.#addDefaultSettings(settings), name))); }
	addPlane(settings, name) { return wrap(this.#privateData, this.#addMesh(createPlane(this.#privateData, this.#addDefaultSettings(settings), name))); }
	addPolyLine(settings, name) { return wrap(this.#privateData, this.#addMesh(createPolyLine(this.#privateData, this.#addDefaultSettings(settings), name))); }
	addExtrudedPolygon(settings, name) { return wrap(this.#privateData, this.#addMesh(createExtrudedPolygon(this.#privateData, this.#addDefaultSettings(settings), name))); }
	addCylinder(settings, name) { return wrap(this.#privateData, this.#addMesh(createCylinder(this.#privateData, this.#addDefaultSettings(settings), name))); }
	addTube(settings, name) { return wrap(this.#privateData, this.#addMesh(createTube(this.#privateData, this.#addDefaultSettings(settings), name))); }
	// special objects
	addGround(settings, name) { return wrap(this.#privateData, createGround(this.#privateData, settings, name)); }
	// retrieval
	getObjectByNameOrPath(objectNameOrPath) { return wrap(this.#privateData, getMeshObject(this.#privateData, objectNameOrPath)); }

	createObjectInstance(objectNamePrefix, sourceName, copies, settings) {
		const controlData = this.#privateData;
		const mesh = controlData.meshes[sourceName];
		if (mesh) {
			copies = copies || 1;
			for (let index = 0; index < copies; index++) {
				const cloneName = objectNamePrefix + index;
				this.#addInstance(cloneName, createMeshInstance(mesh.createInstance, cloneName), settings);
			}
		}
		return (mesh) ? wrap(controlData, mesh) : null;
	}

	startRendering() {
		const controlData = this.#privateData;
		controlData.engine.runRenderLoop(() => { controlData.scene.render(); });
	}

	stopRendering() {
		this.#privateData.engine.stopRenderLoop();
	}

	addEnvironmentalLight(settings, name) {
		const controlData = this.#privateData;
		const light = new babylon.HemisphericLight(ensureName(name), new babylon.Vector3(settings.x || 0, settings.y || 0, settings.z || 0), controlData.scene);
		controlData.lights[light.name] = { light };
		this.setEnvironmentalLightColor(settings.color.ground, light.name);
		this.setLightColors(settings.color, light.name);
	}

	setEnvironmentalLightColor(color, name) {
		const light = this.#privateData.lights[name];
		if (light && light instanceof babylon.HemisphericLight) {
			Object.assign(light.light.groundColor, color);
		}
	}

	addDirectionalLight(settings, name) {
		const controlData = this.#privateData;
		const light = new babylon.DirectionalLight(ensureName(name), new babylon.Vector3(settings.x || 0, settings.y || 0, settings.z || 0), controlData.scene);
		controlData.lights[light.name] = { light };
		this.setLightColors(settings.color, light.name);
		if (settings.generateShadows) {
			controlData.lights[light.name].shadowGenerator = createShadowGenerator(light);
		}
	}

	addPointLight(settings, name) {
		const controlData = this.#privateData;
		const light = new babylon.PointLight(ensureName(name), new babylon.Vector3(settings.x * this.unitMultiplier || 0, settings.y * this.unitMultiplier || 0, settings.z * this.unitMultiplier || 0), controlData.scene);
		controlData.lights[light.name] = { light };
		this.setLightColors(settings.color, light.name);
		if (settings.generateShadows) {
			controlData.lights[light.name].shadowGenerator = createShadowGenerator(light);
		}
	}

	addSpotLight(settings, name) {
		const controlData = this.#privateData;
		const light = new babylon.SpotLight(ensureName(name), new babylon.Vector3(settings.x * this.unitMultiplier || 0, settings.y * this.unitMultiplier || 0, settings.z * this.unitMultiplier || 0), new babylon.Vector3(settings.direction.x || 0, settings.direction.y || 0, settings.direction.z || 0), settings.angle || 0, (settings.reach || 100) * this.unitMultiplier, controlData.scene);
		controlData.lights[light.name] = { light };
		this.setLightColors(settings.color, light.name);
		if (settings.generateShadows) {
			controlData.lights[light.name].shadowGenerator = createShadowGenerator(light);
		}
	}

	removeLight(name) {
		const controlData = this.#privateData;
		controlData.lights[name].light.dispose();
		delete controlData.lights[name];
	}

	setLightColors(colors, name) {
		const light = this.#privateData.lights[name];
		if (light) {
			if (colors.diffuse) {
				Object.assign(light.light.diffuse, colors.diffuse);
			}
			if (colors.specular) {
				Object.assign(light.light.specular, colors.specular);
			}
		}
	}

	setObjectPosition(object, position) {
		const mesh = getMeshObject(this.#privateData, object);
		if (mesh) {
			setPosition(mesh, position, this.unitMultiplier);
		}
	}

	setObjectRotation(object, rotation) {
		const mesh = getMeshObject(this.#privateData, object);
		if (mesh) {
			setRotation(mesh, rotation);
		}
	}

	setObjectScale(object, scale) {
		const mesh = getMeshObject(this.#privateData, object);
		if (mesh) {
			setScale(mesh, scale);
		}
	}

	setCameraTarget(object) {
		const controlData = this.#privateData;
		const mesh = getMeshObject(controlData, object);
		if (mesh) {
			controlData.camera.lockedTarget = mesh;
		}
	}

	addMaterial(materialName, settings) { return addMaterial(this.#privateData, materialName, settings); }

	setObjectMaterial(objects, objMaterial) {
		const controlData = this.#privateData;
		if (typeof objMaterial === 'string') {
			const meshNames = Array.isArray(objects) ? objects : [objects];
			meshNames.forEach((meshName) => {
				const mesh = getMeshObject(controlData, meshName);
				const material = controlData.materials[objMaterial];
				if (mesh && material) {
					mesh.material = material;
				}
			});
		}
	}

	setGravity(settings) {
		Object.assign(this.#privateData.scene.gravity, settings);
	}

	set defaultShadows(shadows) { this.#privateData.defaultShadows = shadows; }
	get defaultShadows() { return this.#privateData.defaultShadows; }

	set cameraGravity(gravity) { this.#privateData.camera.applyGravity = gravity; }
	get cameraGravity() { return this.#privateData.camera.applyGravity; }

	set cameraCollisions(collisions) { this.#privateData.camera.checkCollisions = collisions; }
	get cameraCollisions() { return this.#privateData.camera.checkCollisions; }

	setObjectVisibility(object, visible) {
		const mesh = getMeshObject(this.#privateData, object);
		if (mesh) {
			applyRecursive(mesh, 'isVisible', visible || false);
		}
	}

	isObjectVisible(obj) {
		const controlData = this.#privateData;
		const mesh = getMeshObject(controlData, obj);
		return (mesh) ? mesh.isVisible : undefined;
	}

	setVirtualBody(settings) {
		const controlData = this.#privateData;
		if (controlData.camera) {
			if (controlData.camera instanceof babylon.ArcRotateCamera) {
				Object.assign(controlData.camera.collisionRadius, multiplyVector(settings.bodySize || {}, this.unitMultiplier));
			} else {
				Object.assign(controlData.camera.ellipsoid, multiplyVector(settings.bodySize || {}, this.unitMultiplier));
				Object.assign(controlData.camera.ellipsoidOffset, multiplyVector(settings.eyeOffset || {}, this.unitMultiplier));
			}
		} else {
			throw new Error('make sure to set a camera before calling this function');
		}
	}

	enableAllObjectCollisions(excluded) {
		const controlData = this.#privateData;
		controlData.allObjectCollisions = true;
		applyAllMeshes(controlData.meshes, excluded || [], 'checkCollisions', true);
		applyAllMeshes(controlData.instances, excluded || [], 'checkCollisions', true);
	}

	disableAllObjectCollisions(excluded) {
		const controlData = this.#privateData;
		controlData.allObjectCollisions = false;
		applyAllMeshes(controlData.meshes, excluded || [], 'checkCollisions', false);
		applyAllMeshes(controlData.instances, excluded || [], 'checkCollisions', false);
	}

	setCheckCollisionForObject(obj, enabled) {
		const controlData = this.#privateData;
		const mesh = getMeshObject(controlData, obj);
		if (mesh) {
			applyRecursive(mesh, 'checkCollisions', enabled);
		}
	}

	getCheckCollisionForObject(object) {
		const controlData = this.#privateData;
		const mesh = getMeshObject(controlData, object);
		return (mesh) ? mesh.checkCollisions : undefined;
	}

	setFog(enabled, settings) {
		const controlData = this.#privateData;
		// fog
		controlData.scene.fogEnabled = enabled;
		controlData.scene.fogMode = babylon.Scene.FOGMODE_EXP;
		if (settings.density) {
			controlData.scene.fogDensity = settings.density;
		}
		if (settings.color) {
			controlData.scene.fogColor = new babylon.Color3(settings.color.r, settings.color.g, settings.color.b);
		}
	}

	/**
	 * Set the camera to use
	 * @param {CAMERA_TYPES} type The type of camera to create
	 * @param {object} settings The settings for creating the camera
	 */
	setCamera(type, settings) {
		const controlData = this.#privateData;
		controlData.preventDefault = settings.preventDefault;
		settings = settings || {};
		if (controlData.camera) {
			controlData.camera.dispose();
		}
		switch (type) {
			case CAMERA_TYPES.ORBITAL: {
				// if no positions are specified, the camera will be positioned at a distance of 10 a longitude of 0 and a latitude of 45 degrees and point at 0, 0, 0
				const position = Object.assign({}, { longitude: 0, latitude: 45, distance: 10 }, settings.position);
				const target = Object.assign({}, { x: 0, y: 0, z: 0 }, settings.target || {});
				controlData.camera = new babylon[(settings.vrEnabled) ? 'VRDeviceOrientationArcRotateCamera' : 'ArcRotateCamera']('camera', toRadians(position.longitude), toRadians(position.latitude), position.distance * this.unitMultiplier, new babylon.Vector3(target.x * this.unitMultiplier, target.y * this.unitMultiplier, target.z * this.unitMultiplier), controlData.scene);
				controlData.camera.attachControl(this.$.canvas, !(controlData.preventDefault || false));
				if (settings.minLongitude) {
					controlData.camera.lowerAlphaLimit = toRadians(settings.minLongitude);
				}
				if (settings.maxLongitude) {
					controlData.camera.upperAlphaLimit = toRadians(settings.maxLongitude);
				}
				if (settings.minLatitude) {
					controlData.camera.lowerBetaLimit = toRadians(settings.minLatitude);
				}
				if (settings.maxLatitude) {
					controlData.camera.upperBetaLimit = toRadians(settings.maxLatitude);
				}
				if (settings.minDistance) {
					controlData.camera.lowerRadiusLimit = settings.minDistance * this.unitMultiplier;
				}
				if (settings.maxDistance) {
					controlData.camera.upperRadiusLimit = settings.maxDistance * this.unitMultiplier;
				}
				if (settings.targetMesh) {
					controlData.camera.lockedTarget = settings.targetMesh;
				}
				break;
			}
			case CAMERA_TYPES.FREE: {
				// if no positions are specified, the camera will be positioned at 0 0 -10 and will be pointing at 0, 0, 0
				const position = Object.assign({}, { x: 0, y: 0, z: -10 }, settings.position || {});
				const target = Object.assign({}, { x: 0, y: 0, z: 0 }, settings.target || {});
				controlData.camera = new babylon[(settings.vrEnabled) ? ((settings.mobile) ? 'VRDeviceOrientationFreeCamera' : 'WebVRFreeCamera') : 'UniversalCamera']('camera', new babylon.Vector3(position.x * this.unitMultiplier, position.y * this.unitMultiplier, position.z * this.unitMultiplier), controlData.scene, false);
				controlData.camera.attachControl(this.$.canvas, !(controlData.preventDefault || false));
				controlData.camera.setTarget(new babylon.Vector3(target.x * this.unitMultiplier, target.y * this.unitMultiplier, target.z * this.unitMultiplier));
				break;
			}
			case CAMERA_TYPES.FOLLOW: {
				const position = Object.assign({}, { x: 0, y: 0, z: -10 }, settings.position || {});
				// if no positions are specified, the camera will be positioned at 0 0 -10 and will be pointing at 0, 0, 0
				controlData.camera = new babylon.FollowCamera('camera', new babylon.Vector3(position.x * this.unitMultiplier, position.y * this.unitMultiplier, position.z * this.unitMultiplier), controlData.scene);
				controlData.camera.attachControl(this.$.canvas, !(controlData.preventDefault || false));
				if (settings.targetMesh) {
					controlData.camera.lockedTarget = settings.targetMesh;
				}
				const follow = Object.assign({}, {
					radius: controlData.camera.radius,
					heightAbove: controlData.camera.heightOffset,
					rotation: controlData.camera.rotationOffset,
					acceleration: controlData.camera.cameraAcceleration,
					maxSpeed: controlData.camera.maxCameraSpeed,
				}, multiplyObject(settings.follow, this.unitMultiplier, ['radius', 'heightAbove']));
				controlData.camera.radius = follow.radius;
				controlData.camera.heightOffset = follow.heightAbove;
				controlData.camera.rotationOffset = toRadians(follow.rotation);
				controlData.camera.cameraAcceleration = follow.acceleration;
				controlData.camera.maxCameraSpeed = follow.maxSpeed;
				break;
			}
			default:
				throw new Error(`Unknown camera type ${type}`);
		}
	}

	removeObject(obj) {
		const mesh = getMeshObject(this.#privateData, obj);
		if (mesh) {
			mesh.dispose();
		}
	}

	unGroupObject(obj) {
		const controlData = this.#privateData;
		const mesh = (typeof obj === 'string') ? controlData.meshes[obj] : unWrap(obj);
		const newObjects = [];
		const childMeshes = (mesh) ? mesh.getChildMeshes(true) : [];
		childMeshes.forEach((childMesh) => {
			mesh.removeChild(childMesh);
			newObjects.push(childMesh.name);
			controlData.meshes[childMesh.name] = childMesh;
		});
		return newObjects;
	}

	groupObjects(objectNames, newName) {
		const controlData = this.#privateData;
		const meshes = [];
		let newMesh = null;
		const refreshBoundingInfo = (mesh) => {
			const children = mesh.getChildren();
			let boundingInfo = children[0].getBoundingInfo();
			let min = boundingInfo.boundingBox.minimumWorld;
			let max = boundingInfo.boundingBox.maximumWorld;
			for (let index = 1; index < children.length; index++) {
				boundingInfo = children[index].getBoundingInfo();
				min = babylon.Vector3.Minimize(min, boundingInfo.boundingBox.minimumWorld);
				max = babylon.Vector3.Maximize(max, boundingInfo.boundingBox.maximumWorld);
			}
			mesh.setBoundingInfo(new babylon.BoundingInfo(min, max));
		};

		objectNames.forEach((name) => { const mesh = controlData.meshes[name]; if (mesh) { meshes.push(mesh); } });
		if (meshes.length) {
			newMesh = new babylon.Mesh(newName, controlData.scene);
			meshes.forEach((newChild) => { newMesh.addChild(newChild); delete controlData.meshes[newChild.name]; });
			controlData.meshes[newName] = newMesh;
			newMesh.computeWorldMatrix(true);
			refreshBoundingInfo(newMesh);
		}
		return (newMesh) ? newMesh.name : null;
	}

	selectObject(obj) {
		const controlData = this.#privateData;
		const mesh = getTopLevelMeshObject(controlData, obj);
		if (mesh) {
			const allMeshes = flattenMeshes(mesh);
			allMeshes.forEach((someMesh) => {
				someMesh.selected = true;
				someMesh.showBoundingBox = this.selectionBoundingBox;
				someMesh.notSelectMaterial = someMesh.material;
				if (someMesh.material && someMesh.material.hasOwnProperty('diffuseColor')) {
					someMesh.material = someMesh.material.clone('temp');
					someMesh.material.diffuseColor = controlData.materials['selected'].diffuseColor;
					someMesh.material.alpha = Math.max(0.5, someMesh.material.alpha);
				} else {
					someMesh.material = controlData.materials['selected'].clone();
				}
			});
		}
	}

	unSelectObject(objectName) {
		const controlData = this.#privateData;
		const mesh = getTopLevelMeshObject(controlData, objectName);
		if (mesh) {
			const allMeshes = flattenMeshes(mesh);
			allMeshes.forEach((someMesh) => {
				if (someMesh.selected) {
					someMesh.selected = false;
					someMesh.showBoundingBox = false;
					someMesh.material.dispose();
					someMesh.material = someMesh.notSelectMaterial;
					delete someMesh.notSelectMaterial;
				}
			});
		}
	}

	getSelectedObjects() {
		const controlData = this.#privateData;
		return Object.keys(controlData.meshes).filter((key) => getMeshObject(controlData, key).selected).concat(Object.keys(controlData.instances).filter((key) => getMeshObject(controlData, key).selected));
	}

	unSelectAll() {
		const controlData = this.#privateData;
		Object.keys(controlData.meshes).forEach((key) => this.unSelectObject(key));
		Object.keys(controlData.instances).forEach((key) => this.unSelectObject(key));
	}

	isObjectSelected(objectName) {
		const mesh = getMeshObject(this.#privateData, objectName);
		return mesh && mesh.selected;
	}

	set selectColor(color) { Object.assign(this.#privateData.materials['selected'].diffuseColor, color); }
	get selectColor() { const color = (this.#privateData.materials['selected'] || {}).diffuseColor; return { r: color.r || 1, g: color.g || 0, b: color.b || 0 }; }

	getDataUrl(type, quality) { return this.$.canvas.toDataURL(type || 'image/png', quality || undefined); }
	getBlob(callback, type, quality) { this.$.canvas.toBlob(callback, type || 'image/png', quality || undefined); }

	attached() {
		const controlData = this.#privateData;
		// create the engine
		controlData.engine = new babylon.Engine(this.$.canvas, true, { preserveDrawingBuffer: true, stencil: true });
		const createScene = () => {
			// Create a Scene object
			controlData.scene = new babylon.Scene(controlData.engine);
			controlData.scene.collisionsEnabled = true;
			controlData.scene.workerCollisions = true; // use web workers for collisions

			this.addMaterial('selected', { diffuse: { r: 1, g: 0, b: 0 } });

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

		controlData.scene.onPointerObservable.add((event) => {
			if (event.pickInfo.hit) {
				if (this.onObjectClicked) {
					const path = [event.pickInfo.pickedMesh.name];
					let parent = event.pickInfo.pickedMesh.parent;
					while (parent) {
						path.unshift(parent.name);
						parent = parent.parent;
					}
					this.onObjectClicked({
						distance: event.pickInfo.distance / this.unitMultiplier,
						object: event.pickInfo.pickedMesh.name,
						mainObject: path[0],
						parent: path[path.length - 2] || null,
						path,
						location: { x: event.pickInfo.pickedPoint.x / this.unitMultiplier, y: event.pickInfo.pickedPoint.y / this.unitMultiplier, z: event.pickInfo.pickedPoint.z / this.unitMultiplier },
					});
				}
			}
		}, babylon.PointerEventTypes.POINTERPICK);

		const resizeDetector = this.$.resizeDetector;
		resizeDetector.addObserver(() => {
			controlData.engine.resize();
		}, this);

		// attach all extensions now
		controlData.extensions.forEach((extensionObject) => this.#attachExtension(extensionObject));
	}

	detached() {
		const controlData = this.#privateData;
		this.stopRendering();
		controlData.scene.dispose();
		controlData.engine.dispose();

		controlData.lights = {};
		controlData.meshes = {};
		controlData.instances = {};
		controlData.materials = {};
		controlData.assetsManager = null;
		controlData.engine = null;
		controlData.scene = null;
		controlData.extensions = [];
	}

	#handleLoadingScreenChange() {
		const controlData = this.#privateData;
		if (controlData.assetsManager) {
			controlData.assetsManager.useDefaultLoadingScreen = this.loadingScreen;
		}
	}

	#handleSelectionBoundingBoxChange() {
		const controlData = this.#privateData;
		const updateBoundingBox = (key) => {
			const mesh = getMeshObject(controlData, key);
			if (mesh.selected) {
				mesh.showBoundingBox = this.selectionBoundingBox;
			}
		};
		Object.keys(controlData.meshes).forEach(updateBoundingBox);
		Object.keys(controlData.instances).forEach(updateBoundingBox);
	}

	#attachExtension(extensionObject) {
		const controlData = this.#privateData;
		extensionObject.attach(this, {
			// get a mesh object from the main store
			getObject(objectNameOrPath) { return wrap(controlData, getTopLevelMeshObject(controlData, objectNameOrPath)); },
			// object creation
			createGroup(name) { return wrapGroup(controlData, new babylon.Mesh(ensureName(name), controlData.scene)); },
			createSphere(settings, name) { return wrap(controlData, createSphere(controlData, settings, name)); },
			createBox(settings, name) { return wrap(controlData, createBox(controlData, settings, name)); },
			createPlane(settings, name) { return wrap(controlData, createPlane(controlData, settings, name)); },
			createPolyLine(settings, name) { return wrap(controlData, createPolyLine(controlData, settings, name)); },
			createExtrudedPolygon(settings, name) { return wrap(controlData, createExtrudedPolygon(controlData, settings, name)); },
			createCylinder(settings, name) { return wrap(controlData, createCylinder(controlData, settings, name)); },
			createTube(settings, name) { return wrap(controlData, createTube(controlData, settings, name)); },
			// settings
			applySettings(settings, obj) { applySettings(controlData, unWrap(obj), settings); },
			// event handling
			addPointerDownListener(callback) { addPointerDownListener(controlData, callback); },
			addPointerUpListener(callback) { addPointerUpListener(controlData, callback); },
			addPointerMoveListener(callback) { addPointerMoveListener(controlData, callback); },
			addPointerClickListener(callback) { addPointerClickListener(controlData, callback); },
			// utility
			screenToObjectPoint(screenPoint, wrapped) { return screenToObjectPoint(controlData, screenPoint, unWrap(wrapped)); },
			pointToScreenPoint(point) { const tmpPoint = pointToScreenPoint(controlData, point); return { x: tmpPoint.x, y: tmpPoint.y }; },
			screenPointToBoundingProjection(screenPoint, wrapped) { return screenPointToBoundingProjection(controlData, screenPoint, unWrap(wrapped)); },
			get pointerPos() { return { x: controlData.scene.pointerX, y: controlData.scene.pointerY }; },
			// camera
			detachCameraControl: () => { controlData.camera.detachControl(this.$.canvas); },
			attachCameraControl: () => { controlData.camera.attachControl(this.$.canvas, !(controlData.preventDefault || false)); },
		});
	}
	#addDefaultSettings(settings) {
		const controlData = this.#privateData;
		return Object.assign({
			collisions: controlData.allObjectCollisions,
			shadows: this.defaultShadows,
		}, settings);
	}

	#addMesh(meshObject) {
		if (meshObject) {
			const controlData = this.#privateData;
			controlData.meshes[meshObject.name] = meshObject;

			Object.keys(controlData.lights).forEach((key) => {
				if (controlData.lights[key].shadowGenerator) {
					controlData.lights[key].shadowGenerator.recreateShadowMap();
				}
			});
		}
		return meshObject;
	}

	#addInstance(name, meshObject, settings) {
		const controlData = this.#privateData;
		settings = settings || {};
		if (meshObject) {
			if (settings.position) {
				setPosition(meshObject, settings.position, this.unitMultiplier);
			}
			if (settings.rotation) {
				setRotation(meshObject, settings.rotation);
			}
			if (settings.scale) {
				setScale(meshObject, settings.scale);
			}
			if (settings.visible !== undefined) {
				meshObject.isVisible = settings.visible;
			}
			// do shadows either if explicit shadows option is set to true in the settings or when defaultShadows is set to true and the shadows property is undefined
			if (settings.shadows || (this.defaultShadows && settings.shadows === undefined)) {
				addShadowCaster(controlData, meshObject);
			}
			applyRecursive(meshObject, 'checkCollisions', (settings.collisions === undefined) ? controlData.allObjectCollisions : settings.collisions);
			controlData.instances[name] = meshObject;
		}
	}

	static get template() {
		return `
			<script src="/third_party/earcut/dist/earcut.dev.js"></script>
			<script src="/third_party/babylonjs/babylon.max.js"></script>
			<script src="/third_party/babylonjs-loaders/babylonjs.loaders.js"></script>
			<style>
				:host {
					display: block;
					position: relative;
				}
		
				#main,
					#canvas {
					position: relative;
					width: 100%;
					height: 100%;
				}
			</style>
			<div id="main">
				<vicowa-resize-detector id="resize-detector"></vicowa-resize-detector>
				<canvas id="canvas"></canvas>
			</div>
		`;
	}
}

window.customElements.define('vicowa-webgl', VicowaWebgl);
