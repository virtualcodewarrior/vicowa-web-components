/* eslint new-cap: ["off"] */
/* switching this off for this file because babylon uses almost all uppercase starting function names */
import { webComponentBaseClass } from "../third_party/web-component-base-class/src/webComponentBaseClass.js";
import { toRadians } from "../utilities/mathHelpers.js";

const babylon = window.BABYLON;
const componentName = "vicowa-webgl";

/**
 * @enum {Readonly<{ORBITAL: string, FREE: string, FOLLOW: string}>}
 */
export const CAMERA_TYPES = Object.freeze({
	ORBITAL: "ORBITAL", // camera points at a fixed point in the scene and can move around it, zoom in or out, but cannot look at a different object
	FREE: "FREE",		// camera can move in all directions and can look in any direction
	FOLLOW: "FOLLOW",	// camera follows a specific object around. The camera can be moved but will keep looking at the object it is following
});

function handleLoadingScreenChange(p_WebGLControl) {
	if (p_WebGLControl._assetsManager) {
		p_WebGLControl._assetsManager.useDefaultLoadingScreen = p_WebGLControl.loadingScreen;
	}
}

function multiplyObject(p_Object, p_Multiplier, p_KeysToMultiply) {
	Object.keys(p_Object).filter((p_Key) => p_KeysToMultiply.indexOf(p_Key) !== -1).forEach((p_Key) => { p_Object[p_Key] = (p_Object[p_Key] || 0) * p_Multiplier; });
	return p_Object;
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
	let mesh = null;
	if (Array.isArray(p_MeshNameOrPath)) {
		// this is a path to the mesh, maybe because we clicked a child mesh
		mesh = p_WebGLControl._meshes[p_MeshNameOrPath[0]] || p_WebGLControl._clones[p_MeshNameOrPath[0]];
		p_MeshNameOrPath.slice(1).forEach((p_Name) => {
			if (mesh) {
				mesh = mesh.getChildMeshes(true, (p_ChildMesh) => p_ChildMesh.name === p_Name)[0];
			}
		});
	} else {
		mesh = p_WebGLControl._meshes[p_MeshNameOrPath] || p_WebGLControl._clones[p_MeshNameOrPath];
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
	Object.keys(p_WebGLControl._lights).forEach((p_Light) => {
		const light = p_WebGLControl._lights[p_Light];
		if (light.shadowGenerator) {
			light.shadowGenerator.addShadowCaster(p_MeshObject);
		}
	});
}

function applyRecursive(p_Mesh, p_PropertyName, p_PropertyValue) {
	p_Mesh[p_PropertyName] = p_PropertyValue;
	p_Mesh.getChildMeshes(true).forEach((p_Child) => { p_Child[p_PropertyName] = p_PropertyValue; });
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
				const material = p_WebGLControl._materials[p_Settings.material];
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
		applyRecursive(p_MeshObject, "checkCollisions", (p_Settings.collisions === undefined) ? p_WebGLControl._allObjectCollisions : p_Settings.collisions);
		p_WebGLControl._meshes[p_Name] = p_MeshObject;

		Object.keys(p_WebGLControl._lights).forEach((p_Key) => {
			if (p_WebGLControl._lights[p_Key].shadowGenerator) {
				p_WebGLControl._lights[p_Key].shadowGenerator.recreateShadowMap();
			}
		});
	}
}

function addClone(p_WebGLControl, p_Name, p_MeshObject, p_Settings) {
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
		applyRecursive(p_MeshObject, "checkCollisions", (p_Settings.collisions === undefined) ? p_WebGLControl._allObjectCollisions : p_Settings.collisions);
		p_WebGLControl._clones[p_Name] = p_MeshObject;
	}
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
		this._clones = {};
		this._materials = {};
		this._allObjectCollisions = true; // by default, all objects will do collision checking
		this._defaultShadows = true; // by default all objects cast shadows, this can be changed either per object or as a global setting
		this._multiplier = 10;
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

	async addObjectResource(p_Name, p_MeshName, p_FileName, p_Settings) {
		const meshTask = this._assetsManager.addMeshTask(p_Name, p_MeshName, `${p_FileName.split("/").slice(0, -1).join("/")}/`, p_FileName.split("/").slice(-1)[0]);
		return await new Promise((resolve, reject) => {
			meshTask.onSuccess = (task) => {
				if (!p_Settings.position) {
					p_Settings.position = { x: 0, y: 0, z: 0 };
				}
				if (task.loadedMeshes.length === 1) {
					addMesh(this, p_Name, task.loadedMeshes[0], p_Settings);
				} else {
					const mesh = new babylon.Mesh(p_Name, this._scene);
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
			this._assetsManager.load();
		});
	}

	set unitMultiplier(p_Multiplier) { this._multiplier = p_Multiplier; }
	get unitMultiplier() { return this._multiplier; }

	setBackgroundColor(p_Red, p_Green, p_Blue) { this._scene.clearColor = new babylon.Color3(p_Red, p_Green, p_Blue); }
	setAmbientColor(p_Red, p_Green, p_Blue) { this._scene.ambientColor = new babylon.Color3(p_Red, p_Green, p_Blue); }

	createSkyBox(p_SkyBoxImageDirectory) {
		// using the "old" way of creating skybox, because the helper function makes it very very slow
		const skybox = babylon.MeshBuilder.CreateBox("skyBox", { size: 10000.0, sideOrientation: babylon.Mesh.BACKSIDE }, this._scene);
		const skyboxMaterial = new babylon.StandardMaterial("skyBox", this._scene);
		skyboxMaterial.backFaceCulling = true;
		skyboxMaterial.reflectionTexture = new babylon.CubeTexture(p_SkyBoxImageDirectory, this._scene);
		skyboxMaterial.reflectionTexture.coordinatesMode = babylon.Texture.SKYBOX_MODE;
		skyboxMaterial.diffuseColor = new babylon.Color3(0, 0, 0);
		skyboxMaterial.specularColor = new babylon.Color3(0, 0, 0);
		skyboxMaterial.disableLighting = true;
		skybox.material = skyboxMaterial;
		skybox.infiniteDistance = true;
		skybox.renderingGroupId = 0;
	}

	addSphere(p_Name, p_Settings) {
		const sphere = babylon.MeshBuilder.CreateSphere(p_Name, { segments: p_Settings.segments || 16, diameter: (p_Settings.diameter || 1) * this.unitMultiplier, diameterX: (p_Settings.diameterX || p_Settings.diameter || 1) * this.unitMultiplier, diameterY: (p_Settings.diameterY || p_Settings.diameter || 1) * this.unitMultiplier, diameterZ: (p_Settings.diameterZ || p_Settings.diameter || 1) * this.unitMultiplier, arc: p_Settings.arc || 1, slice: p_Settings.slice || 1, sideOrientation: p_Settings.sideOrientation }, this._scene);
		addMesh(this, p_Name, sphere, p_Settings);
		return sphere;
	}

	addBox(p_Name, p_Settings) {
		const box = babylon.MeshBuilder.CreateBox(p_Name, { width: (p_Settings.width || 1) * this.unitMultiplier, height: (p_Settings.height || 1) * this.unitMultiplier, depth: (p_Settings.depth || 1) * this.unitMultiplier, sideOrientation: p_Settings.sideOrientation }, this._scene);
		addMesh(this, p_Name, box, p_Settings);
		return box;
	}

	addPlane(p_Name, p_Settings) {
		const plane = babylon.MeshBuilder.CreatePlane(p_Name, { width: (p_Settings.width || 1) * this.unitMultiplier, height: (p_Settings.height || 1) * this.unitMultiplier, sideOrientation: p_Settings.sideOrientation }, this._scene);
		addMesh(this, p_Name, plane, p_Settings);
		return plane;
	}

	addGround(p_Name, p_Settings) {
		const ground = babylon.MeshBuilder.CreateGround(p_Name, { width: (p_Settings.width || 1) * this.unitMultiplier, height: (p_Settings.height || 1) * this.unitMultiplier, subdivisions: p_Settings.subdivisions || 1 }, this._scene);
		this._meshes[p_Name] = ground;
		ground.receiveShadows = true;
		ground.checkCollisions = this._allObjectCollisions;
		return ground;
	}

	addPolyline(p_Name, p_Settings) {
		const linePoints = p_Settings.points.map((p_Point) => new babylon.Vector3(p_Point.x * this.unitMultiplier, p_Point.y * this.unitMultiplier, p_Point.z * this.unitMultiplier));
		const polyLine = (linePoints.length > 1) ? babylon.MeshBuilder.CreateLines(p_Name, { points: linePoints }, this._scene) : null;
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
			}, this._scene);
			addMesh(this, p_Name, polygon, p_Settings);
		}
	}

	cloneObject(p_ObjectNamePrefix, p_SourceName, p_Copies, p_Settings) {
		const mesh = this._meshes[p_SourceName];
		if (mesh) {
			const copies = p_Copies || 1;
			for (let index = 0; index < copies; index++) {
				const cloneName = p_ObjectNamePrefix + index;
				addClone(this, cloneName, mesh.createInstance(cloneName), p_Settings);
			}
		}
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
		const light = new babylon.PointLight(p_Name, new babylon.Vector3(p_Settings.x * this.unitMultiplier || 0, p_Settings.y * this.unitMultiplier || 0, p_Settings.z * this.unitMultiplier || 0), this._scene);
		this._lights[p_Name] = light;
		if (p_Settings.generateShadows) {
			this._lights[p_Name].shadowGenerator = createShadowGenerator(this, light);
		}
	}

	addSpotLight(p_Name, p_Settings) {
		const light = new babylon.SpotLight(p_Name, new babylon.Vector3(p_Settings.x * this.unitMultiplier || 0, p_Settings.y * this.unitMultiplier || 0, p_Settings.z * this.unitMultiplier || 0), new babylon.Vector3(p_Settings.direction.x || 0, p_Settings.direction.y || 0, p_Settings.direction.z || 0), p_Settings.angle || 0, (p_Settings.reach || 100) * this.unitMultiplier, this._scene);
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

	setObjectPosition(p_Name, p_Position) {
		const mesh = this._meshes[p_Name] || this._clones[p_Name];
		if (mesh) {
			setPosition(mesh, p_Position, this.unitMultiplier);
		}
	}

	setObjectRotation(p_Name, p_Rotation) {
		const mesh = this._meshes[p_Name] || this._clones[p_Name];
		if (mesh) {
			setRotation(mesh, p_Rotation);
		}
	}

	setObjectScale(p_Name, p_Scale) {
		const mesh = this._meshes[p_Name] || this._clones[p_Name];
		if (mesh) {
			setScale(mesh, p_Scale);
		}
	}

	setGroundLightColor(p_Name, p_Color) {
		const light = this._lights[p_Name];
		if (light && light instanceof babylon.HemisphericLight) {
			Object.assign(light.groundColor, p_Color);
		}
	}

	setCameraTarget(p_ObjectName) {
		const mesh = this._meshes[p_ObjectName];
		if (mesh) {
			this._camera.lockedTarget = mesh;
		}
	}

	addMaterial(p_MaterialName, p_Settings) {
		const material = this._materials[p_MaterialName] || new babylon.StandardMaterial(p_MaterialName, this._scene);
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
				material.diffuseTexture = new babylon.Texture(p_Settings.texture.src, this._scene);
				material.diffuseTexture.hasAlpha = p_Settings.texture.alpha || false;
			}
			if (p_Settings.texture.bumpSrc) {
				material.bumpTexture = new babylon.Texture(p_Settings.texture.bumpSrc, this._scene);
			}
			if (p_Settings.texture.opacitySrc) {
				material.opacityTexture = new babylon.Texture(p_Settings.texture.opacitySrc, this._scene);
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
		this._materials[p_MaterialName] = material;
		return material;
	}

	setObjectMaterial(p_ObjectNames, p_Material) {
		if (typeof p_Material === "string") {
			const meshNames = Array.isArray(p_ObjectNames) ? p_ObjectNames : [p_ObjectNames];
			meshNames.forEach((p_MeshName) => {
				const mesh = this._meshes[p_MeshName];
				const material = this._materials[p_Material];
				if (mesh && material) {
					mesh.material = material;
				}
			});
		}
	}

	setGravity(p_Settings) {
		Object.assign(this._scene.gravity, p_Settings);
	}

	set defaultShadows(p_Shadows) { this._defaultShadows = p_Shadows; }
	get defaultShadows() { return this._defaultShadows; }

	set cameraGravity(p_Gravity) { this._camera.applyGravity = p_Gravity; }
	get cameraGravity() { return this._camera.applyGravity; }

	set cameraCollisions(p_Collisions) { this._camera.checkCollisions = p_Collisions; }
	get cameraCollisions() { return this._camera.checkCollisions; }

	setObjectVisibility(p_ObjectName, p_Visible) {
		const mesh = this._meshes[p_ObjectName];
		if (mesh) {
			mesh.isVisible = p_Visible || false;
		}
	}

	isObjectVisible(p_ObjectName) {
		const mesh = this._meshes[p_ObjectName];
		return (mesh) ? mesh.isVisible : undefined;
	}

	setVirtualBody(p_Settings) {
		if (this._camera) {
			if (this._camera instanceof babylon.ArcRotateCamera) {
				Object.assign(this._camera.collisionRadius, multiplyVector(p_Settings.bodySize || {}, this.unitMultiplier));
			} else {
				Object.assign(this._camera.ellipsoid, multiplyVector(p_Settings.bodySize || {}, this.unitMultiplier));
				Object.assign(this._camera.ellipsoidOffset, multiplyVector(p_Settings.eyeOffset || {}, this.unitMultiplier));
			}
		} else {
			throw new Error("make sure to set a camera before calling this function");
		}
	}

	enableAllObjectCollisions(p_ExcludedNames) {
		this._allObjectCollisions = true;
		applyAllMeshes(this._meshes, p_ExcludedNames || [], "checkCollisions", true);
		applyAllMeshes(this._clones, p_ExcludedNames || [], "checkCollisions", true);
	}

	disableAllObjectCollisions(p_ExcludedNames) {
		this._allObjectCollisions = false;
		applyAllMeshes(this._meshes, p_ExcludedNames || [], "checkCollisions", false);
		applyAllMeshes(this._clones, p_ExcludedNames || [], "checkCollisions", false);
	}

	setCheckCollisionForObject(p_ObjectName, p_Enabled) {
		const mesh = this._meshes[p_ObjectName];
		if (mesh) {
			applyRecursive(mesh, "checkCollisions", p_Enabled);
		}
	}

	getCheckCollisionForObject(p_ObjectName) {
		const mesh = this._meshes[p_ObjectName];
		return (mesh) ? mesh.checkCollisions : undefined;
	}

	setFog(p_Enabled, p_Settings) {
		// fog
		this._scene.fogEnabled = p_Enabled;
		this._scene.fogMode = babylon.Scene.FOGMODE_EXP;
		if (p_Settings.density) {
			this._scene.fogDensity = p_Settings.density;
		}
		if (p_Settings.color) {
			this._scene.fogColor = new babylon.Color3(p_Settings.color.r, p_Settings.color.g, p_Settings.color.b);
		}
	}

	/**
	 * Set the camera to use
	 * @param {CAMERA_TYPES} p_Type The type of camera to create
	 * @param {object} p_Settings The settings for creating the camera
	 */
	setCamera(p_Type, p_Settings) {
		p_Settings = p_Settings || {};
		if (this._camera) {
			this._camera.dispose();
		}
		switch (p_Type) {
			case CAMERA_TYPES.ORBITAL: {
				// if no positions are specified, the camera will be positioned at a distance of 10 a longitude of 0 and a latitude of 45 degrees and point at 0, 0, 0
				const position = Object.assign({}, { longitude: 0, latitude: 45, distance: 10 }, p_Settings.position);
				const target = Object.assign({}, { x: 0, y: 0, z: 0 }, p_Settings.target || {});
				this._camera = new babylon[(p_Settings.vrEnabled) ? "VRDeviceOrientationArcRotateCamera" : "ArcRotateCamera"]("camera", toRadians(position.longitude), toRadians(position.latitude), position.distance * this.unitMultiplier, new babylon.Vector3(target.x * this.unitMultiplier, target.y * this.unitMultiplier, target.z * this.unitMultiplier), this._scene);
				this._camera.attachControl(this.$.canvas, !(p_Settings.preventDefault || false));
				if (p_Settings.minLongitude) {
					this._camera.lowerAlphaLimit = toRadians(p_Settings.minLongitude);
				}
				if (p_Settings.maxLongitude) {
					this._camera.upperAlphaLimit = toRadians(p_Settings.maxLongitude);
				}
				if (p_Settings.minLatitude) {
					this._camera.lowerBetaLimit = toRadians(p_Settings.minLatitude);
				}
				if (p_Settings.maxLatitude) {
					this._camera.upperBetaLimit = toRadians(p_Settings.maxLatitude);
				}
				if (p_Settings.minDistance) {
					this._camera.lowerRadiusLimit = p_Settings.minDistance * this.unitMultiplier;
				}
				if (p_Settings.maxDistance) {
					this._camera.upperRadiusLimit = p_Settings.maxDistance * this.unitMultiplier;
				}
				if (p_Settings.targetMesh) {
					this._camera.lockedTarget = p_Settings.targetMesh;
				}
				break;
			}
			case CAMERA_TYPES.FREE: {
				// if no positions are specified, the camera will be positioned at 0 0 -10 and will be pointing at 0, 0, 0
				const position = Object.assign({}, { x: 0, y: 0, z: -10 }, p_Settings.position || {});
				const target = Object.assign({}, { x: 0, y: 0, z: 0 }, p_Settings.target || {});
				this._camera = new babylon[(p_Settings.vrEnabled) ? ((p_Settings.mobile) ? "VRDeviceOrientationFreeCamera" : "WebVRFreeCamera") : "UniversalCamera"]("camera", new babylon.Vector3(position.x * this.unitMultiplier, position.y * this.unitMultiplier, position.z * this.unitMultiplier), this._scene);
				this._camera.attachControl(this.$.canvas, !(p_Settings.preventDefault || false));
				this._camera.setTarget(new babylon.Vector3(target.x * this.unitMultiplier, target.y * this.unitMultiplier, target.z * this.unitMultiplier));
				break;
			}
			case CAMERA_TYPES.FOLLOW: {
				const position = Object.assign({}, { x: 0, y: 0, z: -10 }, p_Settings.position || {});
				// if no positions are specified, the camera will be positioned at 0 0 -10 and will be pointing at 0, 0, 0
				this._camera = new babylon.FollowCamera("camera", new babylon.Vector3(position.x * this.unitMultiplier, position.y * this.unitMultiplier, position.z * this.unitMultiplier), this._scene);
				this._camera.attachControl(this.$.canvas, !(p_Settings.preventDefault || false));
				if (p_Settings.targetMesh) {
					this._camera.lockedTarget = p_Settings.targetMesh;
				}
				const follow = Object.assign({}, {
					radius: this._camera.radius,
					heightAbove: this._camera.heightOffset,
					rotation: this._camera.rotationOffset,
					acceleration: this._camera.cameraAcceleration,
					maxSpeed: this._camera.maxCameraSpeed,
				}, multiplyObject(p_Settings.follow, this.unitMultiplier, ["radius", "heightAbove"]));
				this._camera.radius = follow.radius;
				this._camera.heightOffset = follow.heightAbove;
				this._camera.rotationOffset = toRadians(follow.rotation);
				this._camera.cameraAcceleration = follow.acceleration;
				this._camera.maxCameraSpeed = follow.maxSpeed;
				break;
			}
			default:
				throw new Error(`Unknown camera type ${p_Type}`);
		}
		// this._camera.useFramingBehavior = true;
	}

	removeObject(p_ObjectName) {
		let mesh = this._meshes[p_ObjectName];
		if (mesh) {
			mesh.dispose();
			delete this._meshed[p_ObjectName];
		} else {
			mesh = this._clones[p_ObjectName];
			if (mesh) {
				mesh.dispose();
				delete this._clones[p_ObjectName];
			}
		}
	}

	ungroupObject(p_ObjectName) {
		const mesh = this._meshes[p_ObjectName];
		const newObjects = [];
		const childMeshes = (mesh) ? mesh.getChildMeshes(true) : [];
		childMeshes.forEach((p_Mesh) => {
			mesh.removeChild(p_Mesh);
			newObjects.push(p_Mesh.name);
			this._meshes[p_Mesh.name] = p_Mesh;
		});
		return newObjects;
	}

	groupObjects(p_ObjectNames, p_NewName) {
		const meshes = [];
		let newMesh = null;
		p_ObjectNames.forEach((p_Name) => { const mesh = this._meshes[p_Name]; if (mesh) { meshes.push(mesh); } });
		if (meshes.length) {
			newMesh = new babylon.Mesh(p_NewName, this._scene);
			meshes.forEach((p_NewChild) => { newMesh.addChild(p_NewChild); delete this._meshes[p_NewChild.name]; });
			this._meshes[p_NewName] = newMesh;
		}
		return (newMesh) ? newMesh.name : null;
	}

	selectObject(p_ObjectName) {
		const mesh = getMeshObject(this, p_ObjectName);
		if (mesh) {
			const allMeshes = flattenMeshes(mesh);
			allMeshes.forEach((p_Mesh) => {
				p_Mesh.selected = true;
				p_Mesh.showBoundingBox = true;
				p_Mesh.notSelectMaterial = p_Mesh.material;
				if (p_Mesh.material && p_Mesh.material.hasOwnProperty("diffuseColor")) {
					p_Mesh.material = p_Mesh.material.clone("temp");
					p_Mesh.material.diffuseColor = this._materials["selected"].diffuseColor;
					p_Mesh.material.alpha = Math.max(0.5, p_Mesh.material.alpha);
				} else {
					p_Mesh.material = this._materials["selected"].clone();
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

	unselectAll() {
		Object.keys(this._meshes).forEach((p_Key) => this.unselectObject(p_Key));
		Object.keys(this._clones).forEach((p_Key) => this.unselectObject(p_Key));
	}

	isObjectSelected(p_ObjectName) {
		const mesh = getMeshObject(this, p_ObjectName);
		return mesh && mesh.selected;
	}

	set selectColor(p_Color) { Object.assign(this._materials["selected"].diffuseColor, p_Color); }
	get selectColor() { const color = (this._materials["selected"] || {}).diffuseColor; return { r: color.r || 1, g: color.g || 0, b: color.b || 0 }; }

	attached() {
		// create the engine
		this._engine = new babylon.Engine(this.$.canvas, true, { preserveDrawingBuffer: true, stencil: true });
		const createScene = () => {
			// Create a Scene object
			this._scene = new babylon.Scene(this._engine);
			this._scene.collisionsEnabled = true;
			this._scene.workerCollisions = true; // use web workers for collisions

			this.addMaterial("selected", { diffuse: { r: 1, g: 0, b: 0 } });

			this._assetsManager = new babylon.AssetsManager(this._scene);
			this._assetsManager.useDefaultLoadingScreen = this.loadingScreen;

			const options = new babylon.SceneOptimizerOptions();
			options.addOptimization(new babylon.HardwareScalingOptimization(0, 1));

			// Optimizer
			this.optimizer = new babylon.SceneOptimizer(this._scene, options);

			this._assetsManager.onFinish = () => {
				this.stopRendering();
				this.startRendering();
			};
		};

		createScene();

		this._scene.onPointerObservable.add((p_Event) => {
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
			this._engine.resize();
		}, this);
	}
}

window.customElements.define(componentName, VicowaWebgl);
