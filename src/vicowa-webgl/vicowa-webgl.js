/* eslint new-cap: ["off"] */
/* switching this off for this file because babylon uses almost all uppercase starting function names */
import { webComponentBaseClass } from "../third_party/web-component-base-class/src/webComponentBaseClass.js";
import { CAMERA_TYPES, CAP_TYPES } from "./vicowa-webgl-definitions.js";
import { toDegrees, toRadians } from "../utilities/mathHelpers.js";
import debug from "../utilities/debug.js";

const privateData = Symbol["privateData"];
const meshContainer = Symbol("meshContainer");
const wrapReference = Symbol("wrapReference");
const originalDispose = Symbol("originalDispose");

function unWrap(p_Wrapped) { return p_Wrapped[meshContainer]; }

const babylon = window.BABYLON;
const componentName = "vicowa-webgl";

let nameID = 0;
// validate the name or create a name when none is specified
function ensureName(p_Name) {
	debug.assert(!p_Name || !/--/.test(p_Name), "names containing a double dash '--' are reserved for internal use only");
	return (!p_Name) ? `objectID--${++nameID}` : p_Name;
}

function handleLoadingScreenChange(p_WebGLControl) {
	const controlData = p_WebGLControl[privateData];
	if (controlData.assetsManager) {
		controlData.assetsManager.useDefaultLoadingScreen = p_WebGLControl.loadingScreen;
	}
}

function multiplyObject(p_Object, p_Multiplier, p_KeysToMultiply) {
	Object.keys(p_Object).filter((p_Key) => p_KeysToMultiply.includes(p_Key)).forEach((p_Key) => { p_Object[p_Key] = (p_Object[p_Key] || 0) * p_Multiplier; });
	return p_Object;
}

function multiplyVector(p_Vector, p_Multiplier) { return multiplyObject(p_Vector, p_Multiplier, ["x", "y", "z"]); }
function convertToVectorObject(p_Vector) { return (Array.isArray(p_Vector)) ? { x: p_Vector[0], y: p_Vector[1], z: p_Vector[2] } : p_Vector; }
function convertToVector3(p_Vector) { return new babylon.Vector3(p_Vector.x, p_Vector.y, p_Vector.z); }
function flattenMeshes(p_Mesh) { return [p_Mesh].concat(p_Mesh.getChildMeshes(false)); }

function getMeshObject(p_ControlData, p_MeshNamePathOrObject) {
	let mesh = null;
	if (Array.isArray(p_MeshNamePathOrObject)) {
		// this is a path to the mesh, maybe because we clicked a child mesh
		mesh = p_ControlData.meshes[p_MeshNamePathOrObject[0]] || p_ControlData.instances[p_MeshNamePathOrObject[0]];
		p_MeshNamePathOrObject.slice(1).forEach((p_Name) => {
			if (mesh) {
				mesh = mesh.getChildMeshes(true, (p_ChildMesh) => p_ChildMesh.name === p_Name)[0];
			}
		});
	} else if (typeof p_MeshNamePathOrObject === "string") {
		mesh = p_ControlData.meshes[p_MeshNamePathOrObject] || p_ControlData.instances[p_MeshNamePathOrObject];
	} else {
		mesh = unWrap(p_MeshNamePathOrObject);
	}
	return mesh;
}

function applyRecursive(p_Mesh, p_PropertyName, p_PropertyValue) {
	p_Mesh[p_PropertyName] = p_PropertyValue;
	p_Mesh.getChildMeshes(false).forEach((p_Child) => { p_Child[p_PropertyName] = p_PropertyValue; });
}

function createShadowGenerator(p_Light) {
	const shadowGenerator = new babylon.ShadowGenerator(1024, p_Light);
	shadowGenerator.getShadowMap().refreshRate = babylon.RenderTargetTexture.REFRESHRATE_RENDER_ONCE;
	shadowGenerator.bias = 0.0001;
	shadowGenerator.forceBackFacesOnly = true;
	shadowGenerator.normalBias = 0.02;
	p_Light.shadowMaxZ = 1000;
	p_Light.shadowMinZ = -1000;
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

function applyAllMeshes(p_Meshes, p_ExcludedNames, p_PropertyName, p_PropertyValue) {
	Object.keys(p_Meshes).forEach((p_Key) => { if (!p_ExcludedNames.includes(p_Key)) { applyRecursive(p_Meshes[p_Key], p_PropertyName, p_PropertyValue); } });
}

function setPosition(p_Mesh, p_Position, p_UnitMultiplier) {
	Object.assign(p_Mesh.position, multiplyVector(p_Position, p_UnitMultiplier));
}

function setRotation(p_Mesh, p_Rotation) {
	p_Mesh.rotation.x = (p_Rotation.x !== undefined) ? toRadians(p_Rotation.x) : p_Mesh.rotation.x;
	p_Mesh.rotation.y = (p_Rotation.y !== undefined) ? toRadians(p_Rotation.y) : p_Mesh.rotation.y;
	p_Mesh.rotation.z = (p_Rotation.z !== undefined) ? toRadians(p_Rotation.z) : p_Mesh.rotation.z;
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
	if (p_MeshObject && p_Settings) {
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
		if (p_Settings.collisions !== undefined) {
			applyRecursive(p_MeshObject, "checkCollisions", p_Settings.collisions);
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
		p_MeshObject.renderingGroupId = (p_Settings.renderingGroupId === undefined) ? p_MeshObject.renderingGroupId || 1 : p_Settings.renderingGroupId;
		p_MeshObject.outline = (p_Settings.outline === undefined) ? p_MeshObject.outline : p_Settings.outline;

		// do shadows
		if (p_Settings.shadows !== undefined) {
			if (p_Settings.shadows) {
				addShadowCaster(p_ControlData, p_MeshObject);
				p_MeshObject.receiveShadows = true;
			}
		}
	}

	return p_MeshObject;
}

function addMesh(p_WebGLControl, p_MeshObject) {
	if (p_MeshObject) {
		const controlData = p_WebGLControl[privateData];
		controlData.meshes[p_MeshObject.name] = p_MeshObject;

		Object.keys(controlData.lights).forEach((p_Key) => {
			if (controlData.lights[p_Key].shadowGenerator) {
				controlData.lights[p_Key].shadowGenerator.recreateShadowMap();
			}
		});
	}
	return p_MeshObject;
}

function addInstance(p_WebGLControl, p_Name, p_MeshObject, p_Settings) {
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
		if (p_Settings.shadows || (p_WebGLControl.defaultShadows && p_Settings.shadows === undefined)) {
			addShadowCaster(controlData, p_MeshObject);
		}
		applyRecursive(p_MeshObject, "checkCollisions", (p_Settings.collisions === undefined) ? controlData.allObjectCollisions : p_Settings.collisions);
		controlData.instances[p_Name] = p_MeshObject;
	}
}

function handleSelectionBoundingBoxChange(p_WebGLControl) {
	const controlData = p_WebGLControl[privateData];
	const updateBoundingBox = (p_Key) => {
		const mesh = getMeshObject(controlData, p_Key);
		if (mesh.selected) {
			mesh.showBoundingBox = p_WebGLControl.selectionBoundingBox;
		}
	};
	Object.keys(controlData.meshes).forEach(updateBoundingBox);
	Object.keys(controlData.instances).forEach(updateBoundingBox);
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

function createPolyLine(p_ControlData, p_Settings, p_Name) {
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

const capConvert = {};
capConvert[CAP_TYPES.NO_CAP] = babylon.Mesh.NO_CAP;
capConvert[CAP_TYPES.CAP_START] = babylon.Mesh.CAP_START;
capConvert[CAP_TYPES.CAP_END] = babylon.Mesh.CAP_END;
capConvert[CAP_TYPES.CAP_ALL] = babylon.Mesh.CAP_ALL;

function createTube(p_ControlData, p_Settings, p_Name) {
	const path = (p_Settings.path || []).map((p_Point) => convertToVector3(multiplyVector(convertToVectorObject(p_Point), p_ControlData.multiplier)));
	return (path.length) ? applySettings(p_ControlData, babylon.MeshBuilder.CreateTube(ensureName(p_Name), {
		path,
		radius: (p_Settings.radius || 1) * p_ControlData.multiplier,
		tessellation: p_Settings.segments || 16,
		arc: p_Settings.arc || 1,
		cap: capConvert[p_Settings.cap] || babylon.Mesh.NO_CAP,
	}, p_ControlData.scene), p_Settings) : null;
}

function createGround(p_ControlData, p_Settings, p_Name) {
	const settings = Object.assign({}, p_Settings, { shadows: false, collisions: false });
	const ground = applySettings(p_ControlData, babylon.MeshBuilder.CreateGround(ensureName(p_Name), { width: (settings.width || 1) * p_ControlData.multiplier, height: (settings.height || 1) * p_ControlData.multiplier, subdivisions: settings.subdivisions || 1 }, p_ControlData.scene), settings);
	p_ControlData.meshes[ground.name] = ground;
	ground.receiveShadows = true;
	ground.checkCollisions = p_ControlData.allObjectCollisions;
}

function wrap(p_ControlData, p_Mesh) {
	let wrapped = p_Mesh ? p_Mesh[wrapReference] : null;
	if (!wrapped && p_Mesh) {
		wrapped = {
			get visible() { return this[meshContainer].isVisible; },
			set visible(p_Visible) { applyRecursive(this[meshContainer], "isVisible", p_Visible); },
			get parent() { return wrap(p_ControlData, this[meshContainer].parent); },
			get center() { const bounding = this[meshContainer].getBoundingInfo(); const center = (bounding && bounding.boundingBox) ? bounding.boundingBox.centerWorld : null; return { x: center.x / p_ControlData.multiplier, y: center.y / p_ControlData.multiplier, z: center.z / p_ControlData.multiplier }; },
			get maximum() { const bounding = this[meshContainer].getBoundingInfo(); const maximum = (bounding && bounding.boundingBox) ? bounding.boundingBox.maximumWorld : null; return { x: maximum.x / p_ControlData.multiplier, y: maximum.y / p_ControlData.multiplier, z: maximum.z / p_ControlData.multiplier }; },
			get minimum() { const bounding = this[meshContainer].getBoundingInfo(); const minimum = (bounding && bounding.boundingBox) ? bounding.boundingBox.minimumWorld : null; return { x: minimum.x / p_ControlData.multiplier, y: minimum.y / p_ControlData.multiplier, z: minimum.z / p_ControlData.multiplier }; },
			get boundingVectors() { const bounding = this[meshContainer].getBoundingInfo(); return (bounding && bounding.boundingBox) ? bounding.boundingBox.vectorsWorld.map((p_Vector) => ({ x: p_Vector.x / p_ControlData.multiplier, y: p_Vector.y / p_ControlData.multiplier, z: p_Vector.z / p_ControlData.multiplier })) : null; },
			get name() { return this[meshContainer].name; },
			get position() { return { x: this[meshContainer].position.x / p_ControlData.multiplier, y: this[meshContainer].position.y / p_ControlData.multiplier, z: this[meshContainer].position.z / p_ControlData.multiplier }; },
			set position(p_Position) { setPosition(this[meshContainer], p_Position, p_ControlData.multiplier); },
			get scale() { return { x: this[meshContainer].scaling.x, y: this[meshContainer].scaling.y, z: this[meshContainer].scaling.z }; },
			set scale(p_Scaling) { setScale(this[meshContainer], p_Scaling); },
			get rotation() { return { x: toDegrees(this[meshContainer].rotation.x), y: toDegrees(this[meshContainer].rotation.y), z: toDegrees(this[meshContainer].rotation.z) }; },
			set rotation(p_Rotation) { setRotation(this[meshContainer], p_Rotation); },
			clone(p_Name) { return wrap(p_ControlData, this[meshContainer].clone(ensureName(p_Name))); },
			updateCoordinates() { this[meshContainer].computeWorldMatrix(true); },
			remove() { this[meshContainer].dispose(); },
			applySettings(p_Settings) { applySettings(p_ControlData, this[meshContainer], p_Settings); },
			offset(p_Offset) { this[meshContainer].position.addInPlace({ x: p_Offset.x * p_ControlData.multiplier, y: p_Offset.y * p_ControlData.multiplier, z: p_Offset.z * p_ControlData.multiplier }); },
			isRemoved() { return this[meshContainer] === undefined; },
		};
		wrapped[meshContainer] = p_Mesh;
		p_Mesh[wrapReference] = wrapped;
		p_Mesh[originalDispose] = p_Mesh.dispose;
		p_Mesh.dispose = function() {
			if (this[wrapReference].onRemove) {
				this[wrapReference].onRemove(this[wrapReference]);
			}

			delete p_ControlData.meshes[this.name];
			delete p_ControlData.instances[this.name];
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
		hitObject: (p_Event.pickInfo.hit) ? wrap(p_ControlData, p_Event.pickInfo.pickedMesh) : null,
	};
}

function addPointerDownListener(p_ControlData, p_Callback) { p_ControlData.scene.onPointerObservable.add((p_Event) => { p_Callback(wrapEvent(p_ControlData, p_Event)); }, babylon.PointerEventTypes.POINTERDOWN); }
function addPointerUpListener(p_ControlData, p_Callback) { p_ControlData.scene.onPointerObservable.add((p_Event) => { p_Callback(wrapEvent(p_ControlData, p_Event)); }, babylon.PointerEventTypes.POINTERUP); }
function addPointerMoveListener(p_ControlData, p_Callback) { p_ControlData.scene.onPointerObservable.add((p_Event) => { p_Callback(wrapEvent(p_ControlData, p_Event)); }, babylon.PointerEventTypes.POINTERMOVE); }
function addPointerClickListener(p_ControlData, p_Callback) { p_ControlData.scene.onPointerObservable.add((p_Event) => { p_Callback(wrapEvent(p_ControlData, p_Event)); }, babylon.PointerEventTypes.POINTERPICK); }

function screenToObjectPoint(p_ControlData, p_Position, p_Mesh) {
	const pickInfo = p_ControlData.scene.pick(p_Position.x, p_Position.y, (p_TestMesh) => p_Mesh === p_TestMesh);
	return (pickInfo.hit) ? { x: pickInfo.pickedPoint.x / p_ControlData.multiplier, y: pickInfo.pickedPoint.y / p_ControlData.multiplier, z: pickInfo.pickedPoint.z / p_ControlData.multiplier } : null;
}

function pointToScreenPoint(p_ControlData, p_Point) {
	return babylon.Vector3.Project(new babylon.Vector3(p_Point.x * p_ControlData.multiplier, p_Point.y * p_ControlData.multiplier, p_Point.z * p_ControlData.multiplier), babylon.Matrix.Identity(), p_ControlData.scene.getTransformMatrix(), p_ControlData.camera.viewport.toGlobal(p_ControlData.engine));
}

function createScreenToObjectPointVectorPair(p_ControlData, p_Point, p_Mesh) {
	const ray = p_ControlData.scene.createPickingRay(p_Point.x, p_Point.y, babylon.Matrix.Identity(), p_ControlData.camera, false);
	return { start: { x: ray.origin.x / p_ControlData.multiplier, y: ray.origin.y / p_ControlData.multiplier, z: ray.origin.z / p_ControlData.multiplier }, intersection: screenToObjectPoint(p_ControlData, p_Point, p_Mesh) };
}

function attachExtension(p_WebGLControl, p_ExtensionObject) {
	const controlData = p_WebGLControl[privateData];
	p_ExtensionObject.attach(p_WebGLControl, {
		// get a named object
		getObject(p_ObjectNameOrPath) { return wrap(controlData, getMeshObject(controlData, p_ObjectNameOrPath)); },
		// object creation
		createGroup(p_Name) { return wrapGroup(controlData, new babylon.Mesh(ensureName(p_Name), controlData.scene)); },
		createSphere(p_Settings, p_Name) { return wrap(controlData, createSphere(controlData, p_Settings, p_Name)); },
		createBox(p_Settings, p_Name) { return wrap(controlData, createBox(controlData, p_Settings, p_Name)); },
		createPlane(p_Settings, p_Name) { return wrap(controlData, createPlane(controlData, p_Settings, p_Name)); },
		createPolyLine(p_Settings, p_Name) { return wrap(controlData, createPolyLine(controlData, p_Settings, p_Name)); },
		createExtrudedPolygon(p_Settings, p_Name) { return wrap(controlData, createExtrudedPolygon(controlData, p_Settings, p_Name)); },
		createCylinder(p_Settings, p_Name) { return wrap(controlData, createCylinder(controlData, p_Settings, p_Name)); },
		createTube(p_Settings, p_Name) { return wrap(controlData, createTube(controlData, p_Settings, p_Name)); },
		// settings
		applySettings(p_Settings, p_Object) { applySettings(controlData, unWrap(p_Object), p_Settings); },
		// event handling
		addPointerDownListener(p_Callback) { addPointerDownListener(controlData, p_Callback); },
		addPointerUpListener(p_Callback) { addPointerUpListener(controlData, p_Callback); },
		addPointerMoveListener(p_Callback) { addPointerMoveListener(controlData, p_Callback); },
		addPointerClickListener(p_Callback) { addPointerClickListener(controlData, p_Callback); },
		// utility
		screenToObjectPoint(p_ScreenPoint, p_Wrapped) { return screenToObjectPoint(controlData, p_ScreenPoint, unWrap(p_Wrapped)); },
		pointToScreenPoint(p_Point) { const point = pointToScreenPoint(controlData, p_Point); return { x: point.x, y: point.y }; },
		createScreenToObjectPointVectorPair(p_ScreenPoint, p_Wrapped) { return createScreenToObjectPointVectorPair(controlData, p_ScreenPoint, unWrap(p_Wrapped)); },
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
			instances: {},
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

	async addObjectResource(p_Name, p_ObjectName, p_FileName, p_Settings) {
		const controlData = this[privateData];
		const meshTask = controlData.assetsManager.addMeshTask(p_Name, p_ObjectName, `${p_FileName.split("/").slice(0, -1).join("/")}/`, p_FileName.split("/").slice(-1)[0]);
		return await new Promise((resolve, reject) => {
			meshTask.onSuccess = (task) => {
				let newMesh = null;
				if (!p_Settings.position) {
					p_Settings.position = { x: 0, y: 0, z: 0 };
				}
				if (task.loadedMeshes.length === 1) {
					newMesh = addMesh(this, applySettings(controlData, task.loadedMeshes[0], p_Settings));
				} else {
					const mesh = new babylon.Mesh(p_Name, controlData.scene);
					task.loadedMeshes.forEach((p_Mesh) => {
						p_Mesh.renderingGroupId = 1;
						mesh.addChild(p_Mesh);
					});
					newMesh = addMesh(this, applySettings(controlData, mesh, p_Settings));
				}
				resolve(wrap(controlData, newMesh));
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
		// using the "old" way of creating a sky box, because the helper function makes it very very slow
		const skyBox = babylon.MeshBuilder.CreateBox("skyBox", { size: 10000.0, sideOrientation: babylon.Mesh.BACKSIDE }, controlData.scene);
		const skyBoxMaterial = new babylon.StandardMaterial("skyBox", controlData.scene);
		skyBoxMaterial.backFaceCulling = true;
		skyBoxMaterial.reflectionTexture = new babylon.CubeTexture(p_SkyBoxImageDirectory, controlData.scene);
		skyBoxMaterial.reflectionTexture.coordinatesMode = babylon.Texture.SKYBOX_MODE;
		skyBoxMaterial.diffuseColor = new babylon.Color3(0, 0, 0);
		skyBoxMaterial.specularColor = new babylon.Color3(0, 0, 0);
		skyBoxMaterial.disableLighting = true;
		skyBox.material = skyBoxMaterial;
		skyBox.infiniteDistance = true;
		skyBox.renderingGroupId = 0;
	}

	// basic objects
	addSphere(p_Settings, p_Name) { return wrap(this[privateData], addMesh(this, createSphere(this[privateData], addDefaultSettings(this, p_Settings), p_Name))); }
	addBox(p_Settings, p_Name) { return wrap(this[privateData], addMesh(this, createBox(this[privateData], addDefaultSettings(this, p_Settings), p_Name))); }
	addPlane(p_Settings, p_Name) { return wrap(this[privateData], addMesh(this, createPlane(this[privateData], addDefaultSettings(this, p_Settings), p_Name))); }
	addPolyLine(p_Settings, p_Name) { return wrap(this[privateData], addMesh(this, createPolyLine(this[privateData], addDefaultSettings(this, p_Settings), p_Name))); }
	addExtrudedPolygon(p_Settings, p_Name) { return wrap(this[privateData], addMesh(this, createExtrudedPolygon(this[privateData], addDefaultSettings(this, p_Settings), p_Name))); }
	addCylinder(p_Settings, p_Name) { return wrap(this[privateData], addMesh(this, createCylinder(this[privateData], addDefaultSettings(this, p_Settings), p_Name))); }
	addTube(p_Settings, p_Name) { return wrap(this[privateData], addMesh(this, createTube(this[privateData], addDefaultSettings(this, p_Settings), p_Name))); }
	// special objects
	addGround(p_Settings, p_Name) { return wrap(this[privateData], createGround(this[privateData], p_Settings, p_Name)); }
	// retrieval
	getObjectByNameOrPath(p_ObjectNameOrPath) { return wrap(this[privateData], getMeshObject(this[privateData], p_ObjectNameOrPath)); }

	createObjectInstance(p_ObjectNamePrefix, p_SourceName, p_Copies, p_Settings) {
		const controlData = this[privateData];
		const mesh = controlData.meshes[p_SourceName];
		if (mesh) {
			const copies = p_Copies || 1;
			for (let index = 0; index < copies; index++) {
				const cloneName = p_ObjectNamePrefix + index;
				addInstance(this, cloneName, createMeshInstance(mesh.createInstance, cloneName), p_Settings);
			}
		}
		return (mesh) ? wrap(controlData, mesh) : null;
	}

	startRendering() {
		const controlData = this[privateData];
		controlData.engine.runRenderLoop(() => { controlData.scene.render(); });
	}

	stopRendering() {
		this[privateData].engine.stopRenderLoop();
	}

	addEnvironmentalLight(p_Settings, p_Name) {
		const controlData = this[privateData];
		const light = new babylon.HemisphericLight(ensureName(p_Name), new babylon.Vector3(p_Settings.x || 0, p_Settings.y || 0, p_Settings.z || 0), controlData.scene);
		controlData.lights[light.name] = { light };
		this.setEnvironmentalLightColor(p_Settings.color.ground, light.name);
		this.setLightColors(p_Settings.color, light.name);
	}

	setEnvironmentalLightColor(p_Color, p_Name) {
		const light = this[privateData].lights[p_Name];
		if (light && light instanceof babylon.HemisphericLight) {
			Object.assign(light.light.groundColor, p_Color);
		}
	}

	addDirectionalLight(p_Settings, p_Name) {
		const controlData = this[privateData];
		const light = new babylon.DirectionalLight(ensureName(p_Name), new babylon.Vector3(p_Settings.x || 0, p_Settings.y || 0, p_Settings.z || 0), controlData.scene);
		controlData.lights[light.name] = { light };
		this.setLightColors(p_Settings.color, light.name);
		if (p_Settings.generateShadows) {
			controlData.lights[light.name].shadowGenerator = createShadowGenerator(light);
		}
	}

	addPointLight(p_Settings, p_Name) {
		const controlData = this[privateData];
		const light = new babylon.PointLight(ensureName(p_Name), new babylon.Vector3(p_Settings.x * this.unitMultiplier || 0, p_Settings.y * this.unitMultiplier || 0, p_Settings.z * this.unitMultiplier || 0), controlData.scene);
		controlData.lights[light.name] = { light };
		this.setLightColors(p_Settings.color, light.name);
		if (p_Settings.generateShadows) {
			controlData.lights[light.name].shadowGenerator = createShadowGenerator(light);
		}
	}

	addSpotLight(p_Settings, p_Name) {
		const controlData = this[privateData];
		const light = new babylon.SpotLight(ensureName(p_Name), new babylon.Vector3(p_Settings.x * this.unitMultiplier || 0, p_Settings.y * this.unitMultiplier || 0, p_Settings.z * this.unitMultiplier || 0), new babylon.Vector3(p_Settings.direction.x || 0, p_Settings.direction.y || 0, p_Settings.direction.z || 0), p_Settings.angle || 0, (p_Settings.reach || 100) * this.unitMultiplier, controlData.scene);
		controlData.lights[light.name] = { light };
		this.setLightColors(p_Settings.color, light.name);
		if (p_Settings.generateShadows) {
			controlData.lights[light.name].shadowGenerator = createShadowGenerator(light);
		}
	}

	removeLight(p_Name) {
		const controlData = this[privateData];
		controlData.lights[p_Name].light.dispose();
		delete controlData.lights[p_Name];
	}

	setLightColors(p_Colors, p_Name) {
		const light = this[privateData].lights[p_Name];
		if (light) {
			if (p_Colors.diffuse) {
				Object.assign(light.light.diffuse, p_Colors.diffuse);
			}
			if (p_Colors.specular) {
				Object.assign(light.light.specular, p_Colors.specular);
			}
		}
	}

	setObjectPosition(p_Object, p_Position) {
		const mesh = getMeshObject(this[privateData], p_Object);
		if (mesh) {
			setPosition(mesh, p_Position, this.unitMultiplier);
		}
	}

	setObjectRotation(p_Object, p_Rotation) {
		const mesh = getMeshObject(this[privateData], p_Object);
		if (mesh) {
			setRotation(mesh, p_Rotation);
		}
	}

	setObjectScale(p_Object, p_Scale) {
		const mesh = getMeshObject(this[privateData], p_Object);
		if (mesh) {
			setScale(mesh, p_Scale);
		}
	}

	setCameraTarget(p_Object) {
		const controlData = this[privateData];
		const mesh = getMeshObject(controlData, p_Object);
		if (mesh) {
			controlData.camera.lockedTarget = mesh;
		}
	}

	addMaterial(p_MaterialName, p_Settings) { return addMaterial(this[privateData], p_MaterialName, p_Settings); }

	setObjectMaterial(p_Objects, p_Material) {
		const controlData = this[privateData];
		if (typeof p_Material === "string") {
			const meshNames = Array.isArray(p_Objects) ? p_Objects : [p_Objects];
			meshNames.forEach((p_Mesh) => {
				const mesh = getMeshObject(controlData, p_Mesh);
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

	setObjectVisibility(p_Object, p_Visible) {
		const mesh = getMeshObject(this[privateData], p_Object);
		if (mesh) {
			applyRecursive(mesh, "isVisible", p_Visible || false);
		}
	}

	isObjectVisible(p_Object) {
		const controlData = this[privateData];
		const mesh = getMeshObject(controlData, p_Object);
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

	enableAllObjectCollisions(p_Excluded) {
		const controlData = this[privateData];
		controlData.allObjectCollisions = true;
		applyAllMeshes(controlData.meshes, p_Excluded || [], "checkCollisions", true);
		applyAllMeshes(controlData.instances, p_Excluded || [], "checkCollisions", true);
	}

	disableAllObjectCollisions(p_Excluded) {
		const controlData = this[privateData];
		controlData.allObjectCollisions = false;
		applyAllMeshes(controlData.meshes, p_Excluded || [], "checkCollisions", false);
		applyAllMeshes(controlData.instances, p_Excluded || [], "checkCollisions", false);
	}

	setCheckCollisionForObject(p_Object, p_Enabled) {
		const controlData = this[privateData];
		const mesh = getMeshObject(controlData, p_Object);
		if (mesh) {
			applyRecursive(mesh, "checkCollisions", p_Enabled);
		}
	}

	getCheckCollisionForObject(p_Object) {
		const controlData = this[privateData];
		const mesh = getMeshObject(controlData, p_Object);
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

	removeObject(p_Object) {
		const mesh = getMeshObject(this[privateData], p_Object);
		if (mesh) {
			mesh.dispose();
		}
	}

	unGroupObject(p_Object) {
		const controlData = this[privateData];
		const mesh = (typeof p_Object === "string") ? controlData.meshes[p_Object] : unWrap(p_Object);
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

	selectObject(p_Object) {
		const controlData = this[privateData];
		const mesh = getMeshObject(controlData, p_Object);
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

	unSelectObject(p_ObjectName) {
		const mesh = getMeshObject(this[privateData], p_ObjectName);
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
		return Object.keys(controlData.meshes).filter((p_Key) => getMeshObject(controlData, p_Key).selected).concat(Object.keys(controlData.instances).filter((p_Key) => getMeshObject(controlData, p_Key).selected));
	}

	unSelectAll() {
		const controlData = this[privateData];
		Object.keys(controlData.meshes).forEach((p_Key) => this.unSelectObject(p_Key));
		Object.keys(controlData.instances).forEach((p_Key) => this.unSelectObject(p_Key));
	}

	isObjectSelected(p_ObjectName) {
		const mesh = getMeshObject(this[privateData], p_ObjectName);
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
